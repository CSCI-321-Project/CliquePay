import { useState, useRef } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import Cookies from 'js-cookie';

const ProfilePhotoModal = ({ isOpen, onClose, currentPhoto, onPhotoUpdate }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input
    }
    onClose();
  };

  const uploadPhoto = async () => {
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('profile_picture', selectedFile);
    formData.append('id_token', Cookies.get('idToken'));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/update-profile-photo/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        onPhotoUpdate(data.avatar_url);
        handleClose();
      } else {
        setError(data.message || 'Failed to upload photo');
      }
    } catch (error) {
      setError('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const resetPhoto = async () => {
    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reset-profile-photo/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: Cookies.get('idToken')
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        onPhotoUpdate(data.avatar_url);
        handleClose();
      } else {
        setError(data.message || 'Failed to reset photo');
      }
    } catch (error) {
      setError('Failed to reset photo');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Update Profile Photo</h3>
          <button 
            onClick={handleClose} 
            className="text-zinc-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <img
              src={previewUrl || currentPhoto || "/placeholder.svg?height=150&width=150"}
              alt="Profile preview"
              className="w-32 h-32 rounded-full object-cover border-4 border-purple-600"
            />
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col items-center p-4 border-2 border-dashed border-purple-600 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors">
              <Upload className="w-8 h-8 text-purple-500 mb-2" />
              <span className="text-sm text-zinc-300">Click to upload new photo</span>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </label>

            {currentPhoto && (
              <button
                onClick={resetPhoto}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 py-2 px-4 border border-red-700 text-red-500 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <Trash2 size={20} />
                Delete
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-4 rounded-lg border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          {selectedFile && (
            <button
              onClick={uploadPhoto}
              disabled={isUploading}
              className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoModal;