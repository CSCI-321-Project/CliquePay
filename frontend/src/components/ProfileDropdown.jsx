import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser } from '@fortawesome/free-regular-svg-icons';
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

        const response = await fetch('/api/user-profile/', {
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

  return (
    <div className="relative">
      {profileData?.profile_photo ? (
        <img 
          src={profileData.profile_photo}
          alt="Profile" 
          className="w-16 h-16 rounded-full cursor-pointer hover:opacity-90 transition object-cover"
          onClick={() => setIsOpen(!isOpen)}
        />
      ) : (
        <FontAwesomeIcon 
          icon={faCircleUser} 
          className="text-green-600 cursor-pointer hover:text-green-700 transition"
          size="4x"
          onClick={() => setIsOpen(!isOpen)}
        />
      )}
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl py-2 z-10 divide-y divide-gray-200">
          <div 
            className="px-4 py-2 hover:bg-green-50 cursor-pointer flex items-center text-gray-800 hover:text-green-600"
            onClick={() => navigate('/profile')}
          >
            Profile Settings
          </div>
          <div 
            className="px-4 py-2 hover:bg-green-50 cursor-pointer flex items-center text-gray-800 hover:text-green-600"
            onClick={() => navigate('/account')}
          >
            Account Settings
          </div>
          <div 
            className="px-4 py-2 hover:bg-red-50 cursor-pointer flex items-center text-gray-800 hover:text-red-600"
            onClick={handleLogout}
          >
            Logout
          </div>
        </div>
      )}
    </div>
  );
};

ProfileDropdown.propTypes = {
  onLogout: PropTypes.func.isRequired
};