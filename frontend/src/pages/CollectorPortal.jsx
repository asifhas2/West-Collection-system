import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import LeafletMap from '../components/LeafletMap';
import { Truck, MapPin, Play, CheckCircle2, AlertTriangle, Scale, Award, RefreshCw } from 'lucide-react';

export default function CollectorPortal({ activeTab, setActiveTab }) {
  const { currentUser } = useAuth();

  const [assignedTasks, setAssignedTasks] = useState([]);
  const [routeBins, setRouteBins] = useState([]);
  const [loading, setLoading] = useState(false);

  // Weight Entry Modal State (CFR13 - CFR19)
  const [selectedTask, setSelectedTask] = useState(null);
  const [actualWeightInput, setActualWeightInput] = useState('');
  const [weightError, setWeightError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Report Issue State (CFR20 - CFR22)
  const [issueDesc, setIssueDesc] = useState('');
  const [issueSuccess, setIssueSuccess] = useState('');

  const rates = { Plastic: 15, Metal: 20, Paper: 10, Glass: 10, Organic: 5 };

  useEffect(() => {
    loadCollectorData();
    const interval = setInterval(loadCollectorData, 3000); // 3-second real-time sync with C REST API
    return () => clearInterval(interval);
  }, [currentUser]);

  const loadCollectorData = async () => {
    const reqs = await API.getRequests();
    if (reqs && Array.isArray(reqs)) {
      // Filter tasks assigned to collector or all active assigned/in-progress tasks
      const cId = currentUser?.id || 'COL-201';
      const myTasks = reqs.filter(
        (r) => r.collectorId === cId || r.status === 'Assigned' || r.status === 'In Progress' || (r.status === 'Completed' && r.collectorId === cId)
      );
      setAssignedTasks(myTasks);
    }

    const b = await API.getBins();
    if (b && Array.isArray(b)) {
      setRouteBins(b);
    }
  };

  const handleStartCollection = async (taskId) => {
    await API.updateRequest(taskId, { status: 'In Progress' });
    setSuccessNotice(`Task ${taskId} collection started! Status updated in real time.`);
    loadCollectorData();
  };

  const handleOpenCompleteModal = (task) => {
    setSelectedTask(task);
    setActualWeightInput(task.estimatedWeightKg || '10');
    setWeightError('');
  };

  const handleConfirmCompleteCollection = async () => {
    const weightNum = parseFloat(actualWeightInput);

    if (isNaN(weightNum) || weightNum <= 0) {
      setWeightError('Please enter a valid numeric weight greater than 0 kg.');
      return;
    }

    if (!selectedTask) return;

    // Send task completion to C REST backend -> updates requests, users reward points, and MongoDB Atlas!
    const res = await API.completeTask(selectedTask.id, weightNum);

    const calculatedPts = Math.round(weightNum * (rates[selectedTask.wasteType] || 10));

    setSuccessNotice(`Task ${selectedTask.id} Completed! Weight: ${weightNum} kg. ${calculatedPts} reward points added to User (${selectedTask.userId || selectedTask.userName}) in MongoDB Atlas.`);
    setSelectedTask(null);
    loadCollectorData();
  };

  const handleReportIssueSubmit = async (e) => {
    e.preventDefault();
    await API.createProblem({
      reporterRole: 'collector',
      reporterName: currentUser?.name || 'Mike Collector',
      location: 'Assigned Route Zone',
      issueType: 'Route Access Problem',
      description: issueDesc,
    });
    setIssueSuccess('Route problem reported to administrator & saved in MongoDB.');
    setIssueDesc('');
  };

  const calculatedPointsPreview = selectedTask && actualWeightInput && !isNaN(parseFloat(actualWeightInput))
    ? Math.round(parseFloat(actualWeightInput) * (rates[selectedTask.wasteType] || 10))
    : 0;

  return (
    <div className="space-y-8 py-6">
      {/* Collector Workspace Header */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-amber-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
            <Truck className="w-4 h-4 text-amber-400" /> Waste Collection Operator Workspace (Real-Time Live Sync)
          </div>
          <h1 className="text-2xl font-bold text-white">Collector: {currentUser?.name || 'Mike Collector'}</h1>
          <p className="text-xs text-amber-200 mt-1">Truck Assigned: TRK-501 (ECO-TRK-88) | Shift: Morning (8:00 AM - 4:00 PM)</p>
        </div>
        <button onClick={loadCollectorData} className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Assigned Tasks
        </button>
      </div>

      {successNotice && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-xl text-sm font-semibold flex items-center justify-between">
          <span>{successNotice}</span>
          <button onClick={() => setSuccessNotice('')} className="text-xs text-emerald-900 underline">Dismiss</button>
        </div>
      )}

      {/* Main Grid: Tasks & Route Map */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Assigned Tasks List (CFR7, CFR8) */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" /> Assigned Pickup Tasks ({assignedTasks.length})
            </h2>

            {assignedTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No tasks assigned yet. Admin will assign tasks here in real-time.</div>
            ) : (
              <div className="space-y-4">
                {assignedTasks.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{t.id}</div>
                        <div className="text-xs text-slate-500">User: {t.userName || t.userId}</div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        t.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div>Category: <b>{t.wasteType}</b> ({t.estimatedWeightKg} kg est.)</div>
                      <div className="flex items-center gap-1 text-slate-500"><MapPin className="w-3 h-3" /> {t.location}</div>
                    </div>

                    <div className="pt-1">
                      {t.status === 'Assigned' && (
                        <button
                          onClick={() => handleStartCollection(t.id)}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" /> Start Collection (CFR11)
                        </button>
                      )}

                      {t.status === 'In Progress' && (
                        <button
                          onClick={() => handleOpenCompleteModal(t)}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <Scale className="w-3.5 h-3.5" /> Record Weight & Complete (CFR13)
                        </button>
                      )}

                      {t.status === 'Completed' && (
                        <div className="text-center py-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Collected: {t.actualWeightKg} kg (+{t.rewardPointsEarned || 0} PTS)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Collection Route Map & Stop Details (CFR9, CFR10) */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> Collection Route Navigation Map (CFR9, CFR10)
            </h2>

            <div className="h-80 w-full rounded-xl overflow-hidden">
              <LeafletMap bins={routeBins} zoom={13} />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {routeBins.map((bin, i) => (
                <div key={bin.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <span className="w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px]">{i + 1}</span>
                    <span>{bin.id}</span>
                  </div>
                  <div className="text-slate-600 text-[11px] truncate">{bin.locationName}</div>
                  <div className="font-semibold text-slate-700">Fill: {bin.fillLevelPercent}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Record Weight & Complete Collection Modal (CFR13 - CFR19) */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600" /> Record Actual Measured Weight (CFR13)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Request ID: {selectedTask.id} | Category: {selectedTask.wasteType} | User: {selectedTask.userName || selectedTask.userId}</p>
            </div>

            {weightError && (
              <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-xl text-xs font-bold">
                {weightError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Enter Actual Measured Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={actualWeightInput}
                  onChange={(e) => {
                    setActualWeightInput(e.target.value);
                    setWeightError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-lg font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Auto Reward Calculation Preview */}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center space-y-1">
                <div className="text-xs text-amber-800 font-semibold flex items-center justify-center gap-1">
                  <Award className="w-4 h-4 text-amber-600" /> Auto Reward Points Preview (CFR19)
                </div>
                <div className="text-3xl font-black text-amber-600">
                  +{calculatedPointsPreview} PTS
                </div>
                <div className="text-[11px] text-amber-700">
                  Rate: {rates[selectedTask.wasteType] || 10} pts / kg for {selectedTask.wasteType} (Will be added to User's overall points)
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2.5 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCompleteCollection}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow transition flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> Save & Credit Points (CFR16)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Issue View (CFR20 - CFR22) */}
      <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" /> Report Route / Collection Problem (CFR20 - CFR22)
        </h3>

        {issueSuccess && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs font-bold">
            {issueSuccess}
          </div>
        )}

        <form onSubmit={handleReportIssueSubmit} className="space-y-4">
          <textarea
            rows="3"
            value={issueDesc}
            onChange={(e) => setIssueDesc(e.target.value)}
            placeholder="Describe route obstruction, damaged bin, or hazardous waste issue..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500"
            required
          ></textarea>
          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition"
          >
            Submit Problem Report to Admin
          </button>
        </form>
      </div>
    </div>
  );
}
