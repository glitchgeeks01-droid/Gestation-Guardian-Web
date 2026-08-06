const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'MaternalHealth';

const mockPatients = [
  {
    id: "RPM-092",
    name: "Alice R.",
    weeks: 28,
    status: "Critical",
    hr: 142,
    photo: "https://ui-avatars.com/api/?name=Alice+R&background=fecaca&color=ba1a1a"
  },
  {
    id: "RPM-114",
    name: "Maya T.",
    weeks: 34,
    status: "Warning",
    hr: 138,
    photo: "https://ui-avatars.com/api/?name=Maya+T&background=fef3c7&color=b45309"
  },
  {
    id: "RPM-205",
    name: "Sarah J.",
    weeks: 39,
    status: "Stable",
    hr: 125,
    photo: "https://ui-avatars.com/api/?name=Sarah+J&background=e0f2fe&color=00497d"
  },
  {
    id: "RPM-301",
    name: "Elena M.",
    weeks: 32,
    status: "Stable",
    hr: 130,
    photo: "https://ui-avatars.com/api/?name=Elena+M&background=dcfce7&color=047857"
  }
];

async function seed() {
  try {
    await client.connect();
    console.log("Connected to MongoDB for seeding...");
    const db = client.db(dbName);
    const collection = db.collection('patients');
    
    // Clear existing
    await collection.deleteMany({});
    console.log("Cleared existing patients.");
    
    // Insert new
    await collection.insertMany(mockPatients);
    console.log("Successfully seeded mock patients!");
    
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await client.close();
  }
}

seed();
