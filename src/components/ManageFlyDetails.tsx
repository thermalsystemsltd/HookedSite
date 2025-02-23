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

// First, define the valid weather conditions
const VALID_WEATHER_CONDITIONS = [
  'Clear, Sunny',
  'Mostly Clear',
  'Partly Cloudy',
  'Mostly Cloudy',
  'Cloudy',
  'Fog',
  'Light Fog',
  'Drizzle',
  'Rain',
  'Light Rain',
  'Heavy Rain',
  'Snow',
  'Flurries',
  'Light Snow',
  'Heavy Snow',
  'Freezing Drizzle',
  'Freezing Rain',
  'Light Freezing Rain',
  'Heavy Freezing Rain',
  'Ice Pellets',
  'Heavy Ice Pellets',
  'Light Ice Pellets',
  'Thunderstorm'
];

// Add valid seasons constant
const VALID_SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];

// Add season mapping function
const mapSeasons = (seasons: string[]): string[] => {
  const mappedSeasons = new Set<string>();
  
  seasons.forEach(season => {
    const normalized = season.toLowerCase().trim();
    if (normalized.includes('winter')) mappedSeasons.add('Winter');
    if (normalized.includes('spring')) mappedSeasons.add('Spring');
    if (normalized.includes('summer')) mappedSeasons.add('Summer');
    if (normalized.includes('fall') || normalized.includes('autumn')) mappedSeasons.add('Fall');
  });

  return Array.from(mappedSeasons);
};

// Define the expansion function first
const expandWeatherConditions = (conditions: string[]): string[] => {
  const expanded = new Set(conditions);
  
  // If it's clear and sunny, add related conditions
  if (conditions.includes('Clear, Sunny')) {
    expanded.add('Mostly Clear');
  }
  
  // If it's cloudy, add related conditions
  if (conditions.includes('Cloudy')) {
    expanded.add('Mostly Cloudy');
    expanded.add('Partly Cloudy');
  }
  
  // If it works in light rain, it probably works in drizzle
  if (conditions.includes('Light Rain')) {
    expanded.add('Drizzle');
  }
  
  // If it works in heavy rain, it probably works in light rain
  if (conditions.includes('Heavy Rain')) {
    expanded.add('Light Rain');
    expanded.add('Rain');
  }
  
  // If it works in heavy snow, it probably works in light snow
  if (conditions.includes('Heavy Snow')) {
    expanded.add('Light Snow');
    expanded.add('Snow');
  }
  
  return Array.from(expanded);
};

// Then define the mapping function that uses it
const mapWeatherConditions = (conditions: string[]): string[] => {
  const mappedConditions = conditions
    .map(condition => {
      // Try to find an exact match first
      if (VALID_WEATHER_CONDITIONS.includes(condition)) {
        return condition;
      }
      
      // Handle special case for "Clear, Sunny"
      if (condition === 'Clear' || condition === 'Sunny') {
        return 'Clear, Sunny';
      }
      
      // If no exact match, try to find the closest match
      const normalized = condition.toLowerCase();
      if (normalized.includes('mostly clear')) return 'Mostly Clear';
      if (normalized.includes('partly cloudy')) return 'Partly Cloudy';
      if (normalized.includes('mostly cloudy')) return 'Mostly Cloudy';
      if (normalized.includes('light fog')) return 'Light Fog';
      if (normalized.includes('light rain')) return 'Light Rain';
      if (normalized.includes('heavy rain')) return 'Heavy Rain';
      if (normalized.includes('light snow')) return 'Light Snow';
      if (normalized.includes('heavy snow')) return 'Heavy Snow';
      if (normalized.includes('freezing drizzle')) return 'Freezing Drizzle';
      if (normalized.includes('light freezing')) return 'Light Freezing Rain';
      if (normalized.includes('heavy freezing')) return 'Heavy Freezing Rain';
      if (normalized.includes('light ice')) return 'Light Ice Pellets';
      if (normalized.includes('heavy ice')) return 'Heavy Ice Pellets';
      
      // Basic matches
      if (normalized.includes('fog')) return 'Fog';
      if (normalized.includes('drizzle')) return 'Drizzle';
      if (normalized.includes('rain')) return 'Rain';
      if (normalized.includes('snow')) return 'Snow';
      if (normalized.includes('flurries')) return 'Flurries';
      if (normalized.includes('ice')) return 'Ice Pellets';
      if (normalized.includes('thunder')) return 'Thunderstorm';
      if (normalized.includes('cloudy')) return 'Cloudy';
      
      return null;
    })
    .filter((condition): condition is string => condition !== null);
    
  // Expand the mapped conditions
  return expandWeatherConditions(mappedConditions);
};

