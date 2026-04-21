"""
Flashback Labs Hackathon — Problem 2
Dataset Generator: AI-Powered Smart Meeting Scheduler
Generates synthetic calendar + behavior data for ML model training.
"""

import csv
import json
import random
from datetime import datetime, timedelta

random.seed(42)

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
NUM_USERS       = 8
DAYS            = 14           # two weeks of history
WORKING_HOURS   = (9, 18)      # 9 AM – 6 PM
SLOT_DURATION   = 30           # minutes per slot
OUTPUT_DIR      = "."          # write files here

MEETING_TYPES = ["1:1", "team_sync", "client_call", "focus_block", "interview", "brainstorm"]

# Focus score: 0.0 (low) → 1.0 (peak). Models daily human rhythm.
FOCUS_CURVE = {
    9: 0.60, 10: 0.85, 11: 0.90, 12: 0.65,
    13: 0.45, 14: 0.55, 15: 0.70, 16: 0.80,
    17: 0.60, 18: 0.40,
}

# Per-user preference bias: some people are morning people, some afternoon
USER_PREFERENCE_BIAS = {
    uid: random.choice(["morning", "afternoon", "neutral"])
    for uid in range(1, NUM_USERS + 1)
}

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
START_DATE = datetime(2025, 1, 6)   # Monday

def all_slots(day_offset: int):
    """Return all 30-min slot start times for a given day."""
    base = START_DATE + timedelta(days=day_offset)
    slots = []
    h, end = WORKING_HOURS
    while h < end:
        slots.append(base.replace(hour=h, minute=0))
        slots.append(base.replace(hour=h, minute=30))
        h += 1
    return slots

def focus_score(dt: datetime, bias: str) -> float:
    base = FOCUS_CURVE.get(dt.hour, 0.5)
    if bias == "morning":
        boost = 0.10 if dt.hour < 12 else -0.10
    elif bias == "afternoon":
        boost = -0.10 if dt.hour < 12 else 0.10
    else:
        boost = 0.0
    return round(min(1.0, max(0.0, base + boost + random.uniform(-0.05, 0.05))), 3)

def meeting_duration_slots() -> int:
    """Random meeting duration: 1 or 2 slots (30 or 60 min)."""
    return random.choice([1, 1, 1, 2, 2])

# ─────────────────────────────────────────────
# 1. CALENDAR EVENTS  →  calendar_events.csv
#    Columns: event_id, user_id, date, start_time, end_time,
#             meeting_type, is_conflict, duration_minutes
# ─────────────────────────────────────────────
def generate_calendar_events() -> list[dict]:
    events = []
    eid = 1
    for user_id in range(1, NUM_USERS + 1):
        for day in range(DAYS):
            slots = all_slots(day)
            # each user fills 30–60% of their day with events
            busy_count = random.randint(int(len(slots) * 0.3), int(len(slots) * 0.6))
            busy_slots = random.sample(slots, busy_count)
            # detect "conflicts": two events starting within 30 min
            busy_slots_sorted = sorted(busy_slots)
            conflicts = set()
            for i in range(1, len(busy_slots_sorted)):
                if (busy_slots_sorted[i] - busy_slots_sorted[i-1]).seconds < 1800:
                    conflicts.add(busy_slots_sorted[i])

            for slot in busy_slots:
                dur = meeting_duration_slots()
                events.append({
                    "event_id":         eid,
                    "user_id":          user_id,
                    "date":             slot.strftime("%Y-%m-%d"),
                    "start_time":       slot.strftime("%H:%M"),
                    "end_time":         (slot + timedelta(minutes=30 * dur)).strftime("%H:%M"),
                    "meeting_type":     random.choice(MEETING_TYPES),
                    "is_conflict":      int(slot in conflicts),
                    "duration_minutes": 30 * dur,
                })
                eid += 1
    return events

