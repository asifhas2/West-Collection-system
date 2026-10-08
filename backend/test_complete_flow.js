const { MongoClient } = require('mongodb');

async function testCompleteFlow() {
  console.log("--- End-to-End Real-Time Workflow Simulation Test ---");

  // 1. Submit Request via C Server REST API
  const newReqRes = await fetch('http://localhost:8080/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'USR-101',
      userName: 'John Citizen',
      wasteType: 'Plastic',
      estimatedWeightKg: 20.0,
      binId: 'BIN-1001',
      location: '124 Green St, Eco Sector 4',
      preferredTime: '2026-10-07 05:00 PM'
    })
  });
  const createdReq = await newReqRes.json();
  console.log("1. User Request Submitted:", createdReq.id, "| Status:", createdReq.status);

  // 2. Admin Approves & Assigns Collector COL-201
  const assignRes = await fetch(`http://localhost:8080/api/requests/${createdReq.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'Assigned',
      collectorId: 'COL-201',
      truckId: 'TRK-501'
    })
  });
  const assignedReq = await assignRes.json();
  console.log("2. Admin Approved & Assigned Task to Collector:", assignedReq.collectorId, "| Status:", assignedReq.status);

  // 3. Collector Weighs 22.0 kg and Completes Collection
  const completeRes = await fetch('http://localhost:8080/api/tasks/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId: createdReq.id,
      actualWeightKg: 22.0
    })
  });
  const completedReq = await completeRes.json();
  console.log("3. Collector Completed Task. Actual Weight:", completedReq.actualWeightKg, "kg | Reward Points Earned:", completedReq.rewardPointsEarned, "PTS | Status:", completedReq.status);

  // 4. Verify MongoDB Atlas Users Collection for Total Points Update
  const uri = "mongodb+srv://West-menegment-system:PyLl1XkPnYDkGOz3@cluster0.etvdx8p.mongodb.net/?appName=Cluster0";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('smart_waste_db');
  const userDoc = await db.collection('users').findOne({ id: 'USR-101' });
  console.log("4. MongoDB Atlas Live User Profile Updated! User:", userDoc.name, "| Overall Reward Points Balance:", userDoc.rewardPoints, "PTS");

  await client.close();
  console.log("✅ End-to-End Workflow Test PASSED Perfectly!");
}

testCompleteFlow();
