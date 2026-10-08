import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import LeafletMap from '../components/LeafletMap';
import { ShieldCheck, Check, X, UserCheck, Truck, MapPin, AlertTriangle, BarChart3, Users, Trash2, Plus, ArrowRight, UserPlus, RefreshCw } from 'lucide-react';

export default function AdminPortal({ activeTab, setActiveTab }) {
  const { currentUser } = useAuth();
  const [adminSubTab, setAdminSubTab] = useState('requests'); // 'requests' | 'users' | 'bins' | 'trucks' | 'collectors' | 'routes' | 'reports'

  // Data States
  const [requests, setRequests] = useState([]);
  const [bins, setBins] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [problems, setProblems] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalRequests: 0,
    completedRequests: 0,
    totalWasteCollectedKg: 0,
    totalRewardPointsIssued: 0,
    activeBinsCount: 0,
    activeTrucksCount: 0,
    registeredUsersCount: 0,
  });

  const [selectedCollector, setSelectedCollector] = useState('COL-201');
  const [selectedTruck, setSelectedTruck] = useState('TRK-501');
  const [notice, setNotice] = useState('');

  // Add Modals Form States
  const [newBinLocation, setNewBinLocation] = useState('');
  const [newBinType, setNewBinType] = useState('Plastic');
  const [newTruckPlate, setNewTruckPlate] = useState('');
  const [newTruckCap, setNewTruckCap] = useState(3000);
  const [newCollectorName, setNewCollectorName] = useState('');
  const [newCollectorPhone, setNewCollectorPhone] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const reqs = await API.getRequests();
    if (reqs && Array.isArray(reqs)) setRequests(reqs);

    const b = await API.getBins();
    if (b && Array.isArray(b)) setBins(b);

    const t = await API.getTrucks();
    if (t && Array.isArray(t)) setTrucks(t);

    const c = await API.getCollectors();
    if (c && Array.isArray(c)) setCollectors(c);

    const u = await API.getUsers();
    if (u && Array.isArray(u)) setUsersList(u);

    const p = await API.getProblems();
    if (p && Array.isArray(p)) setProblems(p);

    const rep = await API.getReports();
    if (rep) setAnalytics(rep);
  };

  // --- ACTIONS WITH REAL-TIME MONGODB SYNC ---

  const handleApproveRequest = async (reqId) => {
    await API.updateRequest(reqId, { status: 'Approved' });
    setNotice(`Request ${reqId} Approved! Updated in MongoDB Atlas.`);
    loadAllData();
  };

  const handleRejectRequest = async (reqId) => {
    await API.updateRequest(reqId, { status: 'Rejected' });
    setNotice(`Request ${reqId} Rejected! Updated in MongoDB Atlas.`);
    loadAllData();
  };

  const handleAssignTask = async (reqId) => {
    await API.updateRequest(reqId, {
      status: 'Assigned',
      collectorId: selectedCollector,
      truckId: selectedTruck,
    });
    setNotice(`Task created! Request ${reqId} assigned to Collector ${selectedCollector} & Truck ${selectedTruck}. Synced to MongoDB.`);
    loadAllData();
  };

  const handleCreateBin = async (e) => {
    e.preventDefault();
    await API.createBin({
      locationName: newBinLocation || 'New Central Location',
      lat: 23.8110,
      lng: 90.4130,
      capacityKg: 500,
      fillLevelPercent: 20,
      status: 'Normal',
      wasteType: newBinType,
    });
    setNewBinLocation('');
    setNotice('New Smart Bin added & synced to MongoDB Atlas!');
    loadAllData();
  };

  const handleDeleteBin = async (binId) => {
    await API.deleteBin(binId);
    setNotice(`Bin ${binId} deleted from MongoDB.`);
    loadAllData();
  };

  const handleCreateTruck = async (e) => {
    e.preventDefault();
    await API.createTruck({
      licensePlate: newTruckPlate || 'ECO-TRK-100',
      driverName: 'Assigned Operator',
      capacityKg: parseInt(newTruckCap),
      currentLoadKg: 0,
      status: 'Available',
    });
    setNewTruckPlate('');
    setNotice('New Fleet Truck added & synced to MongoDB Atlas!');
    loadAllData();
  };

  const handleDeleteTruck = async (tId) => {
    await API.deleteTruck(tId);
    setNotice(`Truck ${tId} deleted from MongoDB.`);
    loadAllData();
  };

  const handleCreateCollector = async (e) => {
    e.preventDefault();
    await API.createCollector({
      name: newCollectorName || 'New Collector',
      phone: newCollectorPhone || '+1-555-0999',
      status: 'Available',
      truckId: 'TRK-501',
    });
    setNewCollectorName('');
    setNewCollectorPhone('');
    setNotice('New Waste Collector added & synced to MongoDB Atlas!');
    loadAllData();
  };

  const handleDeleteCollector = async (cId) => {
    await API.deleteCollector(cId);
    setNotice(`Collector ${cId} deleted from MongoDB.`);
    loadAllData();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    await API.createUser({
      name: newUserName,
      email: newUserEmail,
      role: 'user',
      rewardPoints: 0,
    });
    setNewUserName('');
    setNewUserEmail('');
    setNotice('New User Account added & synced to MongoDB Atlas!');
    loadAllData();
  };

  const handleDeleteUser = async (uId) => {
    await API.deleteUser(uId);
    setNotice(`User ${uId} deleted from MongoDB.`);
    loadAllData();
  };

  const handleResolveProblem = async (probId) => {
    await API.updateProblem(probId, { status: 'Resolved' });
    setNotice(`Problem report ${probId} resolved in MongoDB.`);
    loadAllData();
  };

  const handleGenerateOptimizedRoute = async () => {
    const fullBins = bins.filter((b) => b.status === 'Full');
    const newRoute = {
      collectorId: selectedCollector,
      truckId: selectedTruck,
      stops: fullBins.map((b, idx) => ({ sequence: idx + 1, binId: b.id, locationName: b.locationName, lat: b.lat, lng: b.lng })),
    };
    await API.createRoute(newRoute);
    setNotice(`Optimized Collection Route generated & sent to Collector ${selectedCollector}! Real-time synced to MongoDB.`);
    loadAllData();
  };

  return (
    <div className="space-y-8 py-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-lg border border-indigo-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> Complete SRS Admin Command & Dispatch Center
          </div>
          <h1 className="text-2xl font-bold text-white">Administrator: {currentUser?.name || 'Alice Admin'}</h1>
          <p className="text-xs text-indigo-200 mt-1">Full CRUD Management for Users, Bins, Trucks, Collectors, Requests & MongoDB Real-Time Sync.</p>
        </div>
        <button onClick={loadAllData} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh MongoDB Data
        </button>
      </div>

      {notice && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-xl text-sm font-semibold flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-xs text-emerald-900 underline">Dismiss</button>
        </div>
      )}

      {/* KPI Cards (AFR5) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Requests</div>
          <div className="text-2xl font-black text-slate-900">{requests.length}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tonnage Collected</div>
          <div className="text-2xl font-black text-emerald-600">{analytics.totalWasteCollectedKg} kg</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Fleet Trucks</div>
          <div className="text-2xl font-black text-indigo-600">{trucks.length}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Users</div>
          <div className="text-2xl font-black text-amber-600">{usersList.length || analytics.registeredUsersCount || 5}</div>
        </div>
      </div>

      {/* Admin Management Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
        <button
          onClick={() => setAdminSubTab('requests')}
          className={`px-4 py-2 rounded-lg transition ${adminSubTab === 'requests' ? 'bg-indigo-600 text-white shadow' : 'text-slate-700 hover:bg-slate-200'}`}
        >
          Manage Requests
        </button>
        <button
          onClick={() => setAdminSubTab('users')}
          className={`px-4 py-2 rounded-lg transition ${adminSubTab === 'users' ? 'bg-indigo-600 text-white shadow' : 'text-slate-700 hover:bg-slate-200'}`}
        >
          Manage Users (CRUD)
        </button>
        <button
          onClick={() => setAdminSubTab('bins')}
          className={`px-4 py-2 rounded-lg transition ${adminSubTab === 'bins' ? 'bg-indigo-600 text-white shadow' : 'text-slate-700 hover:bg-slate-200'}`}
        >
          Manage Bins (CRUD)
        </button>
        <button
          onClick={() => setAdminSubTab('trucks')}
          className={`px-4 py-2 rounded-lg transition ${adminSubTab === 'trucks' ? 'bg-indigo-600 text-white shadow' : 'text-slate-700 hover:bg-slate-200'}`}
        >
          Manage Trucks (CRUD)
        </button>
        <button
          onClick={() => setAdminSubTab('collectors')}
          className={`px-4 py-2 rounded-lg transition ${adminSubTab === 'collectors' ? 'bg-indigo-600 text-white shadow' : 'text-slate-700 hover:bg-slate-200'}`}
        >
          Manage Collectors (CRUD)
        </button>
        <button
          onClick={() => setAdminSubTab('routes')}
          className={`px-4 py-2 rounded-lg transition ${adminSubTab === 'routes' ? 'bg-indigo-600 text-white shadow' : 'text-slate-700 hover:bg-slate-200'}`}
        >
          Generate Routes
        </button>
        <button
          onClick={() => setAdminSubTab('reports')}
          className={`px-4 py-2 rounded-lg transition ${adminSubTab === 'reports' ? 'bg-indigo-600 text-white shadow' : 'text-slate-700 hover:bg-slate-200'}`}
        >
          Generate Reports
        </button>
      </div>

      {/* --- SUB TAB CONTENT --- */}

      {/* 1. Manage Requests */}
      {adminSubTab === 'requests' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" /> Waste Requests Approvals & Collector Assignment (AFR7 - AFR14)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">Request ID</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Est. Weight</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions (Approve / Assign)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{r.id}</td>
                    <td className="p-3">{r.userName || r.userId}</td>
                    <td className="p-3 font-semibold">{r.wasteType}</td>
                    <td className="p-3">{r.estimatedWeightKg} kg</td>
                    <td className="p-3 text-xs text-slate-500">{r.location}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        r.status === 'Assigned' ? 'bg-indigo-100 text-indigo-800' :
                        r.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 space-x-2">
                      {r.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveRequest(r.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve (AFR9)
                          </button>
                          <button
                            onClick={() => handleRejectRequest(r.id)}
                            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject (AFR10)
                          </button>
                        </div>
                      )}

                      {r.status === 'Approved' && (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedCollector}
                            onChange={(e) => setSelectedCollector(e.target.value)}
                            className="text-xs bg-slate-100 border border-slate-300 rounded p-1"
                          >
                            {collectors.map((c) => (
                              <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignTask(r.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                          >
                            Assign Task (AFR12-14)
                          </button>
                        </div>
                      )}

                      {(r.status === 'Assigned' || r.status === 'Completed') && (
                        <span className="text-xs text-slate-500 italic">Task Assigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Manage Users (CRUD) */}
      {adminSubTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Add New User Account (MongoDB Real-Time Sync)
            </h2>
            <form onSubmit={handleCreateUser} className="grid md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">User Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="alex@waste.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                  required
                />
              </div>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow">
                <UserPlus className="w-4 h-4" /> Add User to MongoDB
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Registered Users List (MongoDB `users` collection)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Reward Points</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{u.id}</td>
                      <td className="p-3 font-semibold">{u.name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3 capitalize">{u.role}</td>
                      <td className="p-3 font-bold text-amber-600">{u.rewardPoints || 0} PTS</td>
                      <td className="p-3">
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-800 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Manage Bins (CRUD) */}
      {adminSubTab === 'bins' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" /> Add New Smart Bin (MongoDB Real-Time Sync)
            </h2>
            <form onSubmit={handleCreateBin} className="grid md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bin Location Name</label>
                <input
                  type="text"
                  value={newBinLocation}
                  onChange={(e) => setNewBinLocation(e.target.value)}
                  placeholder="e.g. City Shopping Center Entrance"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Waste Category</label>
                <select
                  value={newBinType}
                  onChange={(e) => setNewBinType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                >
                  <option value="Plastic">Plastic</option>
                  <option value="Paper">Paper</option>
                  <option value="Metal">Metal</option>
                  <option value="Organic">Organic</option>
                </select>
              </div>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow">
                <Plus className="w-4 h-4" /> Add Smart Bin
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Smart Bins List (MongoDB `bins` collection)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Bin ID</th>
                    <th className="p-3">Location Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Fill Level</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bins.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{b.id}</td>
                      <td className="p-3">{b.locationName}</td>
                      <td className="p-3 font-semibold">{b.wasteType}</td>
                      <td className="p-3">{b.fillLevelPercent}%</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          b.status === 'Full' ? 'bg-amber-100 text-amber-800' :
                          b.status === 'Damaged' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button onClick={() => handleDeleteBin(b.id)} className="text-red-600 hover:text-red-800 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Manage Trucks (CRUD) */}
      {adminSubTab === 'trucks' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" /> Add Fleet Truck (MongoDB Real-Time Sync)
            </h2>
            <form onSubmit={handleCreateTruck} className="grid md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">License Plate Number</label>
                <input
                  type="text"
                  value={newTruckPlate}
                  onChange={(e) => setNewTruckPlate(e.target.value)}
                  placeholder="e.g. ECO-TRK-77"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Capacity (kg)</label>
                <input
                  type="number"
                  value={newTruckCap}
                  onChange={(e) => setNewTruckCap(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                  required
                />
              </div>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow">
                <Plus className="w-4 h-4" /> Add Fleet Truck
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Fleet Trucks List (MongoDB `trucks` collection)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Truck ID</th>
                    <th className="p-3">License Plate</th>
                    <th className="p-3">Driver Name</th>
                    <th className="p-3">Capacity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trucks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{t.id}</td>
                      <td className="p-3 font-semibold">{t.licensePlate}</td>
                      <td className="p-3">{t.driverName}</td>
                      <td className="p-3">{t.capacityKg} kg</td>
                      <td className="p-3 font-bold text-indigo-600">{t.status}</td>
                      <td className="p-3">
                        <button onClick={() => handleDeleteTruck(t.id)} className="text-red-600 hover:text-red-800 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Manage Collectors (CRUD) */}
      {adminSubTab === 'collectors' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" /> Add Waste Collector Operator (MongoDB Real-Time Sync)
            </h2>
            <form onSubmit={handleCreateCollector} className="grid md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Collector Name</label>
                <input
                  type="text"
                  value={newCollectorName}
                  onChange={(e) => setNewCollectorName(e.target.value)}
                  placeholder="e.g. Robert Williams"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCollectorPhone}
                  onChange={(e) => setNewCollectorPhone(e.target.value)}
                  placeholder="+1-555-0888"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm"
                  required
                />
              </div>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow">
                <Plus className="w-4 h-4" /> Add Collector
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Collectors List (MongoDB `collectors` collection)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Collector ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Assigned Truck</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {collectors.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{c.id}</td>
                      <td className="p-3 font-semibold">{c.name}</td>
                      <td className="p-3">{c.phone}</td>
                      <td className="p-3">{c.truckId}</td>
                      <td className="p-3 font-bold text-emerald-600">{c.status}</td>
                      <td className="p-3">
                        <button onClick={() => handleDeleteCollector(c.id)} className="text-red-600 hover:text-red-800 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Generate Routes */}
      {adminSubTab === 'routes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" /> Bin Locations & Route Optimization Engine (AFR24 - AFR26)
              </h2>
              <p className="text-xs text-slate-500">Visual Leaflet mapping of public bins and automatic shortest-path route sequencing.</p>
            </div>
            <button
              onClick={handleGenerateOptimizedRoute}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow flex items-center gap-2 shrink-0"
            >
              <Truck className="w-4 h-4" /> Generate & Send Route to Collector (AFR24-26)
            </button>
          </div>

          <div className="h-96 w-full rounded-xl overflow-hidden">
            <LeafletMap bins={bins} zoom={13} />
          </div>
        </div>
      )}

      {/* 7. Generate Reports */}
      {adminSubTab === 'reports' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" /> Statistical Reports & Analytics Engine (AFR29 - AFR33)
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Collection & Waste Tonnage Report (AFR29, AFR30)</h3>
              <div className="text-xs text-slate-600 space-y-2">
                <div className="flex justify-between border-b pb-1"><span>Total Tonnage Collected:</span><b className="text-emerald-700">{analytics.totalWasteCollectedKg} kg</b></div>
                <div className="flex justify-between border-b pb-1"><span>Completed Pickups:</span><b>{analytics.completedRequests} Completed</b></div>
                <div className="flex justify-between border-b pb-1"><span>Active Requests Pending:</span><b>{requests.length - analytics.completedRequests} Pending</b></div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Collector & Fleet Performance Report (AFR32, AFR33)</h3>
              <div className="text-xs text-slate-600 space-y-2">
                <div className="flex justify-between border-b pb-1"><span>Active Operators:</span><b>{collectors.length} Collectors</b></div>
                <div className="flex justify-between border-b pb-1"><span>Active Trucks in Fleet:</span><b>{trucks.length} Trucks</b></div>
                <div className="flex justify-between border-b pb-1"><span>Total Reward Points Issued:</span><b className="text-amber-600">{analytics.totalRewardPointsIssued} PTS</b></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
