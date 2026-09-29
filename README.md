# ðŸ©º GG Doctor Dashboard â€” Clinical Portal

<div align="center">
  <img src="https://api.dicebear.com/7.x/initials/svg?seed=GGWeb&backgroundColor=00497d&textColor=FFFFFF&radius=20" alt="GG Doctor Dashboard Logo" width="120"/>
  <br>
  <i>Real-time maternal clinical oversight, powered by HL7 FHIR telemetry.</i>
</div>

---

**GG Doctor Dashboard** is a dedicated clinical oversight portal designed exclusively for healthcare providers to track pregnant patients' health metrics in real-time, integrating seamlessly with the [Gestation Guardian](https://github.com/glitchgeeks01-droid/Gestation-Guardian-App) maternal ecosystem.

## âœ¨ Features

### Clinical Authentication & Patient Monitoring
* ðŸ” **Google Workspace SSO:** Clinical personnel authenticate securely via Google Workspace OAuth, ensuring strict access control to the patient telemetry portal.
* ðŸ‘©â€âš•ï¸ **Patient Grid:** Live overview of all connected patients with gestational age and latest heart rate readings pulled directly from Firebase.
* ðŸš¦ **Dynamic Risk Triage (RAG):** The dashboard intelligently calculates a Gestosis Risk score in real-time based on incoming vitals and medical history, automatically categorizing patients with strict color-coded badges:
  * ðŸ”´ **Critical (Red):** Score 13+ (e.g., severe hypertension, rapid weight gain).
  * ðŸŸ¡ **Warning (Amber):** Score 6â€“12 (e.g., borderline elevated vitals).
  * ðŸŸ¢ **Stable (Green):** Score 0â€“5 (normal baseline).
* ðŸ”— **Secure PIN Pairing:** Doctors link Gestation Guardian patients to their dashboard by entering a temporary 4-digit Clinical PIN (e.g., `GG-XXXX`). The dashboard resolves this PIN to a secure, cryptographically hashed Firebase UID to establish the real-time telemetry stream.
* ðŸ“Š **Clinical Side Panel:** Click any patient card to reveal a detailed intervention panel with vitals, Gestosis score, medical history, conditions, and medications.

### Real-Time Telemetry
* ðŸ“¡ **HL7 FHIR Telemetry Stream:** The dashboard receives strict LOINC-coded FHIR `Observation` resources from the mobile app in real-time via Firestore `onSnapshot` listeners:
  * Blood Pressure (LOINC `85354-9`) with Systolic (`8480-6`) and Diastolic (`8462-4`) components
  * Maternal Heart Rate (LOINC `8867-4`)
* ðŸ“ˆ **Live Smartwatch Chart:** Heart rate telemetry is plotted in real-time on a Chart.js line graph, simulating a clinical bedside monitor.
* ðŸ©¸ **Blood Pressure Trending:** Systolic/diastolic values update live in the side panel and patient detail pages as new readings arrive.

### Clinical Intelligence
* ðŸ§® **Gestosis Risk Scoring:** A comprehensive scoring algorithm that evaluates:
  * Static factors: age, parity, prior preeclampsia, chronic hypertension, diabetes, family history, multiple gestation, BMI
  * Dynamic signals: real-time blood pressure, proteinuria, glucose levels, and active symptoms
  * Outputs a triaged risk band: **Low** (0â€“5), **Moderate** (6â€“12), **High** (13â€“20), **Critical** (>20)
* ðŸ¤– **ML Anomaly Detection:** A backend Mean Arterial Pressure (MAP) anomaly detector that generates FHIR `RiskAssessment` resources with SNOMED CT coding when statistically significant blood pressure spikes are detected.

### Search & Navigation
* ðŸ” **Global Patient Search:** Quick search by patient name or ID directly on the main dashboard grid.
* ðŸ“‹ **Deep-Dive Detail Pages:** Dedicated pages for individual patients with full vitals breakdown, blood pressure history, and heart rate logs.
* â“ **Help Center:** Searchable directory of clinical guides, integration tutorials, and platform documentation.

### Patient Detail Views
* ðŸ«€ **Blood Pressure Detail:** Historical BP log with trend analysis and risk indicators.
* ðŸ’“ **Heart Rate Detail:** Historical MHR log with live chart rendering.
* ðŸ“ **Medical Summary:** Conditions, medications, active symptoms, and clinical notes.

## 🛠️ Technology Stack

* **Frontend Architecture:** HTML5 and strict **TypeScript**, compiled down to ESNext for vanilla browser compatibility.
* **Type Safety:** Enforces strict Type Contracts (PatientRecord, TelemetryData) ensuring Data Schema consistency between the Mobile App and the Dashboard.
* **Styling:** Tailwind CSS v4 (compiled via CLI) with custom Glassmorphism theme.
* **Visualizations:** Chart.js for live telemetry graphing.
* **Backend:**
  * **Firebase Firestore** – Cloud-based real-time synchronization.
  * **Firebase Auth** – Google Workspace OAuth for clinician access control.
* **Data Standard:** HL7 FHIR R4 with LOINC observation and SNOMED CT risk assessment coding.
* **Background Daemon:** Node-cron powered IoT simulator that pushes realistic telemetry updates every 15 minutes.

---

## 💻 Local Development

With the introduction of the TypeScript compiler alongside the Tailwind engine, the build pipeline is now completely automated:

