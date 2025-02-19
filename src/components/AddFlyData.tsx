import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Loader, Wand2 } from 'lucide-react';
import { queryOpenAI } from '../lib/openai';

interface Pattern {
  season_start: string;
  season_end: string;
  temp_min: number;
  temp_max: number;
}

interface FlyForm {
  name: string;
  description: string;
  image_url: string;
  categories: string[];
  season: string[];
  water_type: string[];
  target_species: string[];
  weather_conditions: string[];
  patterns: Pattern[];
}

const INITIAL_PATTERN: Pattern = {
  season_start: '03', // March
  season_end: '05',   // May
  temp_min: 45,       // Fahrenheit
  temp_max: 65
};

const INITIAL_FORM_STATE: FlyForm = {
  name: '',
  description: '',
  image_url: '',
  categories: [],
  season: [],
  water_type: [],
  target_species: [],
  weather_conditions: [],
  patterns: [{ ...INITIAL_PATTERN }]
};

export function AddFlyData() {
  const [formData, setFormData] = useState<FlyForm>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [incompleteFlies, setIncompleteFlies] = useState<string[]>([]);
  const [loadingIncompleteFly, setLoadingIncompleteFly] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        // Redirect to login or handle session expiry
        window.location.href = '/'; // or however you handle auth
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    fetchIncompleteFlies();
  }, []);

  const fetchIncompleteFlies = async () => {
    const { data, error } = await supabase
      .from('seasonal_fly_patterns')
      .select('fly_name')
      .or('temp_min.is.null,temp_max.is.null,season_start.is.null,season_end.is.null');

    if (error) {
      console.error('Error fetching incomplete flies:', error);
      return;
    }

    setIncompleteFlies(data.map(fly => fly.fly_name));
  };

  const handleSelectIncompleteFly = async (flyName: string) => {
    setLoadingIncompleteFly(true);
    try {
      // Fetch existing fly data
      const { data: flyData, error: flyError } = await supabase
        .from('flies')
        .select('*')
        .eq('name', flyName)
        .single();

      if (flyError) {
        setMessage(`Error fetching fly data: ${flyError.message}`);
        return;
      }

      // Set the form data with existing fly info
      setFormData({
        ...INITIAL_FORM_STATE,
        name: flyData.name,
        description: flyData.description || '',
        image_url: flyData.image_url || '',
        categories: flyData.categories || [],
        season: flyData.season || [],
        water_type: flyData.water_type || [],
        target_species: flyData.target_species || [],
        weather_conditions: flyData.weather_conditions || [],
        patterns: [{ ...INITIAL_PATTERN }]
      });

      // Generate AI content for the selected fly
      await generateAIContent();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoadingIncompleteFly(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // First check if fly exists
      const { data: existingFly } = await supabase
        .from('flies')
        .select('*')
        .eq('name', formData.name)
        .single();

      if (existingFly) {
        // If fly exists, update it while preserving the image_url if no new one is provided
        const { error: flyError } = await supabase
          .from('flies')
          .update({
            description: formData.description,
            image_url: formData.image_url || existingFly.image_url,
            categories: formData.categories,
            season: formData.season,
            water_type: formData.water_type,
            target_species: formData.target_species,
            weather_conditions: formData.weather_conditions
          })
          .eq('name', formData.name);

        if (flyError) throw flyError;
      } else {
        // If fly doesn't exist, insert it
        const { error: flyError } = await supabase
          .from('flies')
          .insert([{
            name: formData.name,
            description: formData.description,
            image_url: formData.image_url,
            categories: formData.categories,
            season: formData.season,
            water_type: formData.water_type,
            target_species: formData.target_species,
            weather_conditions: formData.weather_conditions
          }]);

        if (flyError) throw flyError;
      }

      // Delete existing patterns for this fly
      const { error: deleteError } = await supabase
        .from('seasonal_fly_patterns')
        .delete()
        .eq('fly_name', formData.name);

      if (deleteError) throw deleteError;

      // Insert new patterns
      const { error: patternError } = await supabase
        .from('seasonal_fly_patterns')
        .insert(formData.patterns.map(pattern => ({
          fly_name: formData.name,
          season_start: pattern.season_start,
          season_end: pattern.season_end,
          temp_min: pattern.temp_min,
          temp_max: pattern.temp_max,
          created_at: new Date().toISOString()
        })));

      if (patternError) throw patternError;

      // Run the query to insert missing flies
      const { error: missingFliesError } = await supabase
        .rpc('insert_missing_flies', {}, {
          head: false,
          count: 'exact'
        });

      if (missingFliesError) {
        console.error('Error inserting missing flies:', missingFliesError);
        // Don't throw error here to avoid interrupting the main flow
      }

      // After successful save, refresh the incomplete flies list
      await fetchIncompleteFlies();
      
      setMessage('Fly data saved successfully!');
      setFormData(INITIAL_FORM_STATE);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addPattern = () => {
    setFormData({
      ...formData,
      patterns: [...formData.patterns, { ...INITIAL_PATTERN }]
    });
  };

  const removePattern = (index: number) => {
    setFormData({
      ...formData,
      patterns: formData.patterns.filter((_, i) => i !== index)
    });
  };

  const generateAIContent = async () => {
    if (!formData.name) {
      setMessage('Please enter a fly name first');
      return;
    }

    setAiLoading(true);
    setMessage('AI is analyzing the fly...');

    try {
      // Get description
      const descriptionPrompt = `What type of fly is the ${formData.name}? Please provide a brief description for fly fishing.`;
      const description = await queryOpenAI(descriptionPrompt);

      // Enhanced target species prompt
      const speciesPrompt = `What species of fish does the ${formData.name} fly pattern typically target? Please list ONLY from these options, separated by commas: brown_trout, rainbow_trout, brook_trout, cutthroat_trout, salmon, steelhead, grayling. List ALL that apply.`;
      const speciesResponse = await queryOpenAI(speciesPrompt);
      const targetSpecies = speciesResponse
        .toLowerCase()
        .split(/[,.]/)
        .map(s => s.trim())
        .filter(s => [
          'brown_trout',
          'rainbow_trout',
          'brook_trout',
          'cutthroat_trout',
          'salmon',
          'steelhead',
          'grayling'
        ].includes(s.replace(/\s+/g, '_')));

      // Get seasons
      const seasonsPrompt = `What seasons is the ${formData.name} fly effective in? List ALL suitable seasons (spring, summer, fall, winter), separated by commas.`;
      const seasonsResponse = await queryOpenAI(seasonsPrompt);
      const season = seasonsResponse
        .toLowerCase()
        .split(/[,.]/)
        .map(s => s.trim())
        .filter(s => ['spring', 'summer', 'fall', 'winter'].includes(s));

      // Get water types
      const waterTypesPrompt = `What types of water is the ${formData.name} fly best used in? List ALL suitable water types (river, stream, lake, pond, saltwater), separated by commas.`;
      const waterTypesResponse = await queryOpenAI(waterTypesPrompt);
      const waterType = waterTypesResponse
        .toLowerCase()
        .split(/[,.]/)
        .map(s => s.trim())
        .filter(s => ['river', 'stream', 'lake', 'pond', 'saltwater'].includes(s));

      // Get categories
      const categoriesPrompt = `What categories does the ${formData.name} fly belong to? List ALL applicable categories (dry_fly, wet_fly, nymph, streamer, emerger, terrestrial, buzzer), separated by commas.`;
      const categoriesResponse = await queryOpenAI(categoriesPrompt);
      const categories = categoriesResponse
        .toLowerCase()
        .split(/[,.]/)
        .map(s => s.trim())
        .filter(s => [
          'dry_fly',
          'wet_fly',
          'nymph',
          'streamer',
          'emerger',
          'terrestrial',
          'buzzer'
        ].includes(s.replace(/\s+/g, '_')));

      // Get weather conditions
      const weatherPrompt = `What weather conditions is the ${formData.name} fly best fished in? List ALL suitable conditions (sunny, cloudy, overcast, rain, storm), separated by commas.`;
      const weatherResponse = await queryOpenAI(weatherPrompt);
      const weatherConditions = weatherResponse
        .toLowerCase()
        .split(/[,.]/)
        .map(s => s.trim())
        .filter(s => ['sunny', 'cloudy', 'overcast', 'rain', 'storm'].includes(s));

      // Updated seasonal patterns prompt
      const patternsPrompt = `For the ${formData.name} fly, please provide optimal fishing seasons in the following format:
        1. Season start month (1-12), Season end month (1-12), Minimum water temperature (°F), Maximum water temperature (°F)
        Example: March(3) to May(5), 45°F to 65°F`;
        
      const patternsResponse = await queryOpenAI(patternsPrompt);
      
      // Parse the patterns response
      const monthMap: { [key: string]: string } = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
      };

      const patterns: Pattern[] = [];
      
      try {
        const text = patternsResponse.toLowerCase();
        
        // Extract months
        const startMonth = Object.entries(monthMap).find(([month]) => text.includes(month))?.[1] || '03';
        const endMonth = Object.entries(monthMap)
          .filter(([month]) => text.includes(month))
          .slice(-1)[0]?.[1] || '05';
        
        // Extract temperatures
        const temps = text.match(/\d+°?f/g)?.map(t => parseInt(t)) || [45, 65];
        
        patterns.push({
          season_start: startMonth,
          season_end: endMonth,
          temp_min: Math.min(...temps),
          temp_max: Math.max(...temps)
        });
      } catch (error) {
        console.error('Error parsing patterns:', error);
        patterns.push(INITIAL_PATTERN);
      }

      // Update form data
      setFormData(prev => ({
        ...prev,
        description,
        target_species: targetSpecies,
        season,
        water_type: waterType,
        categories,
        weather_conditions: weatherConditions,
        patterns: patterns
      }));

      setMessage('AI analysis complete! Please review and adjust the suggestions as needed.');
    } catch (error: any) {
      setMessage(`AI Error: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Incomplete Flies Dropdown */}
      {incompleteFlies.length > 0 && (
        <div className="mb-8 p-4 bg-blue-900/50 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">
            Complete Missing Fly Data
          </h3>
          <div className="flex gap-4">
            <select
              className="flex-1 px-4 py-2 rounded bg-white text-gray-900 border border-white/20"
              onChange={(e) => e.target.value && handleSelectIncompleteFly(e.target.value)}
              value=""
              disabled={loadingIncompleteFly}
            >
              <option value="" className="text-gray-600">
                {loadingIncompleteFly ? 'Loading...' : 'Select a fly to complete...'}
              </option>
              {incompleteFlies.map(flyName => (
                <option key={flyName} value={flyName} className="text-gray-900">
                  {flyName}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-white/70 mt-2">
            {incompleteFlies.length} flies need additional information
          </p>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">Add New Fly</h2>

      {message && (
        <div className={`p-4 rounded mb-4 ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  className="flex-1 p-2 border rounded"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <button
                  type="button"
                  onClick={generateAIContent}
                  disabled={aiLoading || !formData.name}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {aiLoading ? (
                    <Loader className="animate-spin w-4 h-4" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  AI Assist
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full p-2 border rounded"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Classifications */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Classifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Categories</label>
              <select
                multiple
                size={7}
                className="w-full p-2 border rounded"
                value={formData.categories}
                onChange={(e) => setFormData({
                  ...formData,
                  categories: Array.from(e.target.selectedOptions, option => option.value)
                })}
              >
                <option value="dry_fly">Dry Fly</option>
                <option value="wet_fly">Wet Fly</option>
                <option value="nymph">Nymph</option>
                <option value="streamer">Streamer</option>
                <option value="emerger">Emerger</option>
                <option value="terrestrial">Terrestrial</option>
                <option value="buzzer">Buzzer</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Season</label>
              <select
                multiple
                size={4}
                className="w-full p-2 border rounded"
                value={formData.season}
                onChange={(e) => setFormData({
                  ...formData,
                  season: Array.from(e.target.selectedOptions, option => option.value)
                })}
              >
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
                <option value="winter">Winter</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Water Type</label>
              <select
                multiple
                size={5}
                className="w-full p-2 border rounded"
                value={formData.water_type}
                onChange={(e) => setFormData({
                  ...formData,
                  water_type: Array.from(e.target.selectedOptions, option => option.value)
                })}
              >
                <option value="river">River</option>
                <option value="stream">Stream</option>
                <option value="lake">Lake</option>
                <option value="pond">Pond</option>
                <option value="saltwater">Saltwater</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Target Species</label>
              <select
                multiple
                size={5}
                className="w-full p-2 border rounded"
                value={formData.target_species}
                onChange={(e) => setFormData({
                  ...formData,
                  target_species: Array.from(e.target.selectedOptions, option => option.value)
                })}
              >
                <option value="brown_trout">Brown Trout</option>
                <option value="rainbow_trout">Rainbow Trout</option>
                <option value="brook_trout">Brook Trout</option>
                <option value="cutthroat_trout">Cutthroat Trout</option>
                <option value="salmon">Salmon</option>
                <option value="steelhead">Steelhead</option>
                <option value="grayling">Grayling</option>
              </select>
            </div>
          </div>
        </section>

        {/* Seasonal Patterns */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Seasonal Patterns</h2>
          
          {formData.patterns.map((pattern, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 mb-4 p-4 border rounded">
              <div>
                <label className="block text-sm font-medium mb-1">Season Start Month</label>
                <select
                  className="w-full p-2 border rounded"
                  value={pattern.season_start}
                  onChange={(e) => {
                    const newPatterns = [...formData.patterns];
                    newPatterns[index].season_start = e.target.value;
                    setFormData({ ...formData, patterns: newPatterns });
                  }}
                >
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Season End Month</label>
                <select
                  className="w-full p-2 border rounded"
                  value={pattern.season_end}
                  onChange={(e) => {
                    const newPatterns = [...formData.patterns];
                    newPatterns[index].season_end = e.target.value;
                    setFormData({ ...formData, patterns: newPatterns });
                  }}
                >
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Min Temperature (°F)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={pattern.temp_min}
                  onChange={(e) => {
                    const newPatterns = [...formData.patterns];
                    newPatterns[index].temp_min = parseInt(e.target.value);
                    setFormData({ ...formData, patterns: newPatterns });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Temperature (°F)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={pattern.temp_max}
                  onChange={(e) => {
                    const newPatterns = [...formData.patterns];
                    newPatterns[index].temp_max = parseInt(e.target.value);
                    setFormData({ ...formData, patterns: newPatterns });
                  }}
                />
              </div>
            </div>
          ))}

          <button 
            type="button"
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setFormData({
              ...formData,
              patterns: [...formData.patterns, { ...INITIAL_PATTERN }]
            })}
          >
            Add Another Pattern
          </button>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader className="animate-spin" /> : null}
          Save Fly Data
        </button>
      </form>
    </div>
  );
} 