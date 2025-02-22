import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload } from 'lucide-react';
import { FlyImageSearch } from './FlyImageSearch';
import { AddFlyData } from './AddFlyData';
import { BulkFlyImport } from './BulkFlyImport';
import { ManageFlyDetails } from './ManageFlyDetails';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'flies' | 'add' | 'bulk' | 'details'>('flies'); // 'flies' or 'add' or 'bulk' or 'details'
  const [flyName, setFlyName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      // Log file details
      console.log('File to upload:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // 1. Validate file type and size
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size must be less than 5MB');
      }

      // 2. Create clean filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const fileName = `${Date.now()}.${fileExt}`;
      console.log('Generated filename:', fileName);

      // 3. Upload to Supabase with detailed error handling
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fly-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      // Log upload attempt
      console.log('Upload attempt:', {
        success: !uploadError,
        error: uploadError,
        data: uploadData
      });

      if (uploadError) {
        console.error('Upload error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          name: uploadError.name,
          error: uploadError
        });
        throw uploadError;
      }

      // 4. Verify file was uploaded
      const { data: checkData, error: checkError } = await supabase.storage
        .from('fly-images')
        .list('', {
          limit: 1,
          offset: 0,
          search: fileName
        });

      console.log('Storage check:', {
        fileFound: checkData?.length > 0,
        error: checkError
      });

      if (checkError || !checkData?.length) {
        throw new Error('Failed to verify file upload');
      }

      // 5. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('fly-images')
        .getPublicUrl(fileName);

      console.log('Generated public URL:', publicUrl);

      // 6. Save to database
      const { data: existingFly } = await supabase
        .from('flies')
        .select('*')
        .eq('name', flyName)
        .single();

      if (existingFly) {
        const { error: updateError } = await supabase
          .from('flies')
          .update({ image_url: publicUrl })
          .eq('name', flyName);

        if (updateError) throw updateError;
        setMessage('Fly image updated successfully!');
      } else {
        const { error: insertError } = await supabase
          .from('flies')
          .insert([{
            name: flyName,
            image_url: publicUrl,
            created_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
        setMessage('New fly added successfully!');
      }

      // Reset form
      setFlyName('');
      setFile(null);
      setPreviewUrl(null);
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }

    } catch (err: any) {
      console.error('Full error object:', err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Update the image display component to handle the correct URL format
  const ImageDisplay = ({ url, alt }: { url: string; alt: string }) => {
    return (
      <img
        src={url}
        alt={alt}
        className="w-16 h-16 object-cover rounded"
        loading="lazy"
        onError={(e) => {
          console.error('Image load error:', url);
          e.currentTarget.src = '/placeholder-fly.png'; // Add a placeholder image
        }}
      />
    );
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
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-2 rounded ${
                activeTab === 'bulk' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Bulk Import
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 rounded ${
                activeTab === 'details' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Manage Fly Details
            </button>
          </div>
          <button onClick={handleLogout} className="text-blue-600 hover:text-blue-800">
            Logout
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'flies' ? (
            <FlyImageSearch />
          ) : activeTab === 'add' ? (
            <AddFlyData />
          ) : activeTab === 'bulk' ? (
            <BulkFlyImport />
          ) : (
            <ManageFlyDetails />
          )}
        </div>
      </div>
    </div>
  );
}