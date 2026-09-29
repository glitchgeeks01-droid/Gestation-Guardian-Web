// js/firebase-service.js

let db = null;
let auth = null;
let isFirebaseEnabled = false;

function initFirebase() {
  const config = window.firebaseConfig;
  if (config && config.projectId && config.projectId !== "YOUR_PROJECT_ID") {
    try {
      firebase.initializeApp(config);
      db = firebase.firestore();
      auth = firebase.auth();
      isFirebaseEnabled = true;
      console.log("🔥 Firebase initialized successfully.");
    } catch (e) {
      console.error("Firebase initialization failed:", e);
    }
  } else {
    console.error("Firebase not configured properly. Cannot proceed.");
  }
}

// Global functions exposed to other script files
window.firebaseService = {
  getIsFirebaseEnabled: () => isFirebaseEnabled,
  
  getPatients: async () => {
    if (!isFirebaseEnabled) throw new Error("DatabaseConnectionError: Firebase is not initialized");
    try {
      const snapshot = await db.collection('users').get();
      const patients = [];
      snapshot.forEach(doc => {
        patients.push({ id: doc.id, ...doc.data() });
      });
      return patients;
    } catch (e) {
      console.error("Failed to fetch patients from Firestore.", e);
      throw new Error("Failed to fetch patient list from database.");
    }
  },

  getPatientById: async (idOrPin) => {
    const cleanId = idOrPin ? idOrPin.trim() : "";
    if (!cleanId) throw new Error("InvalidPatientIdentifier: Identifier is empty");
    if (!isFirebaseEnabled) throw new Error("DatabaseConnectionError: Firebase is not initialized");
    
    try {
      // Polymorphic Lookup: First, assume it might be a Document UID
      const docRef = db.collection('users').doc(cleanId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      
      // Secondary Lookup: Attempt to find by pairingPin (if passed from manually typed URL)
      const q = db.collection('users').where('pairingPin', '==', cleanId.toUpperCase()).limit(1);
      const snapshot = await q.get();
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
      
      // STRICT ERROR: Do not return null or mock data
      throw new Error("PatientNotFound: The requested patient could not be found.");
    } catch (e) {
      console.error("Database query failed:", e);
      throw e;
    }
  },

  login: async () => {
    if (!isFirebaseEnabled) return { success: false, error: "Firebase not configured." };
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await firebase.auth().signInWithPopup(provider);
      console.log(`Authenticated as doctor: ${result.user.email}`);
      return { success: true, user: result.user };
    } catch (e) {
      console.error("Google Auth failed:", e);
      return { success: false, error: e.message };
    }
  },

  bindPatient: async (pairingPin) => {
    if (!isFirebaseEnabled || !db) throw new Error("Database not connected");
    const cleanPin = pairingPin ? pairingPin.trim().toUpperCase() : "";
    
    // Strict schema validation for the PIN format
    if (!/^GG-[A-Z0-9]{4}$/.test(cleanPin)) {
        console.error("Invalid PIN format.");
        throw new Error("Invalid PIN Format. Expected GG-XXXX");
    }
    
    console.log(`Resolving patient UID for PIN: '${cleanPin}'`);
    try {
      // Find the secure auth.uid by querying the pairing PIN
      const q = db.collection('users').where('pairingPin', '==', cleanPin).limit(1);
      const snapshot = await q.get();
      if (snapshot.empty) {
        throw new Error("PatientNotFound: No patient registered with that PIN.");
      }
      
      const secureUid = snapshot.docs[0].id;
      console.log(`Binding to patient telemetry for UID: ${secureUid}`);
      
      db.collection('users').doc(secureUid).collection('telemetry')
        .onSnapshot((telemetrySnapshot) => {
          telemetrySnapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const data = change.doc.data();
              const event = new CustomEvent('telemetryUpdate', { detail: data });
              window.dispatchEvent(event);
            }
          });
        }, (error) => {
          console.error("Error listening to telemetry:", error);
        });
        
      return true;
    } catch (e) {
      console.error("Error binding patient:", e);
      throw e;
    }
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
