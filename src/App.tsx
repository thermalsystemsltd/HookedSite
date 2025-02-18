import React, { useState } from 'react';
import { Smartphone, Fish, Cloud, Droplets, Mountain, Map } from 'lucide-react';
import { AdminLogin } from './components/AdminLogin';
import { AdminPanel } from './components/AdminPanel';
import { Layout } from './components/Layout';

function App() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <header className="relative">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80"
              alt="Fly fishing background"
              className="w-full h-full object-cover opacity-30"
            />
          </div>
          <div className="relative z-10 container mx-auto px-4 pt-24 pb-32">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold text-white mb-6">
                Master Your Fly Selection
              </h1>
              <p className="text-xl text-white/90 mb-8">
                Match the hatch with precision. Get real-time recommendations based on water conditions, seasonal patterns, and local knowledge.
              </p>
              <div className="flex justify-center gap-4">
                <button className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors flex items-center gap-2 shadow-lg">
                  <Smartphone className="w-5 h-5" />
                  Coming Soon to Android
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Features Section */}
        <section className="py-16 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Why Every Angler Needs This</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Fish className="w-6 h-6 text-green-700" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Fly Selection</h3>
                <p className="text-gray-600">
                  Get precise fly recommendations based on current hatches and fish feeding patterns.
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Cloud className="w-6 h-6 text-blue-700" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Weather Integration</h3>
                <p className="text-gray-600">
                  Real-time weather and water conditions to optimize your fishing strategy.
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <Map className="w-6 h-6 text-amber-700" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Local Knowledge</h3>
                <p className="text-gray-600">
                  Access patterns and techniques that work on your local waters.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seasonal Section */}
        <section className="py-16 bg-gradient-to-b from-green-800 to-green-900 text-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Year-Round Fishing Success</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-6">
                <h3 className="text-xl font-semibold mb-3">Spring</h3>
                <p className="text-gray-200">
                  BWOs, March Browns, and early season hatches
                </p>
              </div>
              <div className="text-center p-6">
                <h3 className="text-xl font-semibold mb-3">Summer</h3>
                <p className="text-gray-200">
                  Terrestrials, PMDs, and evening caddis
                </p>
              </div>
              <div className="text-center p-6">
                <h3 className="text-xl font-semibold mb-3">Fall</h3>
                <p className="text-gray-200">
                  Hoppers, autumn mayflies, and streamers
                </p>
              </div>
              <div className="text-center p-6">
                <h3 className="text-xl font-semibold mb-3">Winter</h3>
                <p className="text-gray-200">
                  Midges, winter stones, and nymphing tactics
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Improve Your Catch Rate?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join the waitlist for early access and exclusive fishing tips.
            </p>
            <button className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-lg">
              Join Waitlist
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-300 py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="mb-4">© 2024 Fly Selection App. All rights reserved.</p>
            <button 
              onClick={() => setShowAdminLogin(true)}
              className="text-gray-400 hover:text-gray-300 text-sm"
            >
              Admin Access
            </button>
          </div>
        </footer>

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
    </Layout>
  );
}

export default App;