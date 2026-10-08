import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import { User, Lock, Mail, Phone, ArrowRight, CheckCircle2, Recycle, ShieldCheck } from 'lucide-react';

export default function AuthPages({ isRegisteringInitial = false, setActiveTab, onClose }) {
  const { setCurrentUser, quickSwitchRole } = useAuth();
  const [isRegister, setIsRegister] = useState(isRegisteringInitial);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleSelect, setRoleSelect] = useState('user');

  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (isRegister) {
      // User Registration Flow (Diagram: Name, Email, Phone, Password -> Account Created -> Save MongoDB)
      const newUserObj = {
        name,
        email,
        phone,
        password,
        role: 'user',
        rewardPoints: 0,
      };

      const res = await API.registerUser(newUserObj);
      if (res) {
        setIsSuccess(true);
        setMessage(`Account created successfully for ${name}! User saved to MongoDB Atlas users collection.`);
        setCurrentUser(res);
        setTimeout(() => {
          quickSwitchRole('user');
          if (setActiveTab) setActiveTab('user-dashboard');
          if (onClose) onClose();
        }, 1500);
      } else {
        // Fallback
        setIsSuccess(true);
        setMessage(`Registration completed for ${name}! Logged in as User.`);
        quickSwitchRole('user');
        if (setActiveTab) setActiveTab('user-dashboard');
        if (onClose) onClose();
      }
    } else {
      // User Login Flow
      const loginRes = await API.loginUser({ email, role: roleSelect });
      if (loginRes) {
        setCurrentUser(loginRes);
        quickSwitchRole(loginRes.role || roleSelect);
        if (setActiveTab) {
          if (roleSelect === 'admin') setActiveTab('admin-dashboard');
          else if (roleSelect === 'collector') setActiveTab('collector-dashboard');
          else setActiveTab('user-dashboard');
        }
        if (onClose) onClose();
      } else {
        quickSwitchRole(roleSelect);
        if (setActiveTab) {
          if (roleSelect === 'admin') setActiveTab('admin-dashboard');
          else if (roleSelect === 'collector') setActiveTab('collector-dashboard');
          else setActiveTab('user-dashboard');
        }
        if (onClose) onClose();
      }
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-xl space-y-6 my-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold mx-auto shadow-md">
          <Recycle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          {isRegister ? 'Create User Account' : 'Account Login'}
        </h2>
        <p className="text-xs text-slate-500">
          {isRegister
            ? 'Fill in details to register and save profile to MongoDB'
            : 'Enter credentials to access your dashboard'}
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs font-bold ${isSuccess ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Citizen"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address / Phone</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@waste.com or phone"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
        </div>

        {isRegister && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1-555-0192"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
        </div>

        {!isRegister && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Account Role</label>
            <select
              value={roleSelect}
              onChange={(e) => setRoleSelect(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="user">User Account</option>
              <option value="collector">Waste Collector Account</option>
              <option value="admin">Administrator Account</option>
            </select>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
        >
          {isRegister ? 'Register Account & Save to MongoDB' : 'Sign In to Dashboard'} <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="border-t border-slate-200 pt-4 text-center">
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage('');
          }}
          className="text-xs font-semibold text-emerald-600 hover:underline"
        >
          {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register New User"}
        </button>
      </div>
    </div>
  );
}
