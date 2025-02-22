import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { queryOpenAI } from '../lib/openai';

interface Fly {
  id: string; // Changed to uuid
  name: string;
  description: string;
  categories: string[];
  season: string[];
  water_type: string[];
  target_species: string[];
  weather_conditions: string[];
  season_start: string;
  season_end: string;
  temp_min: number;
  temp_max: number;
  depth: string;  // Changed to string
}

export function ManageFlyDetails() {
  const [flies, setFlies] = useState<Fly[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentFly, setCurrentFly] = useState<Fly | null>(null);
  const [editingDetails, setEditingDetails] = useState<Partial<Fly>>();
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchIncompleteFlies();
  }, []);

  const fetchIncompleteFlies = async () => {
    try {
      const { data, error } = await supabase
        .from('flies')
        .select('*')
        .or('description.is.null,categories.is.null,season.is.null')
        .order('name');

      if (error) throw error;
      setFlies(data || []);
    } catch (err: any) {
      setMessage(`Error loading flies: ${err.message}`);
    }
  };

  const getAIDetails = async (flyName: string) => {
    setLoading(true);
    try {
      // First, get a detailed description
      const descriptionPrompt = `Given the following fly fishing pattern: "${flyName}", provide a detailed description of the fly pattern, its history, and how it's typically tied (2-3 sentences).`;
      
      const description = await queryOpenAI(descriptionPrompt);

      // Then use that description to inform the specific details
      const detailsPrompt = `Using this description of the ${flyName}:
"${description}"

Provide specific details in this exact format:
Categories: [list all applicable fly types from these options: Dry Fly, Wet Fly, Nymph, Streamer, Buzzer, Emerger, Salmon Fly, Terrestrial]
Season: [list specific seasons when this fly is most effective]
Water Types: [list specific water bodies and conditions where this fly works best]
Weather Conditions: [list specific weather conditions ideal for this fly]
Target Species: [list specific fish species this fly is designed to catch]
Temperature Range: [specific min-max in Celsius when this fly is most effective]
Fishing Depth: [specify one of these options:
- Surface (for dry flies and terrestrials)
- Film (for emergers and spent flies)
- Subsurface (for wet flies and shallow nymphs)
- Mid-Column (for nymphs and streamers)
- Deep (for heavy nymphs and deep streamers)]`;

      const detailsResponse = await queryOpenAI(detailsPrompt);
      
      // Parse AI responses into structured data
      const categories = detailsResponse.match(/Categories: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
      const season = detailsResponse.match(/Season: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
      const waterType = detailsResponse.match(/Water Types: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
      const weatherConditions = detailsResponse.match(/Weather Conditions: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
      const targetSpecies = detailsResponse.match(/Target Species: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
      const tempRange = detailsResponse.match(/Temperature Range: (.*?)(?:\n|$)/)?.[1].split('-').map(t => parseFloat(t.trim()));
      const depth = detailsResponse.match(/Fishing Depth: (.*?)(?:\n|$)/)?.[1].trim();

      setEditingDetails({
        description: description,
        categories: categories.map(c => c.replace(/["']/g, '')),
        season: season.map(s => s.replace(/["']/g, '')),
        water_type: waterType.map(w => w.replace(/["']/g, '')),
        weather_conditions: weatherConditions.map(w => w.replace(/["']/g, '')),
        target_species: targetSpecies.map(t => t.replace(/["']/g, '')),
        temp_min: tempRange[0] || 0,
        temp_max: tempRange[1] || 30,
        season_start: '03', // Default to March
        season_end: '09',   // Default to September
        depth: depth        // Now storing as string
      });
    } catch (err: any) {
      setMessage(`Error getting AI details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveDetails = async () => {
    if (!currentFly || !editingDetails) return;

    try {
      const { error } = await supabase
        .from('flies')
        .update(editingDetails)
        .eq('id', currentFly.id);

      if (error) throw error;
      
      setMessage('Details saved successfully!');
      setCurrentFly(null);
      setEditingDetails(undefined);
      fetchIncompleteFlies();
    } catch (err: any) {
      setMessage(`Error saving details: ${err.message}`);
    }
  };

  const handleFlySelect = (fly: Fly) => {
    setCurrentFly(fly);
    setEditingDetails(fly);
    if (!fly.description || !fly.categories?.length) {
      getAIDetails(fly.name);
    }
  };

  const processAllFlies = async () => {
    try {
      setBatchProcessing(true);
      setMessage('Starting batch processing...');

      // Get all flies
      const { data: allFlies, error: fetchError } = await supabase
        .from('flies')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;
      if (!allFlies) throw new Error('No flies found');

      setTotalCount(allFlies.length);
      setProcessedCount(0);

      // Process flies in batches of 3 to avoid rate limits
      for (let i = 0; i < allFlies.length; i += 3) {
        const batch = allFlies.slice(i, i + 3);
        await Promise.all(batch.map(async (fly) => {
          try {
            // Get AI details
            const descriptionPrompt = `Given the following fly fishing pattern: "${fly.name}", provide a detailed description of the fly pattern, its history, and how it's typically tied (2-3 sentences).`;
            const description = await queryOpenAI(descriptionPrompt);

            const detailsPrompt = `Using this description of the ${fly.name}:
"${description}"

Provide specific details in this exact format:
Categories: [list all applicable fly types from these options: Dry Fly, Wet Fly, Nymph, Streamer, Buzzer, Emerger, Salmon Fly, Terrestrial]
Season: [list specific seasons when this fly is most effective]
Water Types: [list specific water bodies and conditions where this fly works best]
Weather Conditions: [list specific weather conditions ideal for this fly]
Target Species: [list specific fish species this fly is designed to catch]
Temperature Range: [specific min-max in Celsius when this fly is most effective]
Fishing Depth: [specify one of these options:
- Surface (for dry flies and terrestrials)
- Film (for emergers and spent flies)
- Subsurface (for wet flies and shallow nymphs)
- Mid-Column (for nymphs and streamers)
- Deep (for heavy nymphs and deep streamers)]`;

            const detailsResponse = await queryOpenAI(detailsPrompt);

            // Parse responses
            const categories = detailsResponse.match(/Categories: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
            const season = detailsResponse.match(/Season: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
            const waterType = detailsResponse.match(/Water Types: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
            const weatherConditions = detailsResponse.match(/Weather Conditions: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
            const targetSpecies = detailsResponse.match(/Target Species: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
            const tempRange = detailsResponse.match(/Temperature Range: (.*?)(?:\n|$)/)?.[1].split('-').map(t => parseFloat(t.trim()));
            const depth = detailsResponse.match(/Fishing Depth: (.*?)(?:\n|$)/)?.[1].trim();

            // Update the fly in the database
            const { error: updateError } = await supabase
              .from('flies')
              .update({
                description: description,
                categories: categories.map(c => c.replace(/["']/g, '')),
                season: season.map(s => s.replace(/["']/g, '')),
                water_type: waterType.map(w => w.replace(/["']/g, '')),
                weather_conditions: weatherConditions.map(w => w.replace(/["']/g, '')),
                target_species: targetSpecies.map(t => t.replace(/["']/g, '')),
                temp_min: tempRange[0] || 0,
                temp_max: tempRange[1] || 30,
                depth: depth,
                season_start: '03',
                season_end: '09'
              })
              .eq('id', fly.id);

            if (updateError) throw updateError;
            setProcessedCount(prev => prev + 1);
          } catch (err: any) {
            console.error(`Error processing fly ${fly.name}:`, err);
            setMessage(`Error processing ${fly.name}: ${err.message}`);
          }
        }));

        // Add a delay between batches to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setMessage('Batch processing completed successfully!');
    } catch (err: any) {
      setMessage(`Batch processing error: ${err.message}`);
    } finally {
      setBatchProcessing(false);
      fetchIncompleteFlies();
    }
  };

  const renderBatchProcessing = () => (
    <div className="mb-6">
      <button
        onClick={processAllFlies}
        disabled={batchProcessing}
        className={`px-4 py-2 rounded ${
          batchProcessing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {batchProcessing ? 'Processing...' : 'Process All Flies'}
      </button>
      {batchProcessing && (
        <div className="mt-2">
          <div className="text-sm text-gray-600">
            Processing flies: {processedCount} / {totalCount}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-green-600 h-2.5 rounded-full" 
              style={{ width: `${(processedCount / totalCount) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {renderBatchProcessing()}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Manage Fly Details</h2>
        <div className="text-sm text-gray-600">
          {flies.length} flies need details
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fly List */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-4">Select a Fly</h3>
          <div className="space-y-2">
            {flies.map(fly => (
              <button
                key={fly.id}
                onClick={() => handleFlySelect(fly)}
                className={`w-full text-left p-2 rounded hover:bg-gray-100 ${
                  currentFly?.id === fly.id ? 'bg-blue-50' : ''
                }`}
              >
                {fly.name}
              </button>
            ))}
          </div>
        </div>

        {/* Details Form */}
        {currentFly && (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">Edit Details for {currentFly.name}</h3>
            {loading ? (
              <div className="text-center py-4">Loading AI suggestions...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={editingDetails?.description || ''}
                    onChange={e => setEditingDetails(prev => ({ ...prev!, description: e.target.value }))}
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categories</label>
                  <input
                    type="text"
                    value={editingDetails?.categories?.join(', ') || ''}
                    onChange={e => setEditingDetails(prev => ({ 
                      ...prev!, 
                      categories: e.target.value.split(',').map(s => s.trim()) 
                    }))}
                    className="w-full p-2 border rounded"
                    placeholder="Dry Fly, Nymph, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Season</label>
                  <input
                    type="text"
                    value={editingDetails?.season?.join(', ') || ''}
                    onChange={e => setEditingDetails(prev => ({ 
                      ...prev!, 
                      season: e.target.value.split(',').map(s => s.trim()) 
                    }))}
                    className="w-full p-2 border rounded"
                    placeholder="Spring, Summer, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Water Types</label>
                  <input
                    type="text"
                    value={editingDetails?.water_type?.join(', ') || ''}
                    onChange={e => setEditingDetails(prev => ({ 
                      ...prev!, 
                      water_type: e.target.value.split(',').map(s => s.trim()) 
                    }))}
                    className="w-full p-2 border rounded"
                    placeholder="Rivers, Lakes, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weather Conditions</label>
                  <input
                    type="text"
                    value={editingDetails?.weather_conditions?.join(', ') || ''}
                    onChange={e => setEditingDetails(prev => ({ 
                      ...prev!, 
                      weather_conditions: e.target.value.split(',').map(s => s.trim()) 
                    }))}
                    className="w-full p-2 border rounded"
                    placeholder="Sunny, Cloudy, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Species</label>
                  <input
                    type="text"
                    value={editingDetails?.target_species?.join(', ') || ''}
                    onChange={e => setEditingDetails(prev => ({ 
                      ...prev!, 
                      target_species: e.target.value.split(',').map(s => s.trim()) 
                    }))}
                    className="w-full p-2 border rounded"
                    placeholder="Rainbow Trout, Brown Trout, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Min Temp (°C)</label>
                    <input
                      type="number"
                      value={editingDetails?.temp_min || 0}
                      onChange={e => setEditingDetails(prev => ({ 
                        ...prev!, 
                        temp_min: parseFloat(e.target.value) 
                      }))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Temp (°C)</label>
                    <input
                      type="number"
                      value={editingDetails?.temp_max || 30}
                      onChange={e => setEditingDetails(prev => ({ 
                        ...prev!, 
                        temp_max: parseFloat(e.target.value) 
                      }))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fishing Depth</label>
                  <select
                    value={editingDetails?.depth || 'Surface'}
                    onChange={e => setEditingDetails(prev => ({ 
                      ...prev!, 
                      depth: e.target.value 
                    }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Surface">Surface</option>
                    <option value="Film">Film</option>
                    <option value="Subsurface">Subsurface</option>
                    <option value="Mid-Column">Mid-Column</option>
                    <option value="Deep">Deep</option>
                  </select>
                  <span className="text-xs text-gray-500 mt-1">
                    Select the typical fishing depth for this pattern
                  </span>
                </div>
                <button
                  onClick={saveDetails}
                  className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Details
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 