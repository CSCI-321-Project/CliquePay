// EditProfile.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Save } from 'lucide-react'
import Cookies from 'js-cookie'
const EditProfile = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    currency: '',
    profile_photo: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const id_token = Cookies.get("idToken")

        const response = await fetch('/api/user-profile/', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id_token }),
        })
        const data = await response.json()
        setFormData(data.user_data)
      } catch (error) {
        setError('Failed to load user data')
      }
    }
    fetchUserData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/update-user-profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_token: Cookies.get('idToken'),
          ...formData
        })
      })
      if (response.ok) {
        navigate('/profile')
      } else {
        setError('Failed to update profile')
      }
    } catch (error) {
      setError('Failed to update profile')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-yellow-500 p-8">
      <div className="max-w-md mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="text-green-700 hover:text-green-800 flex items-center mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Back
        </button>

        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-lg p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Profile</h2>
          
          {error && <div className="mb-4 text-red-600">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 flex justify-center gap-3">Email <Lock/></label>
              <input
                disabled
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-2 border border-gray-300 bg-gray-300 rounded focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 flex justify-center gap-3">Phone Number <Lock/></label>
              <input
                disabled
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                className="w-full p-2 border border-gray-300 bg-gray-300 rounded focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Preferred Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 
                       transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save 
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProfile