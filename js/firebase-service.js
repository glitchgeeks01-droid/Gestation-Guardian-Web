// js/firebase-service.js

let db = null;
let auth = null;
let isFirebaseEnabled = false;

// Default patient templates for simulation and auto-seeding
const mockPatients = [
  {
    id: "RPM-092",
    name: "Alice R.",
    weeks: 28,
    status: "Critical",
    hr: 142,
    photo: "https://ui-avatars.com/api/?name=Alice+R&background=fecaca&color=ba1a1a",
    vitals: { maternalHR: 82, fetalHR: 142, bpSys: 145, bpDia: 92, spo2: 96, contractions: 3 }
  },
  {
    id: "RPM-114",
    name: "Maya T.",
    weeks: 34,
    status: "Warning",
    hr: 138,
    photo: "https://ui-avatars.com/api/?name=Maya+T&background=fef3c7&color=b45309",
    vitals: { maternalHR: 76, fetalHR: 138, bpSys: 130, bpDia: 85, spo2: 98, contractions: 1 }
  },
  {
    id: "RPM-205",
    name: "Sarah J.",
    weeks: 39,
    status: "Stable",
    hr: 125,
    photo: "https://ui-avatars.com/api/?name=Sarah+J&background=e0f2fe&color=00497d",
    vitals: { maternalHR: 72, fetalHR: 125, bpSys: 118, bpDia: 78, spo2: 100, contractions: 0 }
  },
  {
    id: "RPM-301",
    name: "Elena M.",
    weeks: 32,
    status: "Stable",
    hr: 130,
    photo: "https://ui-avatars.com/api/?name=Elena+M&background=dcfce7&color=047857",
    vitals: { maternalHR: 68, fetalHR: 130, bpSys: 115, bpDia: 75, spo2: 99, contractions: 0 }
  }
];

function initFirebase() {
  const config = window.firebaseConfig;
  if (config && config.projectId && config.projectId !== "YOUR_PROJECT_ID") {
    try {
      firebase.initializeApp(config);
      db = firebase.firestore();
      auth = firebase.auth();
      isFirebaseEnabled = true;
      console.log("🔥 Firebase initialized successfully.");
      
      // Auto-seed if Firestore is empty
      seedFirestoreIfEmpty();
    } catch (e) {
      console.error("Firebase initialization failed:", e);
    }
  } else {
    console.warn("Firebase not configured. Running in local simulation mode.");
  }
}

async function seedFirestoreIfEmpty() {
  if (!isFirebaseEnabled) return;
  try {
    const snapshot = await db.collection('patients').limit(1).get();
    if (snapshot.empty) {
      console.log("Seeding Firestore with default mock patients...");
      for (const patient of mockPatients) {
        await db.collection('patients').doc(patient.id).set(patient);
      }
      console.log("Firestore seeding completed.");
    }
  } catch (e) {
    console.error("Auto-seeding failed:", e);
  }
}

// Global functions exposed to other script files
window.firebaseService = {
  getIsFirebaseEnabled: () => isFirebaseEnabled,
  
  getPatients: async () => {
    if (!isFirebaseEnabled) {
      return mockPatients;
    }
    try {
      const snapshot = await db.collection('patients').get();
      const patients = [];
      snapshot.forEach(doc => {
        patients.push({ id: doc.id, ...doc.data() });
      });
      return patients;
    } catch (e) {
      console.error("Failed to fetch patients from Firestore, using mock fallback.", e);
      return mockPatients;
    }
  },

  getPatientById: async (id) => {
    if (!isFirebaseEnabled) {
      return mockPatients.find(p => p.id === id) || mockPatients[0];
    }
    try {
      const doc = await db.collection('patients').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return mockPatients.find(p => p.id === id) || null;
    } catch (e) {
      console.error("Failed to fetch patient details from Firestore.", e);
      return mockPatients.find(p => p.id === id) || null;
    }
  },

  login: async (email, password) => {
    if (!isFirebaseEnabled) {
      // Mock login for offline testing
      return { success: true, user: { email, role: 'doctor' } };
    }
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (e) {
      console.error("Firebase authentication failed:", e);
      return { success: false, error: e.message };
    }
  }
};

// Initialise Firebase connection
if (typeof firebase !== 'undefined') {
  initFirebase();
} else {
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof firebase !== 'undefined') initFirebase();
  });
}
