# 🩺 GG Doctor Dashboard — Clinical Portal

<div align="center">
  <img src="https://api.dicebear.com/7.x/initials/svg?seed=GGWeb&backgroundColor=00497d&textColor=FFFFFF&radius=20" alt="GG Doctor Dashboard Logo" width="120"/>
  <br>
  <i>Real-time maternal clinical oversight, powered by HL7 FHIR telemetry.</i>
</div>

---

**GG Doctor Dashboard** is a dedicated clinical oversight portal designed exclusively for healthcare providers to track pregnant patients' health metrics in real-time, integrating seamlessly with the [Gestation Guardian](https://github.com/glitchgeeks01-droid/Gestation-Guardian-App) maternal ecosystem.

## ✨ Features

### Clinical Authentication & Patient Monitoring
* 🔐 **Google Workspace SSO:** Clinical personnel authenticate securely via Google Workspace OAuth, ensuring strict access control to the patient telemetry portal.
* 👩‍⚕️ **Patient Grid:** Live overview of all connected patients with gestational age and latest heart rate readings pulled directly from Firebase.
* 🚦 **Dynamic Risk Triage (RAG):** The dashboard intelligently calculates a Gestosis Risk score in real-time based on incoming vitals and medical history, automatically categorizing patients with strict color-coded badges:
  * 🔴 **Critical (Red):** Score 13+ (e.g., severe hypertension, rapid weight gain).
  * 🟡 **Warning (Amber):** Score 6–12 (e.g., borderline elevated vitals).
  * 🟢 **Stable (Green):** Score 0–5 (normal baseline).
* 🔗 **Secure PIN Pairing:** Doctors link Gestation Guardian patients to their dashboard by entering a temporary 4-digit Clinical PIN (e.g., `GG-XXXX`). The dashboard resolves this PIN to a secure, cryptographically hashed Firebase UID to establish the real-time telemetry stream.
* 📊 **Clinical Side Panel:** Click any patient card to reveal a detailed intervention panel with vitals, Gestosis score, medical history, conditions, and medications.

### Real-Time Telemetry
* 📡 **HL7 FHIR Telemetry Stream:** The dashboard receives strict LOINC-coded FHIR `Observation` resources from the mobile app in real-time via Firestore `onSnapshot` listeners:
  * Blood Pressure (LOINC `85354-9`) with Systolic (`8480-6`) and Diastolic (`8462-4`) components
  * Maternal Heart Rate (LOINC `8867-4`)
* 📈 **Live Smartwatch Chart:** Heart rate telemetry is plotted in real-time on a Chart.js line graph, simulating a clinical bedside monitor.
* 🩸 **Blood Pressure Trending:** Systolic/diastolic values update live in the side panel and patient detail pages as new readings arrive.

### Clinical Intelligence
* 🧮 **Gestosis Risk Scoring:** A comprehensive scoring algorithm that evaluates:
  * Static factors: age, parity, prior preeclampsia, chronic hypertension, diabetes, family history, multiple gestation, BMI
  * Dynamic signals: real-time blood pressure, proteinuria, glucose levels, and active symptoms
  * Outputs a triaged risk band: **Low** (0–5), **Moderate** (6–12), **High** (13–20), **Critical** (>20)
* 🤖 **ML Anomaly Detection:** A backend Mean Arterial Pressure (MAP) anomaly detector that generates FHIR `RiskAssessment` resources with SNOMED CT coding when statistically significant blood pressure spikes are detected.

### Search & Navigation
* 🔍 **Global Patient Search:** Quick search by patient name or ID directly on the main dashboard grid.
* 📋 **Deep-Dive Detail Pages:** Dedicated pages for individual patients with full vitals breakdown, blood pressure history, and heart rate logs.
* ❓ **Help Center:** Searchable directory of clinical guides, integration tutorials, and platform documentation.

### Patient Detail Views
* 🫀 **Blood Pressure Detail:** Historical BP log with trend analysis and risk indicators.
* 💓 **Heart Rate Detail:** Historical MHR log with live chart rendering.
* 📝 **Medical Summary:** Conditions, medications, active symptoms, and clinical notes.

## 🛠️ Technology Stack

* **Frontend:** HTML5, Vanilla JavaScript (ES6+), and Chart.js for live telemetry graphing.
* **Styling:** Tailwind CSS v4 (compiled via CLI) with custom Glassmorphism theme.
* **Backend:**
  * **Firebase Firestore** — Cloud-based real-time synchronization (shared `gg-doctor-dashboard` project).
  * **Local SQLite Server** — Optional fallback for offline or locally-synced patient data.
* **Data Standard:** HL7 FHIR R4 with LOINC observation coding and SNOMED CT risk assessment coding.
* **Background Daemon:** Node-cron powered IoT simulator that pushes realistic telemetry updates every 15 minutes.

---

## 🔗 Gestation Guardian Integration

### How the Handshake Works

