require('dotenv').config();
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

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

async function syncPatientVitals() {
  console.log(`[${new Date().toISOString()}] Executing 15-minute Vitals Sync...`);
  
  if (!db) {
    console.log("   -> Local Mode: Simulating vital generation (Database not connected).");
    console.log("   -> Example Update: Maternal HR +/- 3, BP +/- 2 adjusted.");
    return;
  }

  try {
    const patientsRef = db.collection('patients');
    const snapshot = await patientsRef.get();
    
    if (snapshot.empty) {
      console.log("   -> No active patients found in Firestore to update.");
      return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
      const patient = doc.data();
      if (patient && patient.vitals) {
        const newVitals = fluctuateVitals(patient.vitals);
        
        // Update patient document with new vitals and timestamp
        batch.update(doc.ref, { 
            vitals: newVitals,
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
