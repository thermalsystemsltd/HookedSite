import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Loader } from 'lucide-react';

const GOOGLE_API_KEY = 'AIzaSyAS_3fMmARCHNMRZHf7wAPbs-ChUGqxEQ4';
const SEARCH_ENGINE_ID = 'c15b9822121d049d7';

interface Fly {
  id: number;
  name: string;
  image_url: string | null;
}

interface SearchResult {
  link: string;
  title: string;
  image: {
    thumbnailLink: string;
  };
}

export function FlyImageSearch() {
  const [flies, setFlies] = useState<Fly[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFly, setSelectedFly] = useState<Fly | null>(null);

  useEffect(() => {
    fetchFlies();
  }, []);

  const fetchFlies = async () => {
    try {
      const { data, error } = await supabase
        .from('flies')
        .select('*')
        .order('name');

      if (error) throw error;
      setFlies(data || []);
    } catch (err: any) {
      setMessage(`Error loading flies: ${err.message}`);
    }
  };

  const searchImagesForFly = async (fly: Fly) => {
    setLoading(true);
    setMessage('');
    setSelectedFly(fly);
    
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${fly.name} fly fishing fly&searchType=image&num=5`
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
        .eq('id', selectedFly.id);

      if (updateError) throw updateError;

      setMessage('Image updated successfully!');
      setSearchResults([]);
      setSelectedFly(null);
      fetchFlies(); // Refresh the flies list
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Update Fly Images</h2>
      
      {message && (
        <div className={`p-4 rounded mb-4 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Flies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {flies.map((fly) => (
          <div 
            key={fly.id} 
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedFly?.id === fly.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
            }`}
            onClick={() => searchImagesForFly(fly)}
          >
            <div className="flex items-center gap-4">
              {fly.image_url && (
                <img 
                  src={fly.image_url} 
                  alt={fly.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div>
                <h3 className="font-semibold">{fly.name}</h3>
                <p className="text-sm text-gray-500">
                  {fly.image_url ? 'Click to update image' : 'Click to add image'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Search Results */}
      {selectedFly && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">
            Select an image for: {selectedFly.name}
          </h3>
          {loading ? (
            <div className="flex justify-center">
              <Loader className="animate-spin w-8 h-8 text-blue-600" />
            </div>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
} 