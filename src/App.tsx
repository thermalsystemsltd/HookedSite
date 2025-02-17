import React from 'react';
import { Smartphone, Cloud, Droplets, Fish, Map, BookMarked, Calendar, Upload } from 'lucide-react';

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <Icon className="w-8 h-8 text-blue-600 mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <header className="relative">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&q=80"
            alt="Fly fishing background"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Perfect Fly Selection, Every Cast
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Your intelligent companion for choosing the right fly based on real-time conditions, local insights, and personal experience.
            </p>
            <div className="flex justify-center gap-4">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Coming Soon to Android
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Smart Features for Smart Anglers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Cloud}
              title="Weather Integration"
              description="Real-time weather data to help you choose the perfect fly for current conditions."
            />
            <FeatureCard 
              icon={Map}
              title="Local Intelligence"
              description="Access location-specific fly recommendations based on historical success rates."
            />
            <FeatureCard 
              icon={Calendar}
              title="Seasonal Patterns"
              description="Stay informed about seasonal hatches and fish behavior patterns."
            />
            <FeatureCard 
              icon={BookMarked}
              title="Personal Fly Box"
              description="Create and organize your digital fly collection with favorites and notes."
            />
            <FeatureCard 
              icon={Upload}
              title="Catch Returns"
              description="Log your catches and track your success with different flies and conditions."
            />
            <FeatureCard 
              icon={Fish}
              title="Species Targeting"
              description="Specialized recommendations for different fish species and water types."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Be the First to Know</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join our waiting list to get early access and exclusive updates about our launch.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input 
              type="email" 
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Notify Me
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Fish className="w-6 h-6" />
                HookedOnFlies
              </h3>
              <p className="mt-2">Your smart fly fishing companion</p>
            </div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>&copy; {new Date().getFullYear()} HookedOnFlies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;