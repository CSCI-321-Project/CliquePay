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
      const response = await fetch('/api/update-profile-photo/', {
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
      const response = await fetch('/api/reset-profile-photo/', {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Update Profile Photo</h3>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <img
              src={previewUrl || currentPhoto || "/placeholder.svg?height=150&width=150"}
              alt="Profile preview"
              className="w-32 h-32 rounded-full object-cover border-4 border-green-600"
            />
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col items-center p-4 border-2 border-dashed border-green-600 rounded-lg cursor-pointer hover:bg-green-50">
              <Upload className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm text-gray-600">Click to upload new photo</span>
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
                className="flex items-center justify-center gap-2 py-2 px-4 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={20} />
                Delete
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          {selectedFile && (
            <button
              onClick={uploadPhoto}
              disabled={isUploading}
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
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