# 🩺 Gestation Guardian - Doctor Oversight Portal

**Gestation Guardian Web** is a clinical oversight portal designed for healthcare providers to track pregnant patients' health metrics in real-time. It is built as a serverless static web application utilizing Firebase.

![Clinical Portal Banner](https://api.dicebear.com/7.x/initials/svg?seed=GGWeb&backgroundColor=00497d&textColor=FFFFFF)

---

## 🛠️ Technology Stack

- **Frontend**:
  - **HTML5 & CSS3**: Styled layout with glassmorphism effects.
  - **Vanilla JavaScript**: Pure JS ES6+ (no heavy frontend frameworks required).
  - **Tailwind CSS (CDN)**: Sleek styling engine.
  - **Chart.js**: Interactive smartwatch telemetry and live vitals graphing.
- **Backend (Serverless)**:
  - **Firebase App**: Core initialization.
  - **Firebase Firestore**: Real-time Firestore database to store and synchronize patient records and telemetry.
  - **Firebase Authentication**: User credential authorization for clinical practitioners.

---

## 🚀 Setting Up Firebase

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named **Gestation Guardian**.
3. Enable **Firestore Database** in test or production mode.
4. Enable **Email/Password sign-in** under Authentication.

### 2. Configure Credentials
1. Create a Web App within your Firebase project to get the configuration credentials.
2. Open `js/firebase-config.js` in the codebase.
3. Replace the placeholder config values with your project's credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### 3. Automatic Seeding (First Run)
When you launch the app, `firebase-service.js` will detect if your Firestore `patients` collection is empty. If it is, it will **automatically seed** Firestore with the default mock patients (*Alice R.*, *Maya T.*, *Sarah J.*, and *Elena M.*) so you have an active dashboard immediately!

---

## 💻 Running the App Locally

Since the backend is fully serverless with Firebase, you do not need to run a local Node/Express server anymore! Simply serve the static HTML folder:

```bash
npx http-server -p 8082 -c-1
```
Open your browser and navigate to **`http://localhost:8082/`**.
