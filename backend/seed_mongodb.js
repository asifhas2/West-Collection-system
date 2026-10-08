const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = "mongodb+srv://West-menegment-system:PyLl1XkPnYDkGOz3@cluster0.etvdx8p.mongodb.net/?appName=Cluster0";
const dbName = "smart_waste_db";

async function seedMongoDB() {
  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB Atlas Cluster0...");
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas!");

    const db = client.db(dbName);

    const collections = ['users', 'requests', 'bins', 'trucks', 'collectors', 'routes', 'problems', 'rewards'];

    for (const colName of collections) {
      const filePath = path.join(__dirname, 'data', `${colName}.json`);
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf8');
        const docs = JSON.parse(fileData);

        if (Array.isArray(docs) && docs.length > 0) {
          const collection = db.collection(colName);
          // Drop existing to prevent duplication
          try { await collection.drop(); } catch (e) {}

          const result = await collection.insertMany(docs);
          console.log(`[MongoDB Atlas] Created Collection '${colName}' with ${result.insertedCount} documents.`);
        }
      }
    }

    console.log("\n✅ All 8 collections successfully populated in MongoDB Atlas Cluster0 under database 'smart_waste_db'!");
  } catch (err) {
    console.error("❌ MongoDB Atlas Seeding Error:", err);
  } finally {
    await client.close();
  }
}

seedMongoDB();
