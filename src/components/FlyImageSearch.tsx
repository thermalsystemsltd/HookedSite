import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Loader } from 'lucide-react';

const GOOGLE_API_KEY = 'AIzaSyAS_3fMmARCHNMRZHf7wAPbs-ChUGqxEQ4';
const SEARCH_ENGINE_ID = 'c15b9822121d049d7';

interface SearchResult {
  link: string;
  title: string;
  image: {
    thumbnailLink: string;
  };
}

export function FlyImageSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFly, setSelectedFly] = useState<string | null>(null);

  const searchFlies = async () => {
    if (!searchTerm) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      // First search for fly in database
      const { data: flies, error } = await supabase
        .from('flies')
        .select('name')
        .ilike('name', `%${searchTerm}%`);

      if (error) throw error;
      
      if (flies.length === 0) {
        setMessage('No flies found with that name');
        return;
      }

      setSelectedFly(flies[0].name);
      
      // Then search for images
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${flies[0].name} fly fishing fly&searchType=image&num=5`
      );
      
      const data = await response.json();
      
      if (data.items) {
        setSearchResults(data.items);
      } else {
        setMessage('No images found');
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (imageUrl: string) => {
    if (!selectedFly) return;
    
    setLoading(true);
    setMessage('');

    try {
      // Download image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Upload to Supabase
      const fileExt = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('fly-images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('fly-images')
        .getPublicUrl(fileName);

      // Update fly record
      const { error: updateError } = await supabase
        .from('flies')
        .update({ image_url: publicUrl })
        .eq('name', selectedFly);

      if (updateError) throw updateError;

      setMessage('Image updated successfully!');
      setSearchResults([]);
      setSearchTerm('');
      setSelectedFly(null);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Search Fly Images</h2>
      
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter fly name..."
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          onClick={searchFlies}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader className="animate-spin" /> : <Search />}
          Search
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded mb-4 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {selectedFly && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Selected Fly: {selectedFly}</h3>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {searchResults.map((result, index) => (
          <div key={index} className="relative group">
            <img
              src={result.link}
              alt={result.title}
              className="w-full h-40 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => handleImageSelect(result.link)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="bg-white text-blue-600 px-4 py-2 rounded"
                onClick={() => handleImageSelect(result.link)}
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 