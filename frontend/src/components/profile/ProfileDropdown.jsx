import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle } from 'lucide-react'; // Changed to Lucide version for consistency
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';

export const ProfileDropdown = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const idToken = Cookies.get('idToken');
        if (!idToken) {
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user-profile/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id_token: idToken }),
        });

        if (response.ok) {
          const data = await response.json();
          setProfileData(data.user_data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfileData();
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsOpen(false);
    };
    
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative z-50"> {/* Increased z-index to 50 */}
      <div onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}>
        {profileData?.profile_photo ? (
          <img 
            src={profileData.profile_photo}
            alt="Profile" 
            className="w-10 h-10 rounded-full cursor-pointer hover:opacity-90 transition object-cover border-2 border-purple-600"
          />
        ) : (
          <UserCircle 
            className="w-10 h-10 text-purple-600 cursor-pointer hover:text-purple-500 transition"
          />
        )}
      </div>
      
      {isOpen && (
        <div className="fixed inset-0 z-[150]" onClick={() => setIsOpen(false)}>
          <div 
            className="absolute right-0 top-16 mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-2 z-[200] divide-y divide-zinc-800"
            onClick={e => e.stopPropagation()}
          >
            <div 
              className="px-4 py-3 hover:bg-zinc-800 cursor-pointer flex items-center text-white"
              onClick={() => navigate('/profile')}
            >
              Profile Settings
            </div>
            <div 
              className="px-4 py-3 hover:bg-zinc-800 cursor-pointer flex items-center text-white"
              onClick={() => navigate('/account')}
            >
              Account Settings
            </div>
            <div 
              className="px-4 py-3 hover:bg-red-900/40 cursor-pointer flex items-center text-red-400"
              onClick={() => handleLogout()}
            >
              Logout
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ProfileDropdown.propTypes = {
  onLogout: PropTypes.func.isRequired
};