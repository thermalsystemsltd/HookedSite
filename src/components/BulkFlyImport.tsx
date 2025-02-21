import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function BulkFlyImport() {
  const [flyNames, setFlyNames] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Split names and clean them
      const names = flyNames
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      // Get existing fly names
      const { data: existingFlies } = await supabase
        .from('flies')
        .select('name');

      const existingNames = new Set(existingFlies?.map(f => f.name.toLowerCase()));

      // Filter out existing names
      const newNames = names.filter(name => !existingNames.has(name.toLowerCase()));

      if (newNames.length === 0) {
        setMessage('All flies already exist in the database.');
        return;
      }

      // Insert new flies
      const { error } = await supabase
        .from('flies')
        .insert(newNames.map(name => ({
          name: name,
          created_at: new Date().toISOString()
        })));

      if (error) throw error;

      setMessage(`Successfully added ${newNames.length} new flies. ${names.length - newNames.length} were already in the database.`);
      setFlyNames('');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Bulk Import Flies</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Fly Names (one per line)
          </label>
          <textarea
            className="w-full p-2 border rounded h-48"
            value={flyNames}
            onChange={(e) => setFlyNames(e.target.value)}
            placeholder="Adams
Woolly Bugger
Royal Wulff"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Importing...' : 'Import Flies'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-4 rounded ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
} 