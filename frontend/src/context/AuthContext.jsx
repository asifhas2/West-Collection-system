import React, { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../api';

const AuthContext = createContext();

export const DEMO_PROFILES = {
  user: {
    id: 'USR-101',
    name: 'John Citizen',
    email: 'john@waste.com',
    role: 'user',
    rewardPoints: 350,
    address: '124 Green St, Eco Sector 4',
  },
  collector: {
    id: 'COL-201',
    name: 'Mike Collector',
    email: 'collector.mike@waste.com',
    role: 'collector',
    shift: 'Morning (8:00 AM - 4:00 PM)',
    truckId: 'TRK-501',
    status: 'Active',
  },
  admin: {
    id: 'ADM-001',
    name: 'Alice Admin',
    email: 'admin@waste.com',
    role: 'admin',
    department: 'Operations Management',
  },
};

export const AuthProvider = ({ children }) => {
  // Default to Guest or User for demo
  const [currentUser, setCurrentUser] = useState(DEMO_PROFILES.user);
  const [activeRole, setActiveRole] = useState('user'); // 'guest' | 'user' | 'collector' | 'admin'

  const quickSwitchRole = async (role) => {
    setActiveRole(role);
    if (role === 'guest') {
      setCurrentUser(null);
      return;
    }
    const profile = DEMO_PROFILES[role] || DEMO_PROFILES.user;
    setCurrentUser(profile);

    // Sync with C Backend
    const backendUser = await API.quickLogin(role);
    if (backendUser) {
      setCurrentUser(backendUser);
    }
  };

  const loginWithCredentials = (email, password, role) => {
    quickSwitchRole(role || 'user');
  };

  const logout = () => {
    setActiveRole('guest');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeRole,
        quickSwitchRole,
        loginWithCredentials,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
