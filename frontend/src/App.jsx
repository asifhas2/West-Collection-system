import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PublicLanding from './pages/PublicLanding';
import UserPortal from './pages/UserPortal';
import CollectorPortal from './pages/CollectorPortal';
import AdminPortal from './pages/AdminPortal';

function MainApp() {
  const { activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Render pages based on active tab and role */}
        {activeTab === 'home' && <PublicLanding setActiveTab={setActiveTab} />}

        {activeRole === 'user' && activeTab !== 'home' && (
          <UserPortal activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {activeRole === 'collector' && activeTab !== 'home' && (
          <CollectorPortal activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {activeRole === 'admin' && activeTab !== 'home' && (
          <AdminPortal activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {activeRole === 'guest' && activeTab !== 'home' && (
          <PublicLanding setActiveTab={setActiveTab} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
