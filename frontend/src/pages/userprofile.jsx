"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Cookies from "js-cookie"
import PropTypes from "prop-types"
import { Mail, Phone, Calendar, DollarSign, Clock, ArrowLeft, Camera, Edit, Trash2, AlertTriangle, CreditCard } from "lucide-react"
import { PageLayout, Header, Section, Footer } from "../components/layout/PageLayout"
import ProfilePhotoModal from "../components/ProfilePhotoModal"
import { SecurityUtils } from "../utils/Security"
// Info Item Component with updated styling
const InfoItem = ({ icon, text, label }) => (
  <div className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-zinc-800 group">
    <div className="flex items-center">
      <span className="mr-4 transition-transform group-hover:scale-110 text-purple-400">{icon}</span>
      <span className="text-gray-400 mr-2">{label}:</span>
    </div>
    <span className="text-gray-200 font-medium">{text}</span>
  </div>
)

// Add prop validation
InfoItem.propTypes = {
  icon: PropTypes.node.isRequired,
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired
}

const UserProfile = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const navigate = useNavigate()


  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const id_token = Cookies.get("idToken")
        if (!id_token) {
          navigate("/login")
          return
        }
  
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user-profile/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id_token }),
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch user profile")
        }
        
        const data = await response.json()
        setUser(data.user_data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching profile:", error)
        setError("Failed to load user profile. Please try again later.")
        setLoading(false)
      }
    }
  
    fetchUserProfile()
  }, [navigate])

  const handleDeleteProfile = async () => {
    if (deleteConfirmation !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }
    
    setIsDeleting(true);
    try {
      const id_token = Cookies.get('idToken');
      const access_token = Cookies.get('accessToken'); // Get the access token - important!
      
      if (!access_token) {
        setError('Access token not found. Please login again.');
        setIsDeleting(false);
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delete-profile/`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: access_token, // The API expects access_token instead of id_token
          confirmation: "DELETE" // The API also expects a confirmation field
        })
      });

      if (response.ok) {
        // Clear all auth cookies
        Cookies.remove('idToken');
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        navigate('/login');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete profile');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      setError('Failed to delete profile');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handlePhotoUpdate = (newPhotoUrl) => {
    setUser(prev => ({
      ...prev,
      profile_photo: newPhotoUrl
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center text-white p-4">
        <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full rounded-lg">
          <div className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error Loading Profile</h2>
            <p className="text-gray-400 mb-4">{error || "No user data available."}</p>
            <button 
              onClick={() => navigate("/dashboard")} 
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-white"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
         onClick={(e) => e.stopPropagation()}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-sm w-full mx-4 text-white">
        <div className="flex items-center justify-center mb-4 text-red-400">
          <AlertTriangle size={48} />
        </div>
        <h3 className="text-xl font-bold text-center mb-4">Delete Profile?</h3>
        <p className="text-gray-400 text-center mb-6">
          This action cannot be undone. All your data will be permanently deleted.
        </p>
        
        <div className="mb-6">
          <label className="block text-gray-400 text-sm mb-2">
            Type <span className="font-bold">DELETE</span> to confirm:
          </label>
          <input
            type="text"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            placeholder="DELETE"
          />
          {error && error.includes("DELETE") && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
          )}
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteConfirmation("");
              setError(null);
            }}
            className="flex-1 py-2 px-4 rounded-lg border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteProfile}
            disabled={isDeleting || deleteConfirmation !== "DELETE"}
            className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout>

      <Section 
      className="py-8 relative overflow-hidden h-screen"
      style={{
          background: "linear-gradient(to bottom, #0c0613 0%, #1a0b2e 50%, #130a1f 100%)"
        }}
      >
        {/* Static background effects - no animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Static gradient overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-tr from-purple-900/0 via-purple-800/10 to-purple-600/0 blur-3xl opacity-70"
          ></div>
          
          {/* Static positioned orbs for depth */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-900/30 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl -z-10"></div>
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl -z-10"></div>
        </div>
        
        <div className="relative z-10 max-w-md mx-auto">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white flex items-center mb-8"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>

          {/* Profile section with hover effects - simplified to work with gradient background */}
          <div className="flex flex-col items-center mb-8 group">
            <div className="relative p-8 rounded-xl bg-black/20 backdrop-blur-sm border border-purple-500/10 w-full flex flex-col items-center shadow-xl">
              <div className="relative">
                <div
                  className="w-36 h-36 rounded-full overflow-hidden border-4 border-purple-600 mb-4 shadow-xl 
                           transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                  onClick={() => setIsPhotoModalOpen(true)}
                >
                  <img
                    src={user.profile_photo || "/placeholder.svg?height=150&width=150"}
                    alt={user.full_name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div 
                  className="absolute bottom-6 right-0 bg-purple-600 p-2 rounded-full shadow-lg 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                  onClick={() => setIsPhotoModalOpen(true)}
                >
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2 text-white">{user.full_name}</h1>
              <p className="text-xl text-purple-400">@{user.username}</p>
            </div>
          </div>

          {/* Rest of the content stays the same */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md shadow-xl 
                        transition-all duration-300 hover:shadow-purple-900/30">
            <div className="grid gap-2">
              <InfoItem 
                icon={<Mail size={20} />} 
                text={user.email}
                label="Email"
              />
              <InfoItem 
                icon={<Phone size={20} />} 
                text={user.phone_number || "Not provided"}
                label="Phone"
              />
              <InfoItem
                icon={<DollarSign size={20} />}
                text={user.currency}
                label="Preferred Currency"
              />
              <InfoItem
                icon={<Calendar size={20} />}
                text={new Date(user.created_at).toLocaleDateString()}
                label="Joined"
              />
              <InfoItem
                icon={<Clock size={20} />}
                text={new Date(user.updated_at).toLocaleDateString()}
                label="Last Updated"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-md mt-6 flex gap-4">
            <button 
              onClick={() => navigate('/profile/edit')}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg transition-colors shadow-lg"
            >
              <Edit className="w-5 h-5" />
              Edit Profile
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg transition-colors shadow-lg"
            >
              <Trash2 className="w-5 h-5" />
              Delete Profile
            </button>
          </div>
        </div>
      </Section>
      
      
      {showDeleteModal && <DeleteConfirmationModal />}
      <ProfilePhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentPhoto={user.profile_photo}
        onPhotoUpdate={handlePhotoUpdate}
      />
    </PageLayout>
  )
}

export default UserProfile