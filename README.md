# 🩺 Gestation Guardian - Doctor Oversight Portal

**Gestation Guardian Web** is a high-fidelity clinical oversight dashboard designed for healthcare providers. It allows doctors and practitioners to monitor real-time health metrics (Blood Pressure, Maternal Heart Rate, SpO2, Uterine activity, and Fetal Heart Rate) and review preeclampsia risk scores of pregnant patients.

![Clinical Portal Banner](https://api.dicebear.com/7.x/initials/svg?seed=GGWeb&backgroundColor=00497d&textColor=FFFFFF)

---

## ✨ Key Features

### 📋 Real-Time Triage List
A clean, clinical patient grid showing current gestational weeks, active alert levels (Critical/Red, Warning/Amber, Stable/Green), and latest vitals.

### 📈 Live Telemetry deep dives
Interactive visual detail pages for:
- Maternal ECG & Fetal Heart Rate Baseline (with live smartwatch simulators).
- Mean Arterial Pressure (MAP) and Blood Pressure history logs.
- Oxygen Saturation (SpO₂).
- Uterine Activity / Contractions tracker.

### 🛡️ Enterprise HIPAA Secure
A placeholder security protocol for enterprise medical record systems, complete with login authorization flows.

---

## 🛠️ Technology Stack

- **Frontend**: 
  - Semantic HTML5, Vanilla JavaScript (ES6+).
  - **Tailwind CSS**: Modern layout engine with premium color palette and glassmorphism elements.
  - **Chart.js**: Render live smartwatch telemetry, ECG waveforms, and vitals history logs.
  - **Material Symbols**: Medical icon suite.
- **Backend**:
  - **Node.js** & **Express.js**: Light backend server running on port `3001` to prevent local conflicts with client app servers.
- **Database Integration**:
  - **SQLite (`sqlite3`)**: Connects directly to the Gestation Guardian Client App database (`database.sqlite`) in real-time to load patient profiles, BP history logs, and vitals logs.
  - **MongoDB** (Optional legacy database for isolated deployments).

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- The Gestation Guardian client app database must be present locally at `C:/Users/PHK/Desktop/Gestation Guardian/server/database.sqlite`.

### 1. Run the Backend Server
1. Navigate to the folder:
   ```bash
   cd doctor-dashboard
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Express server:
   ```bash
   node js/server.js
   ```
   *The server connects to the SQLite database and listens on `http://localhost:3001`.*

### 2. Run the Frontend Dashboard
Start a static web server to view the interface:
```bash
npx http-server -p 8082 -c-1
```
Open your browser and navigate to **`http://localhost:8082/`**.

---

## 📜 License
Internal Project - All Rights Reserved.
