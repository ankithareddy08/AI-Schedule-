from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATASET_DIR = ROOT.parent / "dataset"
OUTPUT_PATH = ROOT / "lib" / "model-artifact.json"


PREFERRED_TIME_CENTERS = {
    "morning": 10.0,
    "neutral": 13.0,
    "afternoon": 15.5,
}


def sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(x, -40, 40)))


def dnd_flag(start: str | None, end: str | None, slot_minutes: int) -> int:
    if not start or not end:
        return 0

    def to_minutes(value: str) -> int:
        hours, minutes = value.split(":")
        return int(hours) * 60 + int(minutes)

    start_minutes = to_minutes(start)
    end_minutes = to_minutes(end)
    if end_minutes < start_minutes:
        return int(slot_minutes >= start_minutes or slot_minutes < end_minutes)
    return int(start_minutes <= slot_minutes < end_minutes)


def add_runway(slots: pd.DataFrame) -> pd.DataFrame:
    ordered = slots.sort_values(["user_id", "date", "start_time"]).copy()
    ordered["runway_blocks"] = 0

    for (_, _), group in ordered.groupby(["user_id", "date"]):
        free = ((group["is_busy"] == 0) & (group["is_conflict"] == 0)).to_numpy(dtype=int)
        runway = np.zeros(len(group), dtype=int)
        streak = 0
        for idx in range(len(group) - 1, -1, -1):
            streak = streak + 1 if free[idx] else 0
            runway[idx] = streak
        ordered.loc[group.index, "runway_blocks"] = runway

    return ordered


def feature_frame(base: pd.DataFrame, durations: list[int], urgencies: list[int]) -> pd.DataFrame:
    rows: list[pd.DataFrame] = []
    for duration in durations:
        blocks = duration // 30
        for urgency in urgencies:
            frame = base.copy()
            frame["request_duration"] = duration
            frame["request_blocks"] = blocks
            frame["urgency_level"] = urgency
            frame["duration_fit"] = (frame["runway_blocks"] >= blocks).astype(int)
            frame["runway_margin"] = frame["runway_blocks"] - blocks
            frame["duration_gap"] = (frame["preferred_duration"] - duration).abs()
            frame["focus_x_urgency"] = frame["focus_score"] * (urgency + 1)
            frame["meeting_load_gap"] = frame["meeting_count_that_day"] - frame["avg_meetings_per_day"]
            frame["synthetic_label"] = (
                (frame["label"] == 1)
                & (frame["duration_fit"] == 1)
                & (frame["is_busy"] == 0)
                & (frame["is_conflict"] == 0)
            ).astype(int)
            rows.append(frame)
    return pd.concat(rows, ignore_index=True)


def build_features(frame: pd.DataFrame) -> tuple[np.ndarray, list[str]]:
    hour_center = frame["preferred_time"].map(PREFERRED_TIME_CENTERS).fillna(13.0)
    hour_distance = (frame["hour"] - hour_center).abs()
    meeting_load = frame["meeting_count_that_day"] / frame["avg_meetings_per_day"].replace(0, 1)
    slot_minutes = frame["hour"] * 60 + np.where(frame["start_time"].str.endswith(":30"), 30, 0)
    dnd = [
        dnd_flag(start, end, int(minutes))
        for start, end, minutes in zip(
            frame["do_not_disturb_start"],
            frame["do_not_disturb_end"],
            slot_minutes,
        )
    ]

    features = pd.DataFrame(
        {
            "focus_score": frame["focus_score"],
            "is_busy": frame["is_busy"],
            "is_conflict": frame["is_conflict"],
            "meeting_count_that_day": frame["meeting_count_that_day"],
            "runway_blocks": frame["runway_blocks"],
            "request_blocks": frame["request_blocks"],
            "duration_fit": frame["duration_fit"],
            "runway_margin": frame["runway_margin"],
            "duration_gap": frame["duration_gap"],
            "urgency_level": frame["urgency_level"],
            "focus_x_urgency": frame["focus_x_urgency"],
            "meeting_load_gap": frame["meeting_load_gap"],
            "meeting_load_ratio": meeting_load,
            "hour_distance_from_preference": hour_distance,
            "dnd_overlap": dnd,
            "hour_sin": np.sin((frame["hour"] / 24.0) * 2 * math.pi),
            "hour_cos": np.cos((frame["hour"] / 24.0) * 2 * math.pi),
            "dow_sin": np.sin((frame["day_of_week"] / 7.0) * 2 * math.pi),
            "dow_cos": np.cos((frame["day_of_week"] / 7.0) * 2 * math.pi),
        }
    )
    return features.to_numpy(dtype=float), features.columns.tolist()


