import React, { useState } from 'react';
import { Recycle, Award, MapPin, Truck, ShieldCheck, ArrowRight, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicLanding({ setActiveTab }) {
  const { quickSwitchRole } = useAuth();

  // Calculator State
  const [calcCategory, setCalcCategory] = useState('Plastic');
  const [calcWeight, setCalcWeight] = useState(10);

  const rates = {
    Plastic: 15,
    Metal: 20,
    Paper: 10,
    Glass: 10,
    Organic: 5,
  };

  const calculatedPoints = Math.round(calcWeight * (rates[calcCategory] || 10));

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-8 sm:p-12 shadow-2xl border border-emerald-800/40">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Smart Waste Digitization Platform
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Turn Waste into <span className="text-emerald-400 underline decoration-emerald-500 decoration-wavy">Rewards</span> while keeping our City Clean.
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed">
            Submit waste collection requests, track real-time collection progress on interactive Leaflet maps, and earn redeemable eco-reward points for every kilogram recycled.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => {
                quickSwitchRole('user');
                setActiveTab('new-request');
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition flex items-center gap-2 text-base"
            >
              Submit Waste Request <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                quickSwitchRole('user');
                setActiveTab('user-dashboard');
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3.5 rounded-xl border border-slate-700 transition"
            >
              Explore User Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* 3 Step Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900">How EcoCollect Works</h2>
          <p className="text-slate-600 max-w-xl mx-auto">Connected digital workflow bridging Users, Administrators, and Collectors</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg">1</div>
            <h3 className="font-bold text-lg text-slate-900">Submit Request</h3>
            <p className="text-sm text-slate-600">Users specify waste category, estimated weight, location, and preferred time slot.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg">2</div>
            <h3 className="font-bold text-lg text-slate-900">Admin Dispatch</h3>
            <p className="text-sm text-slate-600">Administrators review, approve, assign collectors & trucks, and generate optimized routes.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-bold text-lg">3</div>
            <h3 className="font-bold text-lg text-slate-900">Pickup & Weigh</h3>
            <p className="text-sm text-slate-600">Collectors execute route, arrive at bin, record actual measured weight (kg), and complete pickup.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold text-lg">4</div>
            <h3 className="font-bold text-lg text-slate-900">Earn Rewards</h3>
            <p className="text-sm text-slate-600">User history is automatically updated and reward points credited based on actual weight collected.</p>
          </div>
        </div>
      </section>

      {/* Interactive Reward Calculator */}
      <section className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-emerald-700/50 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <Award className="w-4 h-4 text-emerald-400" /> Reward Formula Engine
            </div>
            <h2 className="text-3xl font-extrabold text-white">Calculate Your Eco Reward Points</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Points are calculated automatically upon collection completion using actual verified weight:
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Plastic: 15 points per kg</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Metal: 20 points per kg</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Paper / Cardboard: 10 points per kg</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Glass: 10 points per kg</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Organic / Food Waste: 5 points per kg</li>
            </ul>
          </div>

          <div className="bg-slate-900/90 p-6 rounded-2xl border border-emerald-500/30 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Select Waste Category</label>
              <select
                value={calcCategory}
                onChange={(e) => setCalcCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                <option value="Plastic">Plastic (15 pts/kg)</option>
                <option value="Metal">Metal (20 pts/kg)</option>
                <option value="Paper">Paper (10 pts/kg)</option>
                <option value="Glass">Glass (10 pts/kg)</option>
                <option value="Organic">Organic (5 pts/kg)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>Estimated Weight</span>
                <span className="text-emerald-400 font-bold">{calcWeight} kg</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={calcWeight}
                onChange={(e) => setCalcWeight(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="bg-emerald-950/60 p-4 rounded-xl border border-emerald-500/30 text-center">
              <div className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">Estimated Reward Points</div>
              <div className="text-4xl font-black text-emerald-400 mt-1">{calculatedPoints} PTS</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Problem Report Teaser */}
      <section className="bg-amber-50 rounded-2xl p-6 border border-amber-200 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500 text-white rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Spotted a Full or Damaged Public Bin?</h3>
            <p className="text-xs text-slate-600">Report problematic bins to administrators instantly for rapid dispatch.</p>
          </div>
        </div>
        <button
          onClick={() => {
            quickSwitchRole('user');
            setActiveTab('report-bin');
          }}
          className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition shrink-0"
        >
          Report Bin Problem Now
        </button>
      </section>
    </div>
  );
}
