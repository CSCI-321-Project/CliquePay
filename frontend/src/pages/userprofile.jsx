import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import PropTypes from 'prop-types';
import Cookies from "js-cookie"
import { Mail, Phone, Calendar, DollarSign, Clock, ArrowLeft, Camera, Edit, Trash2, AlertTriangle } from "lucide-react"
import { PageLayout, Header, Container, Section, Footer } from "../components/layout/PageLayout"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Dialog, DialogContent, DialogFooter } from "../components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"

// Mock user data
const MOCK_USER = {
  full_name: "John Doe",
  username: "johndoe",
  email: "john.doe@example.com",
  phone_number: "+1 (555) 123-4567",
  currency: "USD",
  profile_photo: "https://randomuser.me/api/portraits/men/35.jpg",
  created_at: "2023-01-15T12:00:00Z",
  updated_at: "2024-02-20T15:30:00Z",
}

// Profile Photo Modal Component
function ProfilePhotoModal({ isOpen, onClose, currentPhoto, onPhotoUpdate }) {
  const [photoUrl, setPhotoUrl] = useState(currentPhoto || "")
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsUploading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onPhotoUpdate(photoUrl)
    setIsUploading(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Update Profile Photo</h2>
          <p className="text-gray-400">
            Enter a URL for your profile photo or upload an image.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={photoUrl || "/placeholder.svg?height=150&width=150"} alt="Profile" />
              <AvatarFallback className="bg-purple-900/50 text-white text-xl">
                {MOCK_USER.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Photo URL</label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full p-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Or upload a file</label>
            <input
              type="file"
              className="w-full p-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              accept="image/*"
              disabled={isUploading}
            />
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading} className="bg-purple-600 hover:bg-purple-700 text-white">
              {isUploading ? "Uploading..." : "Save Photo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Add PropTypes validation for ProfilePhotoModal
ProfilePhotoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentPhoto: PropTypes.string,
  onPhotoUpdate: PropTypes.func.isRequired
};

// Info Item Component
function InfoItem({ icon, text, label }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-zinc-800 group">
      <div className="flex items-center">
        <span className="mr-4 transition-transform group-hover:scale-110 text-purple-400">{icon}</span>
        <span className="text-gray-400 mr-2">{label}:</span>
      </div>
      <span className="text-gray-200 font-medium">{text}</span>
    </div>
  )
}

// Add PropTypes validation for InfoItem
InfoItem.propTypes = {
  icon: PropTypes.node.isRequired,
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired
};

const UserProfile = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Use mock data
        setUser(MOCK_USER)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching profile:", error)
        setError("Failed to load user profile. Please try again later.")
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  const handleDeleteProfile = async () => {
    setIsDeleting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simulate successful deletion
      navigate("/login")
    } catch (error) {
      setError("Failed to delete profile")
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handlePhotoUpdate = (newPhotoUrl) => {
    setUser((prev) => ({
      ...prev,
      profile_photo: newPhotoUrl,
    }))
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
        </div>
      </PageLayout>
    )
  }

  if (error || !user) {
    return (
      <PageLayout>
        <Container>
          <div className="min-h-screen flex justify-center items-center p-4">
            <Card className="bg-zinc-900 border-zinc-800 max-w-md w-full">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Error Loading Profile</h2>
                <p className="text-gray-400 mb-4">{error || "No user data available."}</p>
                <Button onClick={() => navigate("/dashboard")} className="bg-purple-600 hover:bg-purple-700">
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Header className="py-4">
        <div className="w-full flex justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>
        </div>
      </Header>

      <Section className="py-8">
        <div className="flex flex-col items-center">
          {/* Profile section with hover effects */}
          <div className="flex flex-col items-center mb-8 group">
            <div className="relative">
              <div
                className="w-36 h-36 rounded-full overflow-hidden border-4 border-purple-600 mb-4 shadow-xl 
                         transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                onClick={() => setIsPhotoModalOpen(true)}
              >
                <Avatar className="w-full h-full">
                  <AvatarImage src={user.profile_photo || "/placeholder.svg?height=150&width=150"} alt={user.full_name} className="object-cover" />
                  <AvatarFallback className="bg-purple-900/50 text-white text-4xl">
                    {user.full_name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
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

          {/* Info cards with hover animations */}
          <Card
            className="bg-zinc-900 border-zinc-800 w-full max-w-md shadow-xl 
                      transition-all duration-300 hover:shadow-purple-900/20"
          >
            <CardContent className="p-6">
              <div className="grid gap-2">
                <InfoItem icon={<Mail size={20} />} text={user.email} label="Email" />
                <InfoItem icon={<Phone size={20} />} text={user.phone_number || "Not provided"} label="Phone" />
                <InfoItem icon={<DollarSign size={20} />} text={user.currency} label="Preferred Currency" />
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
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="w-full max-w-md mt-6 flex gap-4">
            <Button
              onClick={() => navigate('/profile/edit')}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Edit className="w-5 h-5" />
              Edit Profile
            </Button>
            <Button
              onClick={() => setShowDeleteModal(true)}
              variant="destructive"
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-5 h-5" />
              Delete Profile
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4 text-red-400">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Delete Profile?</h3>
              <p className="text-gray-400 text-center">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>
            
            <DialogFooter className="flex gap-3 sm:justify-center">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProfile}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Photo Modal */}
        <ProfilePhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          currentPhoto={user.profile_photo}
          onPhotoUpdate={handlePhotoUpdate}
        />
      </Section>

      <Footer />
    </PageLayout>
  )
}

export default UserProfile