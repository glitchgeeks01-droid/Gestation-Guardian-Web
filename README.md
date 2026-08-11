# 🩺 GG Doctor Dashboard - Clinical Portal

**GG Doctor Dashboard** is a dedicated clinical oversight portal designed exclusively for healthcare providers to track pregnant patients' health metrics in real-time, integrating seamlessly with the **Gestation Guardian** maternal ecosystem.

![Clinical Portal Banner](https://api.dicebear.com/7.x/initials/svg?seed=GGWeb&backgroundColor=00497d&textColor=FFFFFF)

---

## 🛠️ Technology Stack

- **Frontend Core**: HTML5, Vanilla JavaScript (ES6+), and Chart.js for live telemetry graphing.
- **Styling**: **Tailwind CSS v4** (compiled via CLI).
- **Dual-Backend Architecture**: 
  - **Firebase Firestore**: Cloud-based real-time synchronization.
  - **Local SQLite Server**: For offline or locally-synced patient data.
- **Background Daemon**: Node-cron powered IoT simulator that pushes realistic telemetry updates every 15 minutes.

---

## 🌟 Gestation Guardian Integration

This dashboard has been highly specialized to focus strictly on maternity-critical telemetry. General RPM (Remote Patient Monitoring) metrics like SpO2 and ECG have been replaced with targeted indicators:
- **Fetal Heart Rate (FHR)**
- **Maternal Heart Rate (MHR)**
- **Blood Pressure (BP)**
- **Uterine Activity (Contractions / 10m)**

---

## 🚀 Setting Up the Dual-Backend

The dashboard is equipped to connect to Gestation Guardian using two different methods:

### 1. Cloud Connection (Firebase Firestore - Recommended)
1. Configure your Web App credentials inside `js/firebase-config.js`.
2. Generate a `serviceAccountKey.json` from the Firebase Console.
3. Place `serviceAccountKey.json` in the root directory of this repository.
4. When you launch the app, `firebase-service.js` will automatically seed Firestore with mock patients if it detects an empty database.

### 2. Local Sync (SQLite)
If Gestation Guardian is syncing data locally, you can serve the existing Express server to pull direct SQLite records:
```bash
node js/server.js
```
*(Runs on port 3001 and reads from the local database).*

---

## 🕒 Live Vitals Sync Daemon (IoT Simulator)

To simulate live, realistic incoming telemetry from the Gestation Guardian mobile app, a backend Node daemon is included. This daemon pushes algorithmic physiological fluctuations (FHR, MHR, BP, and Contractions) to the Firebase database exactly every 15 minutes.

To start the sync server:
```bash
npm install
npm run sync
```
*Note: If `serviceAccountKey.json` is missing, the daemon gracefully falls back to "Local Simulation Mode".*

---

## 💻 Running the Dashboard App

To view the frontend dashboard locally, compile the Tailwind styles and start an HTTP server:

```bash
# Compile CSS
npm run build:css

# Serve the Dashboard
npx http-server -p 8082 -c-1
```
Open your browser and navigate to **`http://localhost:8082/`**.
