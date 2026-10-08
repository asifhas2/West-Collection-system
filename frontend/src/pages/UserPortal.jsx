import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import { PlusCircle, Clock, CheckCircle2, AlertCircle, Award, PackageCheck, MapPin, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

export default function UserPortal({ activeTab, setActiveTab }) {
  const { currentUser, setCurrentUser } = useAuth();

  const [requests, setRequests] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [liveRewardPoints, setLiveRewardPoints] = useState(currentUser?.rewardPoints || 0);

  // New Request Form State (UFR8 - UFR12)
  const [formData, setFormData] = useState({
    wasteType: 'Plastic',
    estimatedWeightKg: 10,
    binId: 'BIN-1001',
    location: '124 Green St, Eco Sector 4',
    preferredTime: '2026-10-07 10:00 AM',
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');

  // Bin Problem State (UFR16 - UFR18)
  const [probBinId, setProbBinId] = useState('BIN-1001');
  const [probIssueType, setProbIssueType] = useState('Full Bin');
  const [probDesc, setProbDesc] = useState('');
  const [probSuccessMsg, setProbSuccessMsg] = useState('');

  useEffect(() => {
    loadUserData();
    const interval = setInterval(loadUserData, 3000); // 3-second real-time sync with C REST API & MongoDB
    return () => clearInterval(interval);
  }, [currentUser]);

  const loadUserData = async () => {
    const reqs = await API.getRequests();
    if (reqs && Array.isArray(reqs)) {
      const uId = currentUser?.id || 'USR-101';
      const myReqs = reqs.filter((r) => r.userId === uId || r.userName === currentUser?.name);
      setRequests(myReqs.length > 0 ? myReqs : reqs);
    }

    // Fetch updated user list to get real-time updated total reward points
    const users = await API.getUsers();
    if (users && Array.isArray(users)) {
      const uId = currentUser?.id || 'USR-101';
      const myProfile = users.find((u) => u.id === uId || u.email === currentUser?.email);
      if (myProfile && myProfile.rewardPoints !== undefined) {
        setLiveRewardPoints(myProfile.rewardPoints);
        if (currentUser && currentUser.rewardPoints !== myProfile.rewardPoints) {
          setCurrentUser({ ...currentUser, rewardPoints: myProfile.rewardPoints });
        }
      }
    }

    const b = await API.getBins();
    if (b && Array.isArray(b)) {
      setBins(b);
    }
  };

  const handleFormSubmitPreview = (e) => {
    e.preventDefault();
    setShowPreviewModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowPreviewModal(false);
    setLoading(true);

    const newReq = {
      userId: currentUser?.id || 'USR-101',
      userName: currentUser?.name || 'John Citizen',
      wasteType: formData.wasteType,
      estimatedWeightKg: parseFloat(formData.estimatedWeightKg),
      binId: formData.binId,
      location: formData.location,
      preferredTime: formData.preferredTime,
    };

    const res = await API.createRequest(newReq);
    if (res) {
      setRequests((prev) => [res, ...prev]);
    }

    setLoading(false);
    setSubmitSuccessMsg('Waste collection request submitted successfully! Real-time synced to MongoDB.');
    setActiveTab('user-tracking');
    loadUserData();
  };

  const handleReportBinSubmit = async (e) => {
    e.preventDefault();
    const newProb = {
      reporterRole: 'user',
      reporterName: currentUser?.name || 'John Citizen',
      binId: probBinId,
      location: formData.location,
      issueType: probIssueType,
      description: probDesc,
    };
    await API.createProblem(newProb);
    setProbSuccessMsg('Bin problem report submitted to administrators & saved to MongoDB!');
    setProbDesc('');
  };

  const completedPickups = requests.filter((r) => r.status === 'Completed');
  const activeRequests = requests.filter((r) => r.status !== 'Completed');
  const totalWeightRecycled = completedPickups.reduce((acc, r) => acc + (r.actualWeightKg || 0), 0);
  const totalRewardsEarned = completedPickups.reduce((acc, r) => acc + (r.rewardPointsEarned || 0), 0);

  return (
    <div className="space-y-8 py-6">
      {/* User Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-lg border border-emerald-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {currentUser?.name || 'John'}!</h1>
          <p className="text-xs text-emerald-200 mt-1">Manage collection requests, track real-time status, and view eco reward points.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadUserData} className="bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 text-xs font-bold px-3 py-2.5 rounded-xl border border-emerald-500/40 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Live
          </button>
          <button
            onClick={() => setActiveTab('new-request')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> New Waste Request
          </button>
        </div>
      </div>

      {/* Stats Cards (UFR6) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Reward Points</div>
          <div className="text-2xl font-black text-amber-600 flex items-center gap-1.5">
            <Award className="w-6 h-6 text-amber-500" /> {liveRewardPoints || totalRewardsEarned || 350} PTS
          </div>
          <div className="text-[10px] text-emerald-600 font-bold">Live updated from MongoDB Atlas</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Requests</div>
          <div className="text-2xl font-black text-emerald-600 flex items-center gap-1.5">
            <Clock className="w-6 h-6 text-emerald-500" /> {activeRequests.length}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Recycled</div>
          <div className="text-2xl font-black text-teal-600 flex items-center gap-1.5">
            <PackageCheck className="w-6 h-6 text-teal-500" /> {totalWeightRecycled.toFixed(1)} kg
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Pickups</div>
          <div className="text-2xl font-black text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" /> {completedPickups.length}
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}

      {/* 1. Dashboard & History View */}
      {(activeTab === 'user-dashboard' || activeTab === 'user') && (
        <div className="space-y-8">
          {/* Active Requests Tracking Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" /> Active Waste Requests & Status Pipeline (UFR13 - UFR15)
            </h2>

            {activeRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No active collection requests right now.</div>
            ) : (
              <div className="space-y-6">
                {activeRequests.map((req) => {
                  const stages = ['Pending', 'Approved', 'Assigned', 'In Progress', 'Completed'];
                  const currentIndex = stages.indexOf(req.status);

                  return (
                    <div key={req.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <span>Request ID: {req.id}</span>
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                              {req.wasteType} ({req.estimatedWeightKg} kg est.)
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {req.location}
                          </div>
                        </div>
                        <div className="text-xs font-semibold bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                          Scheduled: {req.preferredTime}
                        </div>
                      </div>

                      {/* Visual Pipeline Bar */}
                      <div className="pt-2">
                        <div className="grid grid-cols-5 gap-1 text-center text-xs font-semibold text-slate-600 mb-2">
                          {stages.map((stg, i) => (
                            <span key={stg} className={i <= currentIndex ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                              {stg}
                            </span>
                          ))}
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 flex overflow-hidden">
                          {stages.map((stg, i) => (
                            <div
                              key={stg}
                              className={`h-full flex-1 border-r border-white transition-all ${
                                i <= currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Collection & Reward History Table (UFR19 - UFR23) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" /> Collection & Reward Points History (UFR19, UFR21)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Request ID</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Date Completed</th>
                    <th className="p-3">Actual Weight</th>
                    <th className="p-3">Reward Points</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedPickups.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{c.id}</td>
                      <td className="p-3">{c.wasteType}</td>
                      <td className="p-3 text-xs text-slate-500">{c.createdAt}</td>
                      <td className="p-3 font-semibold text-slate-800">{c.actualWeightKg} kg</td>
                      <td className="p-3 font-bold text-amber-600">+{c.rewardPointsEarned} PTS</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. New Request Form View (UFR8 - UFR12) */}
      {(activeTab === 'new-request' || activeTab === 'submit') && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Submit Waste Collection Request</h2>
            <p className="text-xs text-slate-500 mt-1">Fill in details for scheduled recycling pickup</p>
          </div>

          <form onSubmit={handleFormSubmitPreview} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Waste Material Category</label>
              <select
                value={formData.wasteType}
                onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="Plastic">Plastic (15 pts/kg)</option>
                <option value="Metal">Metal (20 pts/kg)</option>
                <option value="Paper">Paper / Cardboard (10 pts/kg)</option>
                <option value="Glass">Glass (10 pts/kg)</option>
                <option value="Organic">Organic / Food Waste (5 pts/kg)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Estimated Quantity / Weight (kg)</label>
              <input
                type="number"
                min="1"
                max="500"
                value={formData.estimatedWeightKg}
                onChange={(e) => setFormData({ ...formData, estimatedWeightKg: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm font-semibold focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nearest Smart Bin / Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Preferred Collection Time</label>
              <input
                type="text"
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              Preview & Submit Request <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* Confirmation Modal (UFR10) */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Confirm Request Submission</h3>

            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-slate-900">{formData.wasteType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Estimated Weight:</span>
                <span className="font-bold text-slate-900">{formData.estimatedWeightKg} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-900">{formData.location}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Preferred Time:</span>
                <span className="font-semibold text-slate-900">{formData.preferredTime}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2.5 rounded-xl text-xs transition"
              >
                Cancel / Edit
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow transition"
              >
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Track Requests Tab */}
      {activeTab === 'user-tracking' && (
        <div className="space-y-6">
          {submitSuccessMsg && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-xl text-sm font-semibold flex items-center justify-between">
              <span>{submitSuccessMsg}</span>
              <button onClick={() => setSubmitSuccessMsg('')} className="text-xs text-emerald-900 underline">Dismiss</button>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Track Collection Requests Status (UFR13, UFR14)</h2>
            <div className="space-y-4">
              {requests.map((r) => (
                <div key={r.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-base">{r.id} - {r.wasteType} ({r.estimatedWeightKg} kg)</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      r.status === 'Assigned' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">Location: {r.location}</div>
                  <div className="text-xs text-slate-400">Created: {r.createdAt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Report Bin Problem View (UFR16 - UFR18) */}
      {(activeTab === 'report-bin' || activeTab === 'problem') && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Report Bin Problem (UFR16 - UFR18)
            </h2>
            <p className="text-xs text-slate-500 mt-1">Notify operations manager of full, damaged, or problematic public bins</p>
          </div>

          {probSuccessMsg && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs font-bold">
              {probSuccessMsg}
            </div>
          )}

          <form onSubmit={handleReportBinSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Bin ID / Location</label>
              <select
                value={probBinId}
                onChange={(e) => setProbBinId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="BIN-1001">BIN-1001 (Central Market North Gate)</option>
                <option value="BIN-1002">BIN-1002 (Green Park West Corner)</option>
                <option value="BIN-1003">BIN-1003 (Residential Block B Plaza)</option>
                <option value="BIN-1004">BIN-1004 (Industrial Zone Hub 3)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Issue Category</label>
              <select
                value={probIssueType}
                onChange={(e) => setProbIssueType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="Full Bin / Overflowing">Full Bin / Overflowing</option>
                <option value="Damaged Bin / Broken Lid">Damaged Bin / Broken Lid</option>
                <option value="Foul Odor / Leakage">Foul Odor / Leakage</option>
                <option value="Blocked Access">Blocked Access</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Problem Description Details</label>
              <textarea
                rows="4"
                value={probDesc}
                onChange={(e) => setProbDesc(e.target.value)}
                placeholder="Describe the problem for admin review..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-amber-500"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow transition"
            >
              Submit Bin Problem Report
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