1. **Install Dependencies:**
   `ash
   npm install
   `
2. **Start the Development Server (Dual-Watcher):**
   `ash
   npm run dev
   `
   *This command spins up concurrent watchers: it actively compiles src/ts/*.ts to js/*.js and compiles your Tailwind utility classes into css/output.css on every save.*

3. **Build for Production:**
   `ash
   npm run build
   `

---


## ðŸ”— Gestation Guardian Integration

### How the Handshake Works

```
Gestation Guardian (Patient)             Firebase Firestore             Doctor Dashboard (Clinician)
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”             â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”             â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
1. Patient signs up              â”€â”€â–º  users/GG-XXXX (profile)  â—„â”€â”€  getPatients() reads from `users`
2. Patient logs BP (120/80)      â”€â”€â–º  users/GG-XXXX/telemetry  â—„â”€â”€  bindPatient() â†’ onSnapshot()
   FHIR Observation                   LOINC 85354-9                  telemetryUpdate CustomEvent
   LOINC 85354-9                      LOINC 8867-4                   FHIR parser updates live charts
3. Patient logs Heart Rate (72)  â”€â”€â–º  users/GG-XXXX/telemetry  â—„â”€â”€  Real-time chart rendering
```

1. A patient signs up in the **Gestation Guardian** mobile app. A unique Clinical ID (`GG-XXXX`) is generated and displayed on their profile page.
2. The patient shares their Clinical ID with their healthcare provider.
3. The doctor enters the ID into the **Connect Patient** dialog on this dashboard.
4. The dashboard establishes a real-time Firestore `onSnapshot` listener on the patient's `users/{id}/telemetry` subcollection.
5. Every new vital sign logged by the patient is automatically received, parsed as an HL7 FHIR Observation, and rendered on the clinical charts within seconds.

### Shared Database Architecture
Both the Gestation Guardian mobile app and this Doctor Dashboard connect to the **same Firebase project** (`gg-doctor-dashboard`). Patient profiles are stored in the `users` collection, and all telemetry flows through `users/{patientId}/telemetry` subcollections.

---

## ðŸš€ Getting Started

### Prerequisites
* Node.js (v18+)
* A modern web browser

### Setting Up the Backend

#### Cloud Connection (Firebase Firestore â€” Recommended)
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
* **ML Anomaly Detection:** Integrates `ml-baseline.js` which calculates Mean Arterial Pressure (MAP) statistics and flags anomalies when current readings exceed Î¼ + 1.5Ïƒ.
* **Graceful Fallback:** If `serviceAccountKey.json` is missing, the daemon falls back to local simulation mode.

---

## ðŸ—ï¸ Architecture

```
Gestation-Guardian-Web/
â”œâ”€â”€ js/
â”‚   â”œâ”€â”€ firebase-config.js    # Shared Firebase credentials (gg-doctor-dashboard)
â”‚   â”œâ”€â”€ firebase-service.js   # Firestore queries, real-time listeners, Gestosis scoring
â”‚   â”œâ”€â”€ dashboard.js          # FHIR telemetry parser, Connect Patient handler, live charts
â”‚   â”œâ”€â”€ backend-sync.js       # Node.js IoT simulator daemon (server-side only)
â”‚   â”œâ”€â”€ ml-baseline.js        # MAP anomaly detection engine (server-side only)
â”‚   â”œâ”€â”€ app.js                # Sidebar loader, navigation, shared UI
â”‚   â””â”€â”€ server.js             # Express SQLite server (optional local backend)
â”œâ”€â”€ pages/
â”‚   â”œâ”€â”€ connect-patient-record.html   # Connect Patient dialog
â”‚   â”œâ”€â”€ patient-detail.html           # Individual patient deep-dive
â”‚   â”œâ”€â”€ blood-pressure-detail.html    # BP history and trending
â”‚   â”œâ”€â”€ heart-rate-detail.html        # MHR history and trending
â”‚   â””â”€â”€ ...
â”œâ”€â”€ components/
â”‚   â””â”€â”€ sidebar.html          # Shared navigation sidebar
â”œâ”€â”€ css/
â”‚   â””â”€â”€ output.css            # Compiled Tailwind CSS
â””â”€â”€ index.html                # Main dashboard entry point
```

### Firestore Schema

```
users/                          â† Patient profiles (shared with mobile app)
  â””â”€â”€ {patientId}/              â† e.g., GG-XXXX
      â”œâ”€â”€ name, email, lmp, age, bloodGroup, ...
      â””â”€â”€ telemetry/            â† Time-series subcollection
          â””â”€â”€ {autoId}/         â† FHIR Observation documents
              â”œâ”€â”€ resourceType: "Observation"
              â”œâ”€â”€ code.coding[0].code: "85354-9" | "8867-4"
              â”œâ”€â”€ component[].valueQuantity.value: 120
              â””â”€â”€ effectiveDateTime: "2026-08-19T..."
```

## ðŸ”’ Security

* Firebase credentials are configured client-side for Firestore read/write operations.
* The Connect Patient flow requires the patient to explicitly share their Clinical ID with the doctor â€” no patient data is exposed without consent.
* The backend sync daemon uses Firebase Admin SDK with a service account key for server-side operations.

---

<div align="center">
  <b>Observe. Intervene. Protect.</b>
</div>

