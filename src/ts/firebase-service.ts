// src/ts/firebase-service.ts


// Global declarations for Firebase loaded via CDN
declare var firebase: any;

let db: any = null;
let auth: any = null;
let isFirebaseEnabled: boolean = false;

function initFirebase(): void {
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

// Implement the global interface defined in types.ts
window.firebaseService = window.firebaseService || {} as any;
Object.assign(window.firebaseService, {
  getIsFirebaseEnabled: (): boolean => isFirebaseEnabled,
  
  getPatients: async (): Promise<PatientRecord[]> => {
    if (!isFirebaseEnabled) throw new Error("DatabaseConnectionError: Firebase is not initialized");
    try {
      const snapshot = await db.collection('users').get();
      const patients: PatientRecord[] = [];
      snapshot.forEach((doc: any) => {
        patients.push({ id: doc.id, ...doc.data() } as PatientRecord);
      });
      return patients;
    } catch (e) {
      console.error("Failed to fetch patients from Firestore.", e);
      throw new Error("Failed to fetch patient list from database.");
    }
  },

  getPatientById: async (idOrPin: string): Promise<PatientRecord> => {
    const cleanId = idOrPin ? idOrPin.trim() : "";
    if (!cleanId) throw new Error("InvalidPatientIdentifier: Identifier is empty");
    if (!isFirebaseEnabled) throw new Error("DatabaseConnectionError: Firebase is not initialized");
    
    try {
      let patientData: any = null;
      let patientUid = cleanId;

      // Polymorphic Lookup: First, assume it might be a Document UID
      const docRef = db.collection('users').doc(cleanId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        patientData = { id: docSnap.id, ...docSnap.data() };
      } else {
        // Secondary Lookup: Attempt to find by pairingPin
        const q = db.collection('users').where('pairingPin', '==', cleanId.toUpperCase()).limit(1);
        const snapshot = await q.get();
        if (!snapshot.empty) {
          patientData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          patientUid = snapshot.docs[0].id;
        }
      }
      
      if (!patientData) {
        // STRICT ERROR
        throw new Error("PatientNotFound: The requested patient could not be found.");
      }

      // BUG-001 FIX: Fetch latest telemetry because the app writes to the subcollection, not the root doc
      try {
        const telemetryQuery = await db.collection('users').doc(patientUid).collection('telemetry')
            .orderBy('effectiveDateTime', 'desc').limit(10).get();
        
        const vitals: any = patientData.vitals || {};
        
        telemetryQuery.forEach((tDoc: any) => {
            const data = tDoc.data();
            const code = data.code?.coding?.[0]?.code;
            
            // BP Panel
            if (code === '85354-9' && (!vitals.bpSys || !vitals.bpDia)) {
                data.component?.forEach((comp: any) => {
                    const cCode = comp.code?.coding?.[0]?.code;
                    if (cCode === '8480-6') vitals.bpSys = comp.valueQuantity?.value;
                    if (cCode === '8462-4') vitals.bpDia = comp.valueQuantity?.value;
                    if (cCode === '8867-4' && !vitals.maternalHR) vitals.maternalHR = comp.valueQuantity?.value;
                });
            }
            // Generic Vitals or Heart Rate
            else if (code === '8867-4' && !vitals.maternalHR) {
                vitals.maternalHR = data.valueQuantity?.value;
            }
            else if (code === '8716-3') {
                data.component?.forEach((comp: any) => {
                    const cCode = comp.code?.coding?.[0]?.code;
                    if (cCode === '29463-7' && !vitals.weight) vitals.weight = comp.valueQuantity?.value;
                    if (cCode === '2339-0' && !vitals.glucose) vitals.glucose = comp.valueQuantity?.value;
                    if (cCode === '8310-5' && !vitals.temperature) vitals.temperature = comp.valueQuantity?.value;
                });
            }
        });

        patientData.vitals = vitals;
      } catch (telErr) {
        console.warn("Failed to fetch telemetry subcollection:", telErr);
      }

      return patientData as PatientRecord;
    } catch (e) {
      console.error("Database query failed:", e);
      throw e;
    }
  },

  login: async (): Promise<{success: boolean, user?: any, error?: string}> => {
    if (!isFirebaseEnabled) return { success: false, error: "Firebase not configured." };
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await firebase.auth().signInWithPopup(provider);
      console.log(`Authenticated as doctor: ${result.user.email}`);
      return { success: true, user: result.user };
    } catch (e: any) {
      console.error("Google Auth failed:", e);
      return { success: false, error: e.message };
    }
  },

  bindPatient: async (identifier: string): Promise<boolean | void> => {
    if (!isFirebaseEnabled || !db) throw new Error("Database not connected");
    if ((window as any).AuditLogger) (window as any).AuditLogger.log('BIND_PATIENT', { uniqueId: identifier });
    
    const cleanId = identifier ? identifier.trim() : "";
    if (!cleanId) throw new Error("Invalid Identifier.");

    let secureUid = cleanId;
    console.log(`Resolving patient UID for: '${cleanId}'`);
    
    try {
      if (/^GG-[a-zA-Z0-9]{4}$/i.test(cleanId)) {
        const q = db.collection('users').where('pairingPin', '==', cleanId.toUpperCase()).limit(1);
        const snapshot = await q.get();
        if (snapshot.empty) {
          throw new Error("PatientNotFound: No patient registered with that PIN.");
        }
        secureUid = snapshot.docs[0].id;
      }
      
      console.log(`Binding to patient telemetry for UID: ${secureUid}`);
      
      db.collection('users').doc(secureUid).collection('telemetry')
        .onSnapshot((telemetrySnapshot: any) => {
          telemetrySnapshot.docChanges().forEach((change: any) => {
            if (change.type === 'added' || change.type === 'modified') {
              const data = change.doc.data();
              const event = new CustomEvent('telemetryUpdate', { detail: data });
              window.dispatchEvent(event);
            }
          });
        }, (error: any) => {
          console.error("Error listening to telemetry:", error);
        });
        
      return true;
    } catch (e) {
      console.error("Error binding patient:", e);
      throw e;
    }
  },

  calculateGestosisScore: (patient: PatientRecord): number => {
    if (!patient) return 0;
    if (patient.gestosisScore !== undefined) {
      return patient.gestosisScore;
    }
    let score = 0;
    const history = patient.medicalHistory || {};
    const vitals = patient.vitals || {};
    
    // Type checking for 'age' if it were added to patient model
    const age = (patient as any).age;
    if (age && (age < 20 || age > 35)) {
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

  getGestosisRiskInfo: (score: number) => {
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
});

// Initialise Firebase connection
if (typeof firebase !== 'undefined') {
  initFirebase();
} else {
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof firebase !== 'undefined') initFirebase();
  });
}

