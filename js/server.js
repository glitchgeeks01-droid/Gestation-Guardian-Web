const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = 'C:/Users/PHK/Desktop/Gestation Guardian/server/database.sqlite';

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

function querySqlite(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });
    db.all(query, params, (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function getPatientsFromSqlite() {
  try {
    const rows = await querySqlite('SELECT * FROM UserCollections');
    const usersMap = {};
    rows.forEach(row => {
      const uid = row.userId;
      if (!usersMap[uid]) {
        usersMap[uid] = {};
      }
      try {
        usersMap[uid][row.collectionKey] = JSON.parse(row.data);
      } catch (e) {
        console.error("Failed to parse collection JSON", row.collectionKey, e);
      }
    });

    const sqlitePatients = [];
    Object.keys(usersMap).forEach(uid => {
      const userCollections = usersMap[uid];
      const profile = userCollections['gg_profile'] || {};
      const bpLogs = userCollections['gg_bp_logs'] || [];
      const vitalsLogs = userCollections['gg_vitals_logs'] || [];

      if (profile.name) {
        let weeks = 24;
        if (profile.lmp) {
          const lmpDate = new Date(profile.lmp);
          const diffDays = Math.floor((new Date() - lmpDate) / 86400000);
          weeks = Math.min(Math.floor(diffDays / 7), 42);
        }

        let status = 'Stable';
        let bpSys = 118;
        let bpDia = 76;
        if (bpLogs.length > 0) {
          const latestBP = bpLogs[bpLogs.length - 1];
          bpSys = latestBP.sys || 118;
          bpDia = latestBP.dia || 76;
          if (bpSys >= 140 || bpDia >= 90) status = 'Critical';
          else if (bpSys >= 130 || bpDia >= 80) status = 'Warning';
        }

        let maternalHR = 72;
        let fetalHR = 135;
        let spo2 = 99;
        let contractions = 0;

        if (vitalsLogs.length > 0) {
          const latestV = vitalsLogs[vitalsLogs.length - 1];
          if (latestV.sleep) {
            maternalHR = Math.round(70 + (10 - latestV.sleep) * 3);
          }
        }

        sqlitePatients.push({
          _id: uid,
          id: uid,
          name: profile.name,
          weeks: weeks,
          status: status,
          hr: fetalHR,
          photo: profile.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=e0f2fe&color=00497d`,
          vitals: {
            maternalHR,
            fetalHR,
            bpSys,
            bpDia,
            spo2,
            contractions
          }
        });
      }
    });

    return sqlitePatients;
  } catch (err) {
    console.error("Error fetching SQLite patients:", err);
    return [];
  }
}

// 1. SIMPLE LOGIN (Auto-success for clinical dashboard)
app.post('/login', (req, res) => {
  const { email } = req.body;
  res.send({ success: true, user: { email, role: 'doctor' } });
});

// 2. GET ALL PATIENTS (Merges SQLite actual patient records and mock default patients)
app.get('/patients', async (req, res) => {
  try {
    const realPatients = await getPatientsFromSqlite();
    const allPatients = [...realPatients, ...mockPatients];
    res.send(allPatients);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// 3. GET SINGLE PATIENT DETAILS (Required for dynamic patient-detail page)
app.get('/patients/:id', async (req, res) => {
  try {
    const realPatients = await getPatientsFromSqlite();
    const patient = realPatients.find(p => p.id === req.params.id) || mockPatients.find(p => p.id === req.params.id);
    if (patient) {
      res.send(patient);
    } else {
      res.status(404).send({ error: 'Patient not found' });
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('🚀 Doctor dashboard server connected to SQLite & running on http://localhost:3001');
});