@dataclass
class TrainResult:
    weights: np.ndarray
    bias: float
    means: np.ndarray
    stds: np.ndarray


def train_logistic_regression(x: np.ndarray, y: np.ndarray, epochs: int = 2500, lr: float = 0.04, l2: float = 0.002) -> TrainResult:
    means = x.mean(axis=0)
    stds = x.std(axis=0)
    stds[stds == 0] = 1.0
    x_scaled = (x - means) / stds

    weights = np.zeros(x_scaled.shape[1], dtype=float)
    bias = 0.0

    positives = max(float(y.sum()), 1.0)
    negatives = max(float(len(y) - y.sum()), 1.0)
    sample_weights = np.where(y == 1, negatives / positives, 1.0)
    sample_weights /= sample_weights.mean()

    for _ in range(epochs):
        logits = x_scaled @ weights + bias
        preds = sigmoid(logits)
        error = (preds - y) * sample_weights

        grad_w = (x_scaled.T @ error) / len(x_scaled) + l2 * weights
        grad_b = error.mean()

        weights -= lr * grad_w
        bias -= lr * grad_b

    return TrainResult(weights=weights, bias=bias, means=means, stds=stds)


def evaluate(x: np.ndarray, y: np.ndarray, model: TrainResult) -> dict[str, float]:
    scaled = (x - model.means) / model.stds
    probs = sigmoid(scaled @ model.weights + model.bias)
    preds = (probs >= 0.5).astype(int)

    accuracy = float((preds == y).mean())
    tp = int(((preds == 1) & (y == 1)).sum())
    fp = int(((preds == 1) & (y == 0)).sum())
    fn = int(((preds == 0) & (y == 1)).sum())
    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)

    return {
        "accuracy": round(accuracy, 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "positive_rate": round(float(y.mean()), 4),
    }


def main() -> None:
    slots = pd.read_csv(DATASET_DIR / "time_slots.csv")
    profiles = pd.read_json(DATASET_DIR / "user_profiles.json")

    slots = add_runway(slots)
    merged = slots.merge(profiles, on="user_id", how="left")
    training = feature_frame(merged, durations=[30, 60, 90], urgencies=[0, 1, 2])
    x, feature_names = build_features(training)
    y = training["synthetic_label"].to_numpy(dtype=float)

    rng = np.random.default_rng(42)
    indices = np.arange(len(training))
    rng.shuffle(indices)
    split = int(len(indices) * 0.8)
    train_idx, test_idx = indices[:split], indices[split:]

    model = train_logistic_regression(x[train_idx], y[train_idx])
    metrics = evaluate(x[test_idx], y[test_idx], model)

    artifact = {
        "model_type": "logistic_regression_numpy",
        "dataset_rows": int(len(slots)),
        "augmented_rows": int(len(training)),
        "feature_names": feature_names,
        "weights": [round(float(value), 8) for value in model.weights.tolist()],
        "bias": round(float(model.bias), 8),
        "means": [round(float(value), 8) for value in model.means.tolist()],
        "stds": [round(float(value), 8) for value in model.stds.tolist()],
        "metrics": metrics,
        "training_notes": [
            "Base training target comes from dataset/time_slots.csv label column.",
            "Feature augmentation adds user preference, DND, runway, duration, and urgency context.",
            "Runtime ranking reuses the exported coefficients for every candidate slot.",
        ],
    }

    OUTPUT_PATH.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    print(f"Wrote model artifact to {OUTPUT_PATH}")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
