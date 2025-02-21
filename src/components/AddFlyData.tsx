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
  season_start: string;
  season_end: string;
  temp_min: number;
  temp_max: number;
}

const INITIAL_PATTERN: Pattern = {
  season_start: '03', // March
  season_end: '05',   // May
  temp_min: 7,        // Celsius (was 45°F)
  temp_max: 18        // Celsius (was 65°F)
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
  season_start: '03', // March
  season_end: '05',   // May
  temp_min: 7,        // Celsius
  temp_max: 18        // Celsius
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
      .from('flies')
      .select('name')
      .or('temp_min.is.null,temp_max.is.null,season_start.is.null,season_end.is.null,description.is.null')
      .order('name');

    if (error) {
      console.error('Error fetching incomplete flies:', error);
      return;
    }

    setIncompleteFlies(data.map(fly => fly.name));
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
        season_start: flyData.season_start || '03',
        season_end: flyData.season_end || '05',
        temp_min: flyData.temp_min || 7,
        temp_max: flyData.temp_max || 18
      });

      // Generate AI content for the selected fly
      await generateAIContent();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoadingIncompleteFly(false);
    }
  };

  const validateTemperatureRange = (min: number, max: number): string | null => {
    if (min < -10 || max > 35) return 'Temperature should be between -10°C and 35°C';
    if (min > max) return 'Minimum temperature cannot be higher than maximum';
    return null;
  };

  const validateSeasonRange = (start: string, end: string): string | null => {
    const startNum = parseInt(start);
    const endNum = parseInt(end);
    if (startNum < 1 || startNum > 12 || endNum < 1 || endNum > 12) {
      return 'Invalid month number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate temperature range
    const tempError = validateTemperatureRange(formData.temp_min, formData.temp_max);
    if (tempError) {
      setMessage(tempError);
      return;
    }

    // Validate season range
    const seasonError = validateSeasonRange(formData.season_start, formData.season_end);
    if (seasonError) {
      setMessage(seasonError);
      return;
    }

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
        // Update existing fly
        const { error: updateError } = await supabase
          .from('flies')
          .update({
            description: formData.description,
            image_url: formData.image_url || existingFly.image_url,
            categories: formData.categories,
            season: formData.season,
            water_type: formData.water_type,
            target_species: formData.target_species,
            weather_conditions: formData.weather_conditions,
            season_start: formData.season_start,
            season_end: formData.season_end,
            temp_min: formData.temp_min,
            temp_max: formData.temp_max
          })
          .eq('name', formData.name);

        if (updateError) throw updateError;
      } else {
        // Insert new fly
        const { error: insertError } = await supabase
          .from('flies')
          .insert([{
            name: formData.name,
            description: formData.description,
            image_url: formData.image_url,
            categories: formData.categories,
            season: formData.season,
            water_type: formData.water_type,
            target_species: formData.target_species,
            weather_conditions: formData.weather_conditions,
            season_start: formData.season_start,
            season_end: formData.season_end,
            temp_min: formData.temp_min,
            temp_max: formData.temp_max
          }]);

        if (insertError) throw insertError;
      }

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
    try {
      // Get description
      const descriptionPrompt = `What type of fly is the ${formData.name}? Please provide a brief description for fly fishing.`;
      const descriptionResponse = await queryOpenAI(descriptionPrompt);
      
      // Get target species
      const speciesPrompt = `What species of fish does the ${formData.name} fly pattern typically target? Please list ONLY from these options, separated by commas: brown_trout, rainbow_trout, brook_trout, cutthroat_trout, salmon, steelhead, grayling. List ALL that apply.`;
      const speciesResponse = await queryOpenAI(speciesPrompt);
      const targetSpecies = speciesResponse
        .toLowerCase()
        .split(/[,.]/)
        .map(s => s.trim())
        .filter(s => ['brown_trout', 'rainbow_trout', 'brook_trout', 'cutthroat_trout', 'salmon', 'steelhead', 'grayling'].includes(s));

      // Get seasons
      const seasonsPrompt = `What seasons is the ${formData.name} fly effective in? List ALL suitable seasons (spring, summer, fall, winter), separated by commas.`;
      const seasonsResponse = await queryOpenAI(seasonsPrompt);
      const seasons = seasonsResponse
        .toLowerCase()
        .split(/[,.]/)
        .map(s => s.trim())
        .filter(s => ['spring', 'summer', 'fall', 'winter'].includes(s));

      // Get water types with more inclusive prompt
      const waterTypesPrompt = `What types of water can the ${formData.name} fly be effectively used in? Consider that most flies can be adapted for different water types. List ALL potentially suitable water types (river, stream, lake, pond, saltwater), separated by commas.`;
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
        .filter(s => ['dry_fly', 'wet_fly', 'nymph', 'streamer', 'emerger', 'terrestrial', 'buzzer'].includes(s.replace(/\s+/g, '_')));

      // Get weather conditions
      const weatherPrompt = `What weather conditions is the ${formData.name} fly best fished in? List ALL suitable conditions (sunny, cloudy, overcast, rain, storm), separated by commas.`;
      const weatherResponse = await queryOpenAI(weatherPrompt);
      const weatherConditions = weatherResponse
        .toLowerCase()
        .split(/[,.]/)
        .map(s => s.trim())
        .filter(s => ['sunny', 'cloudy', 'overcast', 'rain', 'storm'].includes(s));

      // Get seasonal pattern
      const seasonalPrompt = `For the ${formData.name} fly, when is the prime fishing season? Respond in this exact format: "Start: [month number 1-12], End: [month number 1-12], Min Temp: [celsius], Max Temp: [celsius]"`;
      const seasonalResponse = await queryOpenAI(seasonalPrompt);
      
      // Parse seasonal response
      const startMatch = seasonalResponse.match(/Start:\s*(\d{1,2})/);
      const endMatch = seasonalResponse.match(/End:\s*(\d{1,2})/);
      const minTempMatch = seasonalResponse.match(/Min Temp:\s*(-?\d+)/);
      const maxTempMatch = seasonalResponse.match(/Max Temp:\s*(-?\d+)/);

      setFormData(prev => ({
        ...prev,
        description: descriptionResponse,
        target_species: targetSpecies,
        season: seasons,
        water_type: waterType,
        categories: categories,
        weather_conditions: weatherConditions,
        season_start: startMatch ? startMatch[1].padStart(2, '0') : '03',
        season_end: endMatch ? endMatch[1].padStart(2, '0') : '05',
        temp_min: minTempMatch ? parseInt(minTempMatch[1]) : 7,
        temp_max: maxTempMatch ? parseInt(maxTempMatch[1]) : 18
      }));

      setMessage('AI content generated successfully!');
    } catch (error: any) {
      setMessage(`Error generating content: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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

        {/* Seasonal Pattern */}
        <section className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold mb-4">Seasonal Pattern</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Season Start Month</label>
              <select
                className="w-full p-2 border rounded"
                value={formData.season_start}
                onChange={(e) => setFormData({ ...formData, season_start: e.target.value })}
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
                value={formData.season_end}
                onChange={(e) => setFormData({ ...formData, season_end: e.target.value })}
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
              <label className="block text-sm font-medium mb-1">Min Temperature (°C)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={formData.temp_min}
                onChange={(e) => setFormData({ ...formData, temp_min: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Temperature (°C)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={formData.temp_max}
                onChange={(e) => setFormData({ ...formData, temp_max: parseInt(e.target.value) })}
              />
            </div>
          </div>
          
          <SeasonalEffectivenessPreview
            seasonStart={formData.season_start}
            seasonEnd={formData.season_end}
            tempMin={formData.temp_min}
            tempMax={formData.temp_max}
          />
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

function SeasonalEffectivenessPreview({ 
  seasonStart, 
  seasonEnd, 
  tempMin, 
  tempMax 
}: { 
  seasonStart: string, 
  seasonEnd: string, 
  tempMin: number, 
  tempMax: number 
}) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const startMonth = parseInt(seasonStart) - 1;
  const endMonth = parseInt(seasonEnd) - 1;

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-sm font-medium mb-2">Seasonal Effectiveness</h3>
      <div className="grid grid-cols-12 gap-1">
        {months.map((month, i) => {
          const isActive = (startMonth <= endMonth)
            ? (i >= startMonth && i <= endMonth)
            : (i >= startMonth || i <= endMonth);
          
          return (
            <div
              key={month}
              className={`text-center p-1 text-xs rounded ${
                isActive ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}
            >
              {month}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-sm text-gray-600">
        Optimal water temperature: {tempMin}°C to {tempMax}°C
      </div>
    </div>
  );
} 