```
Gestation Guardian (Patient)             Firebase Firestore             Doctor Dashboard (Clinician)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━             ━━━━━━━━━━━━━━━━━━             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Patient signs up              ──►  users/GG-XXXX (profile)  ◄──  getPatients() reads from `users`
2. Patient logs BP (120/80)      ──►  users/GG-XXXX/telemetry  ◄──  bindPatient() → onSnapshot()
   FHIR Observation                   LOINC 85354-9                  telemetryUpdate CustomEvent
   LOINC 85354-9                      LOINC 8867-4                   FHIR parser updates live charts
3. Patient logs Heart Rate (72)  ──►  users/GG-XXXX/telemetry  ◄──  Real-time chart rendering
```

1. A patient signs up in the **Gestation Guardian** mobile app. A unique Clinical ID (`GG-XXXX`) is generated and displayed on their profile page.
2. The patient shares their Clinical ID with their healthcare provider.
3. The doctor enters the ID into the **Connect Patient** dialog on this dashboard.
4. The dashboard establishes a real-time Firestore `onSnapshot` listener on the patient's `users/{id}/telemetry` subcollection.
5. Every new vital sign logged by the patient is automatically received, parsed as an HL7 FHIR Observation, and rendered on the clinical charts within seconds.

### Shared Database Architecture
Both the Gestation Guardian mobile app and this Doctor Dashboard connect to the **same Firebase project** (`gg-doctor-dashboard`). Patient profiles are stored in the `users` collection, and all telemetry flows through `users/{patientId}/telemetry` subcollections.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* A modern web browser

### Setting Up the Backend

#### Cloud Connection (Firebase Firestore — Recommended)
1. Configure your Web App credentials inside `js/firebase-config.js`.
2. Generate a `serviceAccountKey.json` from the Firebase Console (only needed for the sync daemon).
3. Place `serviceAccountKey.json` in the root directory of this repository.
4. When you launch the app, `firebase-service.js` will automatically seed Firestore with mock patients if it detects an empty `users` collection.

#### Local Sync (SQLite)
If Gestation Guardian is syncing data locally, you can serve the existing Express server to pull direct SQLite records:
```bash
node js/server.js
```
*(Runs on port 3001 and reads from the local database).*

---

### Running the Dashboard

To view the frontend dashboard locally, compile the Tailwind styles and start an HTTP server:

```bash
# Compile CSS
npm run build:css

# Serve the Dashboard
python -m http.server 8082
```
Open your browser and navigate to **`http://localhost:8082/`**.

---

### Live Vitals Sync Daemon (IoT Simulator)

To simulate live, realistic incoming telemetry from the Gestation Guardian mobile app, a backend Node daemon is included. This daemon pushes algorithmic physiological fluctuations (MHR and BP) to the Firebase database every 15 minutes.

```bash
npm install
npm run sync
```

* **Auto-Seeding:** If it connects to a fresh Firestore instance, it automatically seeds the database with default maternal patient templates.
* **ML Anomaly Detection:** Integrates `ml-baseline.js` which calculates Mean Arterial Pressure (MAP) statistics and flags anomalies when current readings exceed μ + 1.5σ.
* **Graceful Fallback:** If `serviceAccountKey.json` is missing, the daemon falls back to local simulation mode.

---

## 🏗️ Architecture

```
Gestation-Guardian-Web/
├── js/
│   ├── firebase-config.js    # Shared Firebase credentials (gg-doctor-dashboard)
│   ├── firebase-service.js   # Firestore queries, real-time listeners, Gestosis scoring
│   ├── dashboard.js          # FHIR telemetry parser, Connect Patient handler, live charts
│   ├── backend-sync.js       # Node.js IoT simulator daemon (server-side only)
│   ├── ml-baseline.js        # MAP anomaly detection engine (server-side only)
│   ├── app.js                # Sidebar loader, navigation, shared UI
│   └── server.js             # Express SQLite server (optional local backend)
├── pages/
│   ├── connect-patient-record.html   # Connect Patient dialog
│   ├── patient-detail.html           # Individual patient deep-dive
│   ├── blood-pressure-detail.html    # BP history and trending
│   ├── heart-rate-detail.html        # MHR history and trending
│   └── ...
├── components/
│   └── sidebar.html          # Shared navigation sidebar
├── css/
│   └── output.css            # Compiled Tailwind CSS
└── index.html                # Main dashboard entry point
```

### Firestore Schema

```
users/                          ← Patient profiles (shared with mobile app)
  └── {patientId}/              ← e.g., GG-XXXX
      ├── name, email, lmp, age, bloodGroup, ...
      └── telemetry/            ← Time-series subcollection
          └── {autoId}/         ← FHIR Observation documents
              ├── resourceType: "Observation"
              ├── code.coding[0].code: "85354-9" | "8867-4"
              ├── component[].valueQuantity.value: 120
              └── effectiveDateTime: "2026-08-19T..."
```

## 🔒 Security

* Firebase credentials are configured client-side for Firestore read/write operations.
* The Connect Patient flow requires the patient to explicitly share their Clinical ID with the doctor — no patient data is exposed without consent.
* The backend sync daemon uses Firebase Admin SDK with a service account key for server-side operations.

---

<div align="center">
  <b>Observe. Intervene. Protect.</b>
</div>
