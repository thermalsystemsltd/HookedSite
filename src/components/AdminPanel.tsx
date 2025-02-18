import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload } from 'lucide-react';
import { FlyImageSearch } from './FlyImageSearch';
import { AddFlyData } from './AddFlyData';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('flies'); // 'flies' or 'add'
  const [flyName, setFlyName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create a preview URL for the selected image
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select an image');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // 1. Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fly-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('fly-images')
        .getPublicUrl(fileName);

      // 3. Check if a fly with this name exists
      const { data: existingFly } = await supabase
        .from('flies')
        .select('*')
        .eq('name', flyName)
        .single();

      if (existingFly) {
        // Update the existing fly's image URL
        const { error: updateError } = await supabase
          .from('flies')
          .update({ image_url: publicUrl })
          .eq('name', flyName);

        if (updateError) throw updateError;
        setMessage('Fly image updated successfully!');
      } else {
        // Insert new fly
        const { error: insertError } = await supabase
          .from('flies')
          .insert([
            {
              name: flyName,
              image_url: publicUrl,
              created_at: new Date().toISOString(),
            },
          ]);

        if (insertError) throw insertError;
        setMessage('New fly added successfully!');
      }

      setFlyName('');
      setFile(null);
      setPreviewUrl(null);
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-100 rounded-lg w-full max-w-6xl h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('flies')}
              className={`px-4 py-2 rounded ${
                activeTab === 'flies' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Manage Flies
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 rounded ${
                activeTab === 'add' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Add New Fly
            </button>
          </div>
          <button onClick={handleLogout} className="text-blue-600 hover:text-blue-800">
            Logout
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'flies' ? (
            <FlyImageSearch />
          ) : (
            <AddFlyData />
          )}
        </div>
      </div>
    </div>
  );
}