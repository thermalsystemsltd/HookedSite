import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function DeleteMyData() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('data_deletion_requests')
        .insert([{ email, status: 'pending' }]);

      if (error) throw error;

      setMessage('Your data deletion request has been submitted. We will process it within 30 days and send you a confirmation email.');
      setEmail('');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Request Data Deletion</h1>
      
      <div className="bg-gray-900/50 rounded-lg p-6">
        <p className="text-white/90 mb-6">
          Please enter your email address to request deletion of all your data from Hooked on Flies.
          We will process your request within 30 days in accordance with data protection regulations.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="your@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded bg-red-600 text-white font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Request Data Deletion'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded ${message.includes('Error') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
} 