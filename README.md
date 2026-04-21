# Aura Sync — AI-Powered Meeting Scheduler

An intelligent scheduling assistant that uses **Gemini 2.5 Flash** for natural language intent parsing and a **trained logistic regression ML model** for slot ranking. Available as a Next.js web app and a React Native Android app.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Web App Setup & Commands](#web-app-setup--commands)
6. [Android App Setup & Commands](#android-app-setup--commands)
7. [Environment Variables](#environment-variables)
8. [API Endpoints](#api-endpoints)
9. [ML Model](#ml-model)
10. [Workflow Diagram](#workflow-diagram)
11. [Test Prompts](#test-prompts)
12. [Troubleshooting](#troubleshooting)

---

## How It Works

```
User types:  "Schedule a 1-hour team sync this Friday afternoon"
                │
                ▼
     ┌─────────────────────┐
     │  Gemini 2.5 Flash   │  ← parses intent only (no scheduling)
     │  Intent Parser      │
     └──────────┬──────────┘
                │  { action, durationMinutes, urgency,
                │    timePreference, datePreference,
                │    hardConstraints, participants }
                ▼
     ┌─────────────────────┐
     │  Feature Builder    │  ← loads calendar_events.csv +
     │                     │    user_profiles.json
     └──────────┬──────────┘
                │  19 engineered features per candidate slot
                ▼
     ┌─────────────────────┐
     │  Logistic Regression│  ← uses model-artifact.json weights
     │  ML Ranker          │    (trained offline, runs at runtime)
     └──────────┬──────────┘
                │  Ranked recommendations with scores + explanations
                ▼
     ┌─────────────────────┐
     │  Human Confirmation │  ← no calendar mutation until user confirms
     └─────────────────────┘
```

**Key constraint:** The LLM only parses intent. All scheduling decisions are made by the trained ML model.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web frontend + API | Next.js 16.2, React 19.2, TypeScript 5.7 |
| Styling | Tailwind CSS 4.2 with custom design system |
| Android app | React Native 0.85.2 (bare CLI, not Expo) |
| LLM | Gemini 2.5 Flash (REST) with regex fallback |
| ML model | Logistic regression, trained with NumPy (no runtime deps) |
| Dataset | CSV + JSON (synthetic, 8 users × 2 weeks) |

---

## Project Structure

```
AI Schedule/
├── assets/                          # Shared image assets
│   └── App_logo2.jpg                # App logo (used in web + mobile)
│
├── dataset/                         # Synthetic training data
│   ├── calendar_events.csv          # User calendar events (2 weeks)
│   ├── time_slots.csv               # 30-min slots with ML labels
│   └── user_profiles.json           # User preferences & behavior
│
├── frontend/                        # Next.js web app + API backend
│   ├── app/
│   │   ├── page.tsx                 # Entry point (renders AuraSync)
│   │   ├── globals.css              # Design system (mobile-matched tokens)
│   │   └── api/
│   │       ├── users/route.ts       # GET /api/users
│   │       ├── schedule/route.ts    # POST /api/schedule
│   │       └── events/route.ts      # GET /api/events?userId=X
│   ├── components/
│   │   └── aura-sync/
│   │       ├── aura-sync.tsx        # Main shell (layout, state, nav)
│   │       ├── login-screen.tsx     # Profile selector
│   │       ├── chat-screen.tsx      # Chat UI + intent card
│   │       ├── calendar-screen.tsx  # Events + ML signals
│   │       └── recommendation-sheet.tsx  # Bottom sheet with ranked slots
│   ├── lib/
│   │   ├── model-artifact.json      # Trained model weights (generated)
│   │   ├── types.ts                 # Shared TypeScript types
│   │   └── server/
│   │       ├── intent.ts            # Gemini parsing + regex fallback
│   │       ├── scheduler.ts         # Orchestrates ranking pipeline
│   │       ├── runtime-model.ts     # Loads artifact, scores slots
│   │       ├── features.ts          # Feature engineering (19 features)
│   │       └── data-loader.ts       # Reads CSV / JSON dataset files
│   ├── public/
│   │   └── app-logo.jpg             # Logo served to web
│   ├── scripts/
│   │   └── train_model.py           # Trains ML model, writes artifact
│   ├── .env.local                   # Secrets (not committed)
│   └── package.json
│
└── mobile/                          # React Native Android app
    ├── App.tsx                      # Entire app (login, chat, calendar)
    ├── assets/
    │   └── app-logo.jpg             # Logo for mobile
    ├── android/
    │   └── app/build.gradle         # usesCleartextTraffic config
    └── package.json
```

---

## Prerequisites

**For the web app:**
- Node.js 18+
- npm or pnpm
- Python 3.9+ (only needed once, to train the ML model)
- Python packages: `numpy pandas scikit-learn` → `pip install numpy pandas scikit-learn`

**For the Android app (additional):**
- Android Studio with an emulator, OR a physical Android device on the same Wi-Fi
- Java 17+ (JDK)
- Android SDK (set `ANDROID_HOME`)
- React Native CLI: `npm install -g react-native-cli`

---

## Web App Setup & Commands

### Step 1 — Install dependencies

```bash
cd frontend
npm install
```

### Step 2 — Train the ML model

This only needs to be done once (or after changing the dataset).

```bash
# From the frontend/ directory:
npm run train:model
```

This runs `scripts/train_model.py`, reads the CSV/JSON from `../dataset/`, trains a logistic regression model, and writes weights to `lib/model-artifact.json`.

Expected output:
```
Training complete!
Accuracy:      90.16%
Precision:     69.97%
Recall:       100.00%
Positive rate: 22.93%
Model artifact saved to: lib/model-artifact.json
```

### Step 3 — Add Gemini API key

Create `frontend/.env.local`:
```
GEMINI_API_KEY=AIzaSyBtDkLPduflnWoKNWPwoPUGTMu3NkQJswQ
```

Without this, the app falls back to a regex-based parser automatically.

### Step 4 — Start the dev server

```bash
# From the frontend/ directory:
npm run dev
```

Server starts at: **http://localhost:3000**

### Other useful commands

```bash
npm run build          # Production build
npm run start          # Serve production build (after build)
npm run lint           # Run ESLint
npm run train:model    # Retrain ML model (re-run after dataset changes)
```

---

## Android App Setup & Commands

> The mobile app calls the Next.js backend over HTTP. The backend must be running before launching the app.

### Step 1 — Set your machine's local IP

Find your IP:
```bash
# Windows
ipconfig
# Look for: IPv4 Address . . . . . . : 192.168.x.x

# macOS/Linux
ifconfig | grep "inet "
```

Open `mobile/App.tsx` and update line 24:
```typescript
const API_BASE = 'http://YOUR_IP_HERE:3000';
// Example: const API_BASE = 'http://192.168.29.154:3000';
```

> For Android emulator only (not physical device): use `http://10.0.2.2:3000`

### Step 2 — Install dependencies

```bash
cd mobile
npm install
```

### Step 3 — Start Metro bundler

Open a new terminal:
```bash
cd mobile
npx react-native start --port 8081
```

Keep this running while you build.

### Step 4 — Build and install on Android

Open another terminal:
```bash
cd mobile/android
.\gradlew.bat app:installDebug
```

> On macOS/Linux: `./gradlew app:installDebug`

This builds the APK and installs it on the connected device/emulator. The app will open automatically.

### Rebuild after code changes

Metro (Step 3) hot-reloads most JS changes instantly. For native config changes (like `build.gradle`), re-run Step 4.

```bash
# Full clean rebuild if needed:
cd mobile/android
.\gradlew.bat clean
.\gradlew.bat app:installDebug
```

---

## Environment Variables

File: `frontend/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Optional | Gemini 2.5 Flash key for LLM intent parsing. Without it, regex fallback is used. |

---

## API Endpoints

All endpoints served by the Next.js backend at `http://localhost:3000`.

### `GET /api/users`

Returns all users from the dataset.

```json
{
  "users": [
    {
      "userId": 1,
      "name": "Alice Chen",
      "email": "alice@company.com",
      "preferredTime": "morning",
      "avgMeetingsPerDay": 2.5,
      "preferredDuration": 30,
      "doNotDisturbStart": "18:00",
      "doNotDisturbEnd": "09:00"
    }
  ]
}
```

### `GET /api/events?userId=1`

Returns calendar events for a user (loaded on login in mobile).

```json
{
  "events": [
    {
      "eventId": 101,
      "userId": 1,
      "date": "2024-04-22",
      "startTime": "10:00",
      "endTime": "11:00",
      "meetingType": "team_sync",
      "durationMinutes": 60,
      "isConflict": false
    }
  ]
}
```

### `POST /api/schedule`

Main scheduling endpoint. Parses intent, runs ML ranking, returns recommendations.

**Request:**
```json
{
  "userId": 1,
  "prompt": "Schedule a 1-hour team sync this Friday afternoon"
}
```

**Response:**
```json
{
  "user": { ... },
  "intent": {
    "action": "schedule_meeting",
    "durationMinutes": 60,
    "urgency": "normal",
    "timePreference": "afternoon",
    "datePreference": "this_friday",
    "llmUsed": true,
    "requiresConflictResolution": false,
    "hardConstraints": [],
    "participants": []
  },
  "events": [ ... ],
  "recommendations": [
    {
      "slotKey": "2024-04-26|14:00|15:00",
      "date": "2024-04-26",
      "startTime": "14:00",
      "endTime": "15:00",
      "score": 0.87,
      "scoreLabel": "Excellent fit",
      "participantAvailability": 1.0,
      "focusAverage": 0.82,
      "explanation": ["High focus window", "No adjacent meetings"],
      "supportingSignals": ["preferred time", "low meeting load"]
    }
  ],
  "conflictOptions": [],
  "modelMetrics": {
    "accuracy": 0.9016,
    "precision": 0.6997,
    "recall": 1.0,
    "positiveRate": 0.2293
  },
  "notes": ["Gemini parsed intent", "3 slots ranked"]
}
```

---

## ML Model

### Features (19 total)

The model scores each 30-minute candidate slot using these features:

| Feature | Description |
|---------|-------------|
| `is_busy` | Slot already has a meeting |
| `is_conflict` | Slot overlaps with existing event |
| `runway_blocks` | Consecutive free blocks from slot start |
| `duration_fit` | Requested duration fits in free runway |
| `runway_margin` | Extra free time beyond requested duration |
| `meeting_count_that_day` | Total meetings on that day |
| `meeting_load_gap` | Meetings vs user's daily average |
| `meeting_load_ratio` | Normalized daily load (0–1) |
| `focus_score` | User focus level at this time |
| `focus_x_urgency` | Focus × urgency interaction term |
| `hour_distance_from_preference` | Distance from user's preferred time |
| `hour_sin`, `hour_cos` | Cyclical hour encoding |
| `duration_gap` | Difference from user's preferred duration |
| `urgency_level` | Encoded urgency (1–5) |
| `request_blocks` | Requested duration in 30-min blocks |
| `dnd_overlap` | Slot falls in do-not-disturb window |
| `dow_sin`, `dow_cos` | Cyclical day-of-week encoding |

### Training

```bash
cd frontend
npm run train:model
```

- Reads `../dataset/time_slots.csv` (base features + `label` column)
- Reads `../dataset/user_profiles.json` (personalization)
- Engineers all 19 features
- Trains logistic regression (`max_iter=1000`)
- Exports weights, bias, and normalization params to `lib/model-artifact.json`

### Runtime inference

At request time, `lib/server/runtime-model.ts` loads `model-artifact.json`, normalizes the 19 features using the saved means/stds, applies the sigmoid of the dot product, and returns a score between 0 and 1 for each slot.

---

## Workflow Diagram

```
                 ┌──────────────────────────────────────────┐
                 │           User sends a message            │
                 │  "Schedule 30-min sync tomorrow morning"  │
                 └──────────────────┬───────────────────────┘
                                    │
                        ┌───────────▼────────────┐
                        │     Intent Parser       │
                        │  1. Try Gemini 2.5 Flash│
                        │  2. Fallback: regex     │
                        └───────────┬────────────┘
                                    │ ParsedIntent object
                        ┌───────────▼────────────┐
                        │    Data Loader          │
                        │  Load calendar events   │
                        │  Load user profile      │
                        │  Generate candidate     │
                        │  slots (30-min grid)    │
                        └───────────┬────────────┘
                                    │ slots[] + user context
                        ┌───────────▼────────────┐
                        │   Feature Builder       │
                        │  Engineer 19 features   │
                        │  per candidate slot     │
                        └───────────┬────────────┘
                                    │ feature matrix
                        ┌───────────▼────────────┐
                        │   ML Ranker             │
                        │  Load model-artifact    │
                        │  Normalize features     │
                        │  Sigmoid(W·x + b)       │
                        │  Sort by score ↓        │
                        └───────────┬────────────┘
                                    │ top 3-5 recommendations
                        ┌───────────▼────────────┐
                        │   Conflict Detector     │
                        │  Find overlapping slots │
                        │  Score each by priority │
                        └───────────┬────────────┘
                                    │ recommendations + conflicts
                        ┌───────────▼────────────┐
                        │   UI: Show results      │
                        │  Score, label, signals  │
                        │  Explanation bullets    │
                        │  Wait for confirmation  │
                        └───────────┬────────────┘
                                    │ user clicks Confirm
                        ┌───────────▼────────────┐
                        │   Meeting confirmed     │
                        │  (no calendar mutation  │
                        │   — human-in-the-loop)  │
                        └────────────────────────┘
```

---

## Test Prompts

Use these in the chat to test the full pipeline:

```
# Basic scheduling
"Schedule a 30-minute team sync tomorrow morning"
"Book a 1-hour review meeting this Friday afternoon"
"Find time for a quick 15-minute check-in today"

# With urgency
"I urgently need a 45-minute call today"
"Can we do a high-priority sync in the next 2 hours?"

# Conflict resolution
"I have two meetings that overlap — which one should I move?"
"Resolve my scheduling conflict for tomorrow"

# Non-scheduling (should reply with hint, not call API)
"hi"
"what can you do?"
```

---

## Troubleshooting

### Web: `model-artifact.json` not found

```bash
cd frontend
npm run train:model
```

### Web: Gemini not working / falls back to regex

Check that `frontend/.env.local` exists and contains:
```
GEMINI_API_KEY=your_key_here
```

Then restart the dev server (`npm run dev`).

### Android: "Could not load profiles" on physical device

1. Make sure the Next.js server is running: `npm run dev` in `frontend/`
2. Check your machine IP: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Update `API_BASE` in `mobile/App.tsx` to match your current IP
4. Rebuild: `cd mobile/android && .\gradlew.bat app:installDebug`
5. Ensure phone and computer are on the **same Wi-Fi network**

### Android: Metro bundler port conflict

```bash
# Kill existing Metro process and restart on correct port
cd mobile
npx react-native start --port 8081 --reset-cache
```

### Android: Build fails with Gradle error

```bash
cd mobile/android
.\gradlew.bat clean
.\gradlew.bat app:installDebug
```

### Python not found for model training

```bash
# Install Python packages first
pip install numpy pandas scikit-learn

# Then train
cd frontend
npm run train:model
```

---

## Running Both Together (Full Stack)

Open **3 terminals**:

**Terminal 1 — Next.js backend + web:**
```bash
cd frontend
npm run dev
```

**Terminal 2 — Metro bundler (Android JS server):**
```bash
cd mobile
npx react-native start --port 8081
```

**Terminal 3 — Android build (run once, then Metro handles reloads):**
```bash
cd mobile/android
.\gradlew.bat app:installDebug
```

Web UI: http://localhost:3000
Android: app auto-launches on device after build
