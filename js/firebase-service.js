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
    photo: "https://ui-avatars.com/api/?name=Alice+R&background=fecaca&color=ba1a1a",
    gestosisScore: 13,
    vitals: {
      maternalHR: 82, bpSys: 145, bpDia: 92,
      weight: 78.4, weightVelocity: 1.2, kicks: 6, kicksStatus: "Low Activity", sleep: 5.5, sleepQuality: "Restless"
    },
    medicalHistory: {
      conditions: "Chronic Hypertension, Gestational Diabetes",
      medications: "Labetalol 100mg BID, Insulin Aspart",
      symptoms: ["Severe Headache", "Facial Swelling", "Nausea"]
    }
  },
  {
    id: "RPM-114",
    name: "Maya T.",
    weeks: 34,
    status: "Warning",
    photo: "https://ui-avatars.com/api/?name=Maya+T&background=fef3c7&color=b45309",
    gestosisScore: 6,
    vitals: {
      maternalHR: 76, bpSys: 130, bpDia: 85,
      weight: 82.1, weightVelocity: 0.7, kicks: 12, kicksStatus: "Normal Activity", sleep: 6.8, sleepQuality: "Moderate"
    },
    medicalHistory: {
      conditions: "Previous pre-term birth (35w)",
      medications: "Prenatal Vitamins, Low-dose Aspirin (81mg)",
      symptoms: ["Mild Swelling", "Heartburn"]
    }
  },
  {
    id: "RPM-205",
    name: "Sarah J.",
    weeks: 39,
    status: "Stable",
    photo: "https://ui-avatars.com/api/?name=Sarah+J&background=e0f2fe&color=00497d",
    gestosisScore: 1,
    vitals: {
      maternalHR: 72, bpSys: 118, bpDia: 78,
      weight: 85.5, weightVelocity: 0.3, kicks: 18, kicksStatus: "High Activity", sleep: 8.0, sleepQuality: "Good"
    },
    medicalHistory: {
      conditions: "None reported",
      medications: "Prenatal Vitamins",
      symptoms: []
    }
  },
  {
    id: "RPM-301",
    name: "Elena M.",
    weeks: 32,
    status: "Stable",
    photo: "https://ui-avatars.com/api/?name=Elena+M&background=dcfce7&color=047857",
    gestosisScore: 2,
    vitals: {
      maternalHR: 68, bpSys: 115, bpDia: 75,
      weight: 74.0, weightVelocity: 0.4, kicks: 14, kicksStatus: "Normal Activity", sleep: 7.5, sleepQuality: "Good"
    },
    medicalHistory: {
      conditions: "Hypothyroidism",
      medications: "Levothyroxine 50mcg QD, Prenatal Vitamins",
      symptoms: ["Mild Nausea"]
    }
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
      return mockPatients.find(p => p.id === id) || null;
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
    // Universal access bypass: Accept any email and password combination
    console.log(`Granting universal access to: ${email}`);
    return { success: true, user: { email, role: 'doctor' } };
  },

  calculateGestosisScore: (patient) => {
    if (!patient) return 0;
    if (patient.gestosisScore !== undefined) {
      return patient.gestosisScore;
    }
    let score = 0;
    const history = patient.medicalHistory || {};
    const vitals = patient.vitals || {};
    
    if (patient.age && (patient.age < 20 || patient.age > 35)) {
      score += 2;
    }
    
    const conditions = (history.conditions || "").toLowerCase();
    if (conditions.includes("first pregnancy") || conditions.includes("nulliparity")) score += 2;
    if (conditions.includes("prior pe") || conditions.includes("preeclampsia")) score += 4;
    if (conditions.includes("hypertension") || conditions.includes("chronic htn")) score += 3;
    if (conditions.includes("diabetes") || conditions.includes("gestational diabetes")) score += 2;
    if (conditions.includes("family history")) score += 2;
    if (conditions.includes("multiple gestation") || conditions.includes("twins")) score += 2;
    if (conditions.includes("obesity") || conditions.includes("bmi")) score += 2;
    
    if (vitals.bpSys && vitals.bpDia) {
      if (vitals.bpSys >= 160 || vitals.bpDia >= 110) score += 7;
      else if (vitals.bpSys >= 140 || vitals.bpDia >= 90) score += 5;
      else if (vitals.bpSys >= 130 || vitals.bpDia >= 80) score += 2;
    }
    
    if (vitals.protein) {
      if (vitals.protein === "+3" || vitals.protein === "3plus") score += 6;
      else if (vitals.protein === "+2" || vitals.protein === "2plus") score += 4;
      else if (vitals.protein === "+1" || vitals.protein === "1plus") score += 2;
    }
    
    if (vitals.glucose) {
      if (vitals.glucose >= 200) score += 5;
      else if (vitals.glucose >= 140) score += 3;
      else if (vitals.glucose < 60) score += 4;
    }
    
    const symptoms = history.symptoms || [];
    symptoms.forEach(s => {
      const sl = s.toLowerCase();
      if (sl.includes("headache")) score += 2;
      if (sl.includes("vision") || sl.includes("visual")) score += 2;
      if (sl.includes("pain") || sl.includes("epigastric")) score += 3;
      if (sl.includes("swelling") || sl.includes("edema")) score += 1;
    });

    return score;
  },

  getGestosisRiskInfo: (score) => {
    if (score <= 5) {
      return { band: 'Low', color: '#10b981', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', borderClass: 'border-emerald-100', action: 'Continue routine monitoring' };
    } else if (score <= 12) {
      return { band: 'Moderate', color: '#f59e0b', textColor: 'text-amber-700', bgColor: 'bg-amber-50', borderClass: 'border-amber-100', action: 'Increase BP logging frequency. Mention at next doctor visit.' };
    } else if (score <= 20) {
      return { band: 'High', color: '#ba1a1a', textColor: 'text-error', bgColor: 'bg-red-50/50', borderClass: 'border-red-100', action: 'Contact your healthcare provider today for an assessment.' };
    } else {
      return { band: 'Critical', color: '#ba1a1a', textColor: 'text-error', bgColor: 'bg-red-100', borderClass: 'border-red-200', action: 'EMERGENCY: Proceed to the nearest hospital immediately.' };
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
