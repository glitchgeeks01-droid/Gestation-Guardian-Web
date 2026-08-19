require('dotenv').config();
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const mlBaseline = require('./ml-baseline');

console.log("==========================================");
console.log(" Gestation Guardian Backend Vitals Sync ");
console.log("==========================================\n");

// Initialize Firebase Admin
let db = null;
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.cert(serviceAccount)
    });
    db = getFirestore();
    console.log("🔥 Firebase Admin connected successfully.");
  } else {
    console.warn("⚠️  Warning: 'serviceAccountKey.json' not found in root directory.");
    console.warn("   Running in Local Simulation Mode. Vitals will generate but won't push to cloud.\n");
  }
} catch (error) {
  console.error("❌ Error initializing Firebase Admin:", error.message);
}

// Function to generate realistic maternity vital fluctuations
function fluctuateVitals(currentVitals) {
  const newVitals = { ...currentVitals };
  
  // Prune legacy fields
  delete newVitals.fetalHR;
  delete newVitals.contractions;
  
  // Maternal HR variance: +/- 3 BPM
  const mhrChange = Math.floor(Math.random() * 7) - 3;
  newVitals.maternalHR = Math.max(60, Math.min(120, (newVitals.maternalHR || 80) + mhrChange));

  // Blood Pressure variance: +/- 2 mmHg
  const sysChange = Math.floor(Math.random() * 5) - 2;
  const diaChange = Math.floor(Math.random() * 5) - 2;
  newVitals.bpSys = Math.max(90, Math.min(180, (newVitals.bpSys || 120) + sysChange));
  newVitals.bpDia = Math.max(60, Math.min(110, (newVitals.bpDia || 80) + diaChange));

  return newVitals;
}

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

async function syncPatientVitals() {
  console.log(`[${new Date().toISOString()}] Executing 15-minute Vitals Sync...`);
  
  if (!db) {
    console.log("   -> Local Mode: Simulating vital generation (Database not connected).");
    console.log("   -> Example Update: Maternal HR +/- 3, BP +/- 2 adjusted.");
    return;
  }

  try {
    const patientsRef = db.collection('patients');
    let snapshot = await patientsRef.get();
    
    if (snapshot.empty) {
      console.log("   -> Firestore is empty. Auto-seeding mock patients...");
      for (const p of mockPatients) {
        await patientsRef.doc(p.id).set(p);
      }
      console.log("   -> Auto-seeding completed. Fetching new snapshot...");
      snapshot = await patientsRef.get();
    }

    const batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
      const patient = doc.data();
      if (patient && patient.vitals) {
        const vitalsHistory = patient.vitalsHistory || [];
        vitalsHistory.push(patient.vitals);
        // Keep a reasonable sliding window of history for the baseline, e.g. last 24 readings
        if (vitalsHistory.length > 24) vitalsHistory.shift();

        const newVitals = fluctuateVitals(patient.vitals);
        
        // Detect anomalies using our ML baseline
        const isAnomaly = mlBaseline.detectAnomaly(vitalsHistory, newVitals);

        if (isAnomaly) {
            const riskAssessment = mlBaseline.generateRiskAssessmentFHIR(doc.id, newVitals);
            const riskRef = db.collection('riskAssessments').doc();
            batch.set(riskRef, riskAssessment);
            console.log(`   🚨 Anomaly detected for ${doc.id}! Pushed RiskAssessment to Firebase.`);
        }

        // Update patient document with new vitals and timestamp
        batch.update(doc.ref, { 
            vitals: newVitals,
            vitalsHistory: vitalsHistory,
            lastSyncedAt: FieldValue.serverTimestamp()
        });
        count++;
      }
    });

    await batch.commit();
    console.log(`   ✅ Successfully synced and updated vitals for ${count} patients.`);
  } catch (error) {
    console.error("   ❌ Error syncing patient vitals:", error.message);
  }
}

// Schedule the task to run every 15 minutes
cron.schedule('*/15 * * * *', () => {
  syncPatientVitals();
});

console.log("🕒 Scheduled Backend Sync: Running every 15 minutes.");
console.log("   (Press Ctrl+C to exit)\n");

// Run once immediately on startup for testing purposes
syncPatientVitals();
