import React, { useState } from 'react';
import { Smartphone, Fish, Cloud, Droplets, Mountain, Map } from 'lucide-react';
import { AdminLogin } from './components/AdminLogin';
import { AdminPanel } from './components/AdminPanel';
import { Layout } from './components/Layout';
import { AppShowcase } from './components/AppShowcase';
import { WaitlistForm } from './components/WaitlistForm';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { PrivacyPolicyApp } from './pages/PrivacyPolicyApp';
import { Footer } from './components/Footer';
import { DeleteMyData } from './pages/DeleteMyData';

// Create a Home component for the main page content
function Home({ showAdminLogin, setShowAdminLogin }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative">
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-white mb-6">
              Master Your Fly Selection
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Match the hatch with precision. Get real-time recommendations based on water conditions, seasonal patterns, and local knowledge.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowWaitlist(true)}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Join Waitlist
              </button>
              <button
                onClick={() => window.location.href = '#showcase'}
                className="px-8 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                View Screenshots
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Showcase Section with ID for scroll */}
      <div id="showcase">
        <AppShowcase />
      </div>

      {/* Waitlist Modal */}
      {showWaitlist && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Join the Waitlist</h2>
              <button
                onClick={() => setShowWaitlist(false)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            <WaitlistForm onSuccess={() => {
              setTimeout(() => setShowWaitlist(false), 2000);
            }} />
          </div>
        </div>
      )}

      {showAdminLogin && !isLoggedIn && (
        <AdminLogin
          onLogin={() => {
            setIsLoggedIn(true);
            setShowAdminLogin(false);
          }}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {isLoggedIn && <AdminPanel />}
    </div>
  );
}

function App() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  return (
    <Router>
      <Layout>
        <div className="min-h-screen flex flex-col">
          <Routes>
            <Route path="/" element={<Home showAdminLogin={showAdminLogin} setShowAdminLogin={setShowAdminLogin} />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/privacy-app" element={<PrivacyPolicyApp />} />
            <Route path="/deletemydata" element={<DeleteMyData />} />
          </Routes>
          <Footer onAdminClick={() => setShowAdminLogin(true)} />
        </div>
      </Layout>
    </Router>
  );
}

export default App;