# ─────────────────────────────────────────────
# 2. TIME SLOT FEATURES  →  time_slots.csv
#    Columns: slot_id, user_id, date, start_time,
#             focus_score, is_busy, day_of_week,
#             hour, meeting_count_that_day, label
#
#    label = 1 (historically user accepted/scheduled here)
#          = 0 (historically avoided or conflicted)
# ─────────────────────────────────────────────
def generate_time_slots(events: list[dict]) -> list[dict]:
    # build busy set per user
    busy_lookup: dict[tuple, bool] = {}
    conflict_lookup: dict[tuple, bool] = {}
    meeting_count_per_day: dict[tuple, int] = {}

    for e in events:
        key = (e["user_id"], e["date"], e["start_time"])
        busy_lookup[key] = True
        if e["is_conflict"]:
            conflict_lookup[key] = True
        day_key = (e["user_id"], e["date"])
        meeting_count_per_day[day_key] = meeting_count_per_day.get(day_key, 0) + 1

    rows = []
    sid = 1
    for user_id in range(1, NUM_USERS + 1):
        bias = USER_PREFERENCE_BIAS[user_id]
        for day in range(DAYS):
            for slot in all_slots(day):
                date_str  = slot.strftime("%Y-%m-%d")
                time_str  = slot.strftime("%H:%M")
                key       = (user_id, date_str, time_str)
                day_key   = (user_id, date_str)
                is_busy   = int(busy_lookup.get(key, False))
                conflict  = int(conflict_lookup.get(key, False))
                f_score   = focus_score(slot, bias)
                mtg_count = meeting_count_per_day.get(day_key, 0)

                # label: good slot = not busy, high focus, no conflict
                if is_busy == 0 and f_score >= 0.70 and not conflict:
                    label = 1
                elif is_busy == 1 or conflict:
                    label = 0
                else:
                    label = int(random.random() > 0.5)

                rows.append({
                    "slot_id":              sid,
                    "user_id":              user_id,
                    "date":                 date_str,
                    "start_time":           time_str,
                    "hour":                 slot.hour,
                    "day_of_week":          slot.weekday(),   # 0=Mon, 4=Fri
                    "focus_score":          f_score,
                    "is_busy":              is_busy,
                    "is_conflict":          conflict,
                    "meeting_count_that_day": mtg_count,
                    "label":                label,            # TARGET for ML
                })
                sid += 1
    return rows

# ─────────────────────────────────────────────
# 3. USER BEHAVIOR PROFILE  →  user_profiles.json
#    One record per user summarizing preferences
# ─────────────────────────────────────────────
def generate_user_profiles() -> list[dict]:
    profiles = []
    for uid in range(1, NUM_USERS + 1):
        bias = USER_PREFERENCE_BIAS[uid]
        profiles.append({
            "user_id":              uid,
            "preferred_time":       bias,
            "avg_meetings_per_day": round(random.uniform(2.5, 6.5), 1),
            "preferred_duration":   random.choice([30, 30, 60]),
            "do_not_disturb_start": "12:30" if random.random() > 0.5 else None,
            "do_not_disturb_end":   "13:30" if random.random() > 0.5 else None,
            "preferred_meeting_types": random.sample(MEETING_TYPES, 3),
        })
    return profiles

# ─────────────────────────────────────────────
# WRITE OUTPUT
# ─────────────────────────────────────────────
def write_csv(rows: list[dict], filename: str):
    if not rows:
        return
    with open(f"{OUTPUT_DIR}/{filename}", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"  ✓ {filename}  ({len(rows)} rows)")

def write_json(data, filename: str):
    with open(f"{OUTPUT_DIR}/{filename}", "w") as f:
        json.dump(data, f, indent=2)
    print(f"  ✓ {filename}  ({len(data)} records)")

if __name__ == "__main__":
    print("\n── Flashback Labs Hackathon Dataset Generator ──\n")

    events   = generate_calendar_events()
    slots    = generate_time_slots(events)
    profiles = generate_user_profiles()

    write_csv(events,   "calendar_events.csv")
    write_csv(slots,    "time_slots.csv")
    write_json(profiles, "user_profiles.json")

    print("\nFiles written to current directory.")
    print("time_slots.csv → use 'label' column as your ML training target.")
    print("────────────────────────────────────────────────\n")