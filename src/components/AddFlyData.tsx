import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Loader, Wand2 } from 'lucide-react';
import { queryOpenAI } from '../lib/openai';

interface Pattern {
  month: string;
  time_of_day: string;
  water_temperature: string;
  water_level: string;
  water_clarity: string;
  weather_condition: string;
}

interface FlyForm {
  name: string;
  description: string;
  image_url: string;
  categories: string[];
  seasons: string[];
  water_types: string[];
  target_species: string[];
  weather_conditions: string[];
  patterns: Pattern[];
}

const INITIAL_PATTERN: Pattern = {
  month: '',
  time_of_day: '',
  water_temperature: '',
  water_level: '',
  water_clarity: '',
  weather_condition: ''
};

const INITIAL_FORM_STATE: FlyForm = {
  name: '',
  description: '',
  image_url: '',
  categories: [],
  seasons: [],
  water_types: [],
  target_species: [],
  weather_conditions: [],
  patterns: [{ ...INITIAL_PATTERN }]
};

export function AddFlyData() {
  const [formData, setFormData] = useState<FlyForm>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Insert into flies table
      const { data: flyData, error: flyError } = await supabase
        .from('flies')
        .insert([{
          name: formData.name,
          description: formData.description,
          image_url: formData.image_url,
          categories: formData.categories,
          seasons: formData.seasons,
          water_types: formData.water_types,
          target_species: formData.target_species,
          weather_conditions: formData.weather_conditions
        }])
        .select()
        .single();

      if (flyError) throw flyError;

      // Insert patterns
      const patternsToInsert = formData.patterns.map(pattern => ({
        fly_name: formData.name,
        ...pattern
      }));

      const { error: patternError } = await supabase
        .from('seasonal_fly_patterns')
        .insert(patternsToInsert);

      if (patternError) throw patternError;

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

      // Get target species
      const speciesPrompt = `What species of fish does the ${formData.name} fly pattern typically target? Please list only the main species.`;
      const speciesResponse = await queryOpenAI(speciesPrompt);
      const targetSpecies = speciesResponse
        .toLowerCase()
        .split(/[,.]/)
        .map(s => s.trim())
        .filter(s => s)
        .map(s => s.replace(/\s+/g, '_'));

      // Get seasons
      const seasonsPrompt = `What time of year is the ${formData.name} fly best used? Please list only the seasons: spring, summer, fall, or winter.`;
      const seasonsResponse = await queryOpenAI(seasonsPrompt);
      const seasons = seasonsResponse
        .toLowerCase()
        .split(/[,.]/)
        .map(s => s.trim())
        .filter(s => ['spring', 'summer', 'fall', 'winter'].includes(s));

      // Get categories
      const categoriesPrompt = `Which single category best describes the ${formData.name}: dry_fly, nymph, streamer, emerger, or terrestrial?`;
      const categoryResponse = await queryOpenAI(categoriesPrompt);
      const category = categoryResponse
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_');

      // Update form data
      setFormData(prev => ({
        ...prev,
        description,
        target_species: targetSpecies,
        seasons,
        categories: [category]
      }));

      setMessage('AI analysis complete!');
    } catch (error: any) {
      setMessage(`AI Error: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
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
                className="w-full p-2 border rounded"
                value={formData.categories}
                onChange={(e) => setFormData({
                  ...formData,
                  categories: Array.from(e.target.selectedOptions, option => option.value)
                })}
              >
                <option value="dry_fly">Dry Fly</option>
                <option value="nymph">Nymph</option>
                <option value="streamer">Streamer</option>
                <option value="emerger">Emerger</option>
                <option value="terrestrial">Terrestrial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Seasons</label>
              <select
                multiple
                className="w-full p-2 border rounded"
                value={formData.seasons}
                onChange={(e) => setFormData({
                  ...formData,
                  seasons: Array.from(e.target.selectedOptions, option => option.value)
                })}
              >
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
                <option value="winter">Winter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Water Types</label>
              <select
                multiple
                className="w-full p-2 border rounded"
                value={formData.water_types}
                onChange={(e) => setFormData({
                  ...formData,
                  water_types: Array.from(e.target.selectedOptions, option => option.value)
                })}
              >
                <option value="river">River</option>
                <option value="stream">Stream</option>
                <option value="lake">Lake</option>
                <option value="pond">Pond</option>
                <option value="saltwater">Saltwater</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Target Species</label>
              <select
                multiple
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
          <h3 className="text-lg font-semibold mb-4">Seasonal Patterns</h3>
          
          {formData.patterns.map((pattern, index) => (
            <div key={index} className="mb-4 p-4 border rounded relative">
              <button
                type="button"
                onClick={() => removePattern(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Month</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={pattern.month}
                    onChange={(e) => {
                      const newPatterns = [...formData.patterns];
                      newPatterns[index].month = e.target.value;
                      setFormData({ ...formData, patterns: newPatterns });
                    }}
                  >
                    <option value="">Select Month</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Time of Day</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={pattern.time_of_day}
                    onChange={(e) => {
                      const newPatterns = [...formData.patterns];
                      newPatterns[index].time_of_day = e.target.value;
                      setFormData({ ...formData, patterns: newPatterns });
                    }}
                  >
                    <option value="">Select Time</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Water Temperature</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={pattern.water_temperature}
                    onChange={(e) => {
                      const newPatterns = [...formData.patterns];
                      newPatterns[index].water_temperature = e.target.value;
                      setFormData({ ...formData, patterns: newPatterns });
                    }}
                  >
                    <option value="">Select Temperature</option>
                    <option value="cold">Cold (Below 50°F)</option>
                    <option value="cool">Cool (50-60°F)</option>
                    <option value="moderate">Moderate (60-70°F)</option>
                    <option value="warm">Warm (Above 70°F)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Water Level</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={pattern.water_level}
                    onChange={(e) => {
                      const newPatterns = [...formData.patterns];
                      newPatterns[index].water_level = e.target.value;
                      setFormData({ ...formData, patterns: newPatterns });
                    }}
                  >
                    <option value="">Select Level</option>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="flood">Flood</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Water Clarity</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={pattern.water_clarity}
                    onChange={(e) => {
                      const newPatterns = [...formData.patterns];
                      newPatterns[index].water_clarity = e.target.value;
                      setFormData({ ...formData, patterns: newPatterns });
                    }}
                  >
                    <option value="">Select Clarity</option>
                    <option value="clear">Clear</option>
                    <option value="stained">Stained</option>
                    <option value="murky">Murky</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Weather Condition</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={pattern.weather_condition}
                    onChange={(e) => {
                      const newPatterns = [...formData.patterns];
                      newPatterns[index].weather_condition = e.target.value;
                      setFormData({ ...formData, patterns: newPatterns });
                    }}
                  >
                    <option value="">Select Weather</option>
                    <option value="sunny">Sunny</option>
                    <option value="cloudy">Cloudy</option>
                    <option value="overcast">Overcast</option>
                    <option value="rain">Rain</option>
                    <option value="storm">Storm</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addPattern}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Add Pattern
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