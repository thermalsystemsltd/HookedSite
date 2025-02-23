import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Loader } from 'lucide-react';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = import.meta.env.VITE_SEARCH_ENGINE_ID;

interface FlyDetails {
  type: string;
  weather_conditions: string;
  time_of_day: string;
  seasonal_timing: string;
  depth_preference: string;
  target_species: string;
}

interface Fly {
  id: number;
  name: string;
  image_url: string | null;
  details?: FlyDetails;  // Making this optional since existing records won't have it
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
  const [editingDetails, setEditingDetails] = useState<FlyDetails | null>(null);
  const [processingAI, setProcessingAI] = useState(false);

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
      const searchQuery = `${fly.name} fly fishing pattern fly tying`;
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=5`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch images');
      }
      
      const data = await response.json();
      
      if (data.items) {
        setSearchResults(data.items);
      } else {
        setMessage('No images found');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveFlyDetails = async (flyId: number, details: FlyDetails) => {
    try {
      const { error } = await supabase
        .from('flies')
        .update({ details })
        .eq('id', flyId);

      if (error) throw error;
      
      setMessage('Fly details saved successfully!');
      setEditingDetails(null);
      fetchFlies();
    } catch (err: any) {
      setMessage(`Error saving details: ${err.message}`);
    }
  };

  const handleImageSelect = async (imageUrl: string) => {
    if (!selectedFly) return;
    
    setLoading(true);
    setMessage('');

    try {
      // Use Cloudflare Worker to proxy the image request
      const proxyUrl = `/image-proxy?url=${encodeURIComponent(imageUrl)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();
      
      // Upload to Supabase with correct content type
      const fileExt = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('fly-images')
        .upload(fileName, blob, {
          contentType: blob.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL using the correct format
      const { data: urlData } = supabase.storage
        .from('fly-images')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update fly record with just the image URL
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
      console.error('Upload error:', err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFlyClick = async (fly: Fly) => {
    setSelectedFly(fly);
    if (!fly.details) {
      try {
        const details = await fetchFlyDetails(fly.name);
        setEditingDetails(details);
      } catch (err: any) {
        setMessage(`Error getting AI details: ${err.message}`);
      }
    } else {
      setEditingDetails(fly.details);
    }
  };

  const renderFlyDetailsForm = () => {
    if (!selectedFly || !editingDetails) return null;

    return (
      <div className="mt-6 p-4 border rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Edit Fly Details: {selectedFly.name}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <input
              type="text"
              value={editingDetails.type}
              onChange={(e) => setEditingDetails({...editingDetails, type: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => saveFlyDetails(selectedFly.id, editingDetails)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save Details
            </button>
            <button
              onClick={() => setEditingDetails(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
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
            onClick={() => handleFlyClick(fly)}
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
          {renderFlyDetailsForm()}
        </div>
      )}
    </div>
  );
} 