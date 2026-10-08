const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = "mongodb+srv://West-menegment-system:PyLl1XkPnYDkGOz3@cluster0.etvdx8p.mongodb.net/?appName=Cluster0";
const dbName = "smart_waste_db";

async function syncSingleCollection() {
  const targetCol = process.argv[2];
  if (!targetCol) return;

  const colName = targetCol.replace('.json', '');
  const filePath = path.join(__dirname, 'data', `${colName}.json`);

  if (!fs.existsSync(filePath)) return;

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const docs = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (Array.isArray(docs)) {
      const collection = db.collection(colName);
      try { await collection.drop(); } catch (e) {}
      if (docs.length > 0) {
        await collection.insertMany(docs);
        console.log(`[MongoDB Real-time Sync] Real-time updated collection '${colName}' (${docs.length} docs)`);
      }
    }
  } catch (err) {
    console.error("[MongoDB Real-time Sync Error]", err.message);
  } finally {
    await client.close();
  }
}

syncSingleCollection();