export function ManageFlyDetails() {
  const [flies, setFlies] = useState<Fly[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentFly, setCurrentFly] = useState<Fly | null>(null);
  const [editingDetails, setEditingDetails] = useState<Partial<Fly>>();
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedFlies, setSelectedFlies] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const fetchFlies = async () => {
    try {
      let query = supabase
        .from('flies')
        .select('*')
        .order('name');
      
      if (!showAll) {
        query = query.or('description.is.null,categories.is.null,season.is.null');
      }

      const { data, error } = await query;

      if (error) throw error;
      setFlies(data || []);
    } catch (err: any) {
      setMessage(`Error loading flies: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchFlies();
  }, [showAll]);

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
Season: [list applicable seasons from ONLY these options: Winter, Spring, Summer, Fall. Most flies work in multiple seasons, so list all that apply]
Water Types: [IMPORTANT: Most flies work effectively across multiple water types. List ALL water types where this fly pattern could reasonably be effective from these options: Lakes, Rivers, Salt Water, Streams. For example:
- If it works in Streams, it usually works in Rivers too
- Most freshwater patterns work in both Rivers and Lakes
- Only include Salt Water for specific saltwater patterns
Please be comprehensive in listing all applicable water types.]
Weather Conditions: [IMPORTANT: List at least 3-4 weather conditions when this fly is most effective. Most flies work in various weather conditions. Use ONLY these exact terms and be comprehensive: Clear, Sunny, Mostly Clear, Partly Cloudy, Mostly Cloudy, Cloudy, Fog, Light Fog, Drizzle, Rain, Light Rain, Heavy Rain, Snow, Flurries, Light Snow, Heavy Snow, Freezing Drizzle, Freezing Rain, Light Freezing Rain, Heavy Freezing Rain, Ice Pellets, Heavy Ice Pellets, Light Ice Pellets, Thunderstorm. For example:
- If it works in Cloudy conditions, it likely works in Mostly Cloudy and Partly Cloudy too
- Many dry flies work well in Clear, Sunny, and Partly Cloudy conditions
- Many nymphs work across multiple weather conditions including cloudy and light rain]
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
      // Filter water types to only allow valid options
      const validWaterTypes = ['Lakes', 'Rivers', 'Salt Water', 'Streams'];
      const filteredWaterType = waterType
        .map(w => w.replace(/["']/g, '').trim())
        .filter(w => validWaterTypes.includes(w));

      // Add water type expansion logic
      const expandWaterTypes = (waterTypes: string[]) => {
        const expanded = new Set(waterTypes);
        
        // If it works in streams, it likely works in rivers
        if (waterTypes.includes('Streams')) {
          expanded.add('Rivers');
        }
        
        // If it works in rivers, it likely works in streams
        if (waterTypes.includes('Rivers')) {
          expanded.add('Streams');
        }
        
        // Most freshwater patterns work in both rivers and lakes
        if (waterTypes.includes('Rivers') || waterTypes.includes('Streams')) {
          expanded.add('Lakes');
        }
        
        // Don't automatically add Salt Water - that should be explicit
        return Array.from(expanded);
      };

      const expandedWaterType = expandWaterTypes(filteredWaterType);

      // Add weather expansion logic similar to water types
      const expandWeatherConditions = (conditions: string[]): string[] => {
        const expanded = new Set(conditions);
        
        // If it's clear and sunny, add related conditions
        if (conditions.includes('Clear, Sunny')) {
          expanded.add('Mostly Clear');
        }
        
        // If it's cloudy, add related conditions
        if (conditions.includes('Cloudy')) {
          expanded.add('Mostly Cloudy');
          expanded.add('Partly Cloudy');
        }
        
        // If it works in light rain, it probably works in drizzle
        if (conditions.includes('Light Rain')) {
          expanded.add('Drizzle');
        }
        
        // If it works in heavy rain, it probably works in light rain
        if (conditions.includes('Heavy Rain')) {
          expanded.add('Light Rain');
          expanded.add('Rain');
        }
        
        // If it works in heavy snow, it probably works in light snow
        if (conditions.includes('Heavy Snow')) {
          expanded.add('Light Snow');
          expanded.add('Snow');
        }
        
        return Array.from(expanded);
      };

      const weatherConditions = detailsResponse.match(/Weather Conditions: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
      const mappedWeatherConditions = mapWeatherConditions(
        weatherConditions.map(w => w.replace(/["']/g, '').trim())
      );
      const targetSpecies = detailsResponse.match(/Target Species: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
      const tempRange = detailsResponse.match(/Temperature Range: (.*?)(?:\n|$)/)?.[1].split('-').map(t => parseFloat(t.trim()));
      const depth = detailsResponse.match(/Fishing Depth: (.*?)(?:\n|$)/)?.[1].trim();

      // Add season mapping function
      const mappedSeasons = mapSeasons(
        season.map(s => s.replace(/["']/g, '').trim())
      );

      setEditingDetails({
        description: description,
        categories: categories.map(c => c.replace(/["']/g, '')),
        season: mappedSeasons,
        water_type: expandedWaterType,
        weather_conditions: mappedWeatherConditions,
        target_species: targetSpecies.map(t => t.replace(/["']/g, '')),
        temp_min: tempRange[0] || 0,
        temp_max: tempRange[1] || 30,
        season_start: '03',
        season_end: '09',
        depth: depth
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
      fetchFlies();
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

  const handleReprocessFly = async (fly: Fly) => {
    setCurrentFly(fly);
    await getAIDetails(fly.name);
  };

  const processSelectedFlies = async () => {
    try {
      setBatchProcessing(true);
      setMessage('Starting batch processing...');

      const selectedFlyIds = Array.from(selectedFlies);
      const fliesToProcess = flies.filter(fly => selectedFlyIds.includes(fly.id));

      setTotalCount(fliesToProcess.length);
      setProcessedCount(0);

      // Process flies in batches of 3 to avoid rate limits
      for (let i = 0; i < fliesToProcess.length; i += 3) {
        const batch = fliesToProcess.slice(i, i + 3);
        await Promise.all(batch.map(async (fly) => {
          try {
            // Get AI details
            const descriptionPrompt = `Given the following fly fishing pattern: "${fly.name}", provide a detailed description of the fly pattern, its history, and how it's typically tied (2-3 sentences).`;
            const description = await queryOpenAI(descriptionPrompt);

            const detailsPrompt = `Using this description of the ${fly.name}:
"${description}"

Provide specific details in this exact format:
Categories: [list all applicable fly types from these options: Dry Fly, Wet Fly, Nymph, Streamer, Buzzer, Emerger, Salmon Fly, Terrestrial]
Season: [list applicable seasons from ONLY these options: Winter, Spring, Summer, Fall. Most flies work in multiple seasons, so list all that apply]
Water Types: [IMPORTANT: Most flies work effectively across multiple water types. List ALL water types where this fly pattern could reasonably be effective from these options: Lakes, Rivers, Salt Water, Streams. For example:
- If it works in Streams, it usually works in Rivers too
- Most freshwater patterns work in both Rivers and Lakes
- Only include Salt Water for specific saltwater patterns
Please be comprehensive in listing all applicable water types.]
Weather Conditions: [IMPORTANT: List at least 3-4 weather conditions when this fly is most effective. Most flies work in various weather conditions. Use ONLY these exact terms and be comprehensive: Clear, Sunny, Mostly Clear, Partly Cloudy, Mostly Cloudy, Cloudy, Fog, Light Fog, Drizzle, Rain, Light Rain, Heavy Rain, Snow, Flurries, Light Snow, Heavy Snow, Freezing Drizzle, Freezing Rain, Light Freezing Rain, Heavy Freezing Rain, Ice Pellets, Heavy Ice Pellets, Light Ice Pellets, Thunderstorm. For example:
- If it works in Cloudy conditions, it likely works in Mostly Cloudy and Partly Cloudy too
- Many dry flies work well in Clear, Sunny, and Partly Cloudy conditions
- Many nymphs work across multiple weather conditions including cloudy and light rain]
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
            // Filter water types to only allow valid options
            const validWaterTypes = ['Lakes', 'Rivers', 'Salt Water', 'Streams'];
            const filteredWaterType = waterType
              .map(w => w.replace(/["']/g, '').trim())
              .filter(w => validWaterTypes.includes(w));

            // Add water type expansion logic
            const expandWaterTypes = (waterTypes: string[]) => {
              const expanded = new Set(waterTypes);
              
              // If it works in streams, it likely works in rivers
              if (waterTypes.includes('Streams')) {
                expanded.add('Rivers');
              }
              
              // If it works in rivers, it likely works in streams
              if (waterTypes.includes('Rivers')) {
                expanded.add('Streams');
              }
              
              // Most freshwater patterns work in both rivers and lakes
              if (waterTypes.includes('Rivers') || waterTypes.includes('Streams')) {
                expanded.add('Lakes');
              }
              
              // Don't automatically add Salt Water - that should be explicit
              return Array.from(expanded);
            };

            const expandedWaterType = expandWaterTypes(filteredWaterType);

            // Add weather expansion logic similar to water types
            const expandWeatherConditions = (conditions: string[]): string[] => {
              const expanded = new Set(conditions);
              
              // If it's clear and sunny, add related conditions
              if (conditions.includes('Clear, Sunny')) {
                expanded.add('Mostly Clear');
              }
              
              // If it's cloudy, add related conditions
              if (conditions.includes('Cloudy')) {
                expanded.add('Mostly Cloudy');
                expanded.add('Partly Cloudy');
              }
              
              // If it works in light rain, it probably works in drizzle
              if (conditions.includes('Light Rain')) {
                expanded.add('Drizzle');
              }
              
              // If it works in heavy rain, it probably works in light rain
              if (conditions.includes('Heavy Rain')) {
                expanded.add('Light Rain');
                expanded.add('Rain');
              }
              
              // If it works in heavy snow, it probably works in light snow
              if (conditions.includes('Heavy Snow')) {
                expanded.add('Light Snow');
                expanded.add('Snow');
              }
              
              return Array.from(expanded);
            };

            const weatherConditions = detailsResponse.match(/Weather Conditions: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
            const mappedWeatherConditions = mapWeatherConditions(
              weatherConditions.map(w => w.replace(/["']/g, '').trim())
            );
            const targetSpecies = detailsResponse.match(/Target Species: (.*?)(?:\n|$)/)?.[1].match(/["'][^"']+["']|\S+/g) || [];
            const tempRange = detailsResponse.match(/Temperature Range: (.*?)(?:\n|$)/)?.[1].split('-').map(t => parseFloat(t.trim()));
            const depth = detailsResponse.match(/Fishing Depth: (.*?)(?:\n|$)/)?.[1].trim();

            // Add season mapping function
            const mappedSeasons = mapSeasons(
              season.map(s => s.replace(/["']/g, '').trim())
            );

            // Update the fly in the database
            const { error: updateError } = await supabase
              .from('flies')
              .update({
                description: description,
                categories: categories.map(c => c.replace(/["']/g, '')),
                season: mappedSeasons,
                water_type: expandedWaterType,
                weather_conditions: mappedWeatherConditions,
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
      setSelectedFlies(new Set());
    } catch (err: any) {
      setMessage(`Batch processing error: ${err.message}`);
    } finally {
      setBatchProcessing(false);
      fetchFlies();
    }
  };

  const renderBatchProcessing = () => (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
          >
            {showAll ? 'Show Incomplete Only' : 'Show All Flies'}
          </button>
          <button
            onClick={() => {
              if (selectedFlies.size === flies.length) {
                setSelectedFlies(new Set());
              } else {
                setSelectedFlies(new Set(flies.map(f => f.id)));
              }
            }}
            className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
          >
            {selectedFlies.size === flies.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <button
          onClick={processSelectedFlies}
          disabled={batchProcessing || selectedFlies.size === 0}
          className={`px-4 py-2 rounded ${
            batchProcessing || selectedFlies.size === 0
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {batchProcessing ? 'Processing...' : `Process Selected (${selectedFlies.size})`}
        </button>
      </div>
      {batchProcessing && (
        <div>
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

  // Update the fly list rendering to include checkboxes and reprocess button
  const renderFlyList = () => (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium mb-4">Select Flies</h3>
      <div className="space-y-2">
        {flies.map(fly => (
          <div key={fly.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedFlies.has(fly.id)}
                onChange={e => {
                  const newSelected = new Set(selectedFlies);
                  if (e.target.checked) {
                    newSelected.add(fly.id);
                  } else {
                    newSelected.delete(fly.id);
                  }
                  setSelectedFlies(newSelected);
                }}
                className="mr-3"
              />
              <button
                onClick={() => handleFlySelect(fly)}
                className={`text-left p-2 rounded hover:bg-gray-100 ${
                  currentFly?.id === fly.id ? 'bg-blue-50' : ''
                }`}
              >
                {fly.name}
              </button>
            </div>
            <button
              onClick={() => handleReprocessFly(fly)}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
              title="Reprocess this fly"
            >
              ↻
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderBatchProcessing()}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Manage Fly Details</h2>
        <div className="text-sm text-gray-600">
          {flies.length} flies {!showAll && 'need details'}
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
        {renderFlyList()}
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
                  <div className="space-y-2">
                    {VALID_SEASONS.map(season => (
                      <label key={season} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingDetails?.season?.includes(season) || false}
                          onChange={e => {
                            const currentSeasons = editingDetails?.season || [];
                            setEditingDetails(prev => ({
                              ...prev!,
                              season: e.target.checked
                                ? [...currentSeasons, season]
                                : currentSeasons.filter(s => s !== season)
                            }));
                          }}
                          className="mr-2"
                        />
                        {season}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Water Types</label>
                  <div className="space-y-2">
                    {['Lakes', 'Rivers', 'Salt Water', 'Streams'].map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingDetails?.water_type?.includes(type) || false}
                          onChange={e => {
                            const currentTypes = editingDetails?.water_type || [];
                            setEditingDetails(prev => ({
                              ...prev!,
                              water_type: e.target.checked
                                ? [...currentTypes, type]
                                : currentTypes.filter(t => t !== type)
                            }));
                          }}
                          className="mr-2"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weather Conditions</label>
                  <div className="space-y-2">
                    {VALID_WEATHER_CONDITIONS.map(condition => (
                      <label key={condition} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingDetails?.weather_conditions?.includes(condition) || false}
                          onChange={e => {
                            const currentConditions = editingDetails?.weather_conditions || [];
                            setEditingDetails(prev => ({
                              ...prev!,
                              weather_conditions: e.target.checked
                                ? [...currentConditions, condition]
                                : currentConditions.filter(c => c !== condition)
                            }));
                          }}
                          className="mr-2"
                        />
                        {condition}
                      </label>
                    ))}
                  </div>
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