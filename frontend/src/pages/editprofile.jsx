"use client"

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Save, CreditCard } from 'lucide-react'
import Cookies from 'js-cookie'
import { PageLayout, Header, Section } from "../components/layout/PageLayout"
import AuthenticateUser from '../utils/AuthenticateUser'

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

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user-profile/`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/update-user-profile/`, {
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
    <PageLayout>
      <AuthenticateUser>
      {/* Header */}
      <Header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm py-4">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 w-8 h-8 rounded-md flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl">CliquePay</span>
        </div>
      </Header>

      <Section 
        className="py-8 relative overflow-hidden"
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
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white flex items-center mb-8"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>

          <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-900/20 border border-red-800 text-red-400 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full p-2 rounded-md bg-zinc-800/80 border border-zinc-700 text-white 
                             focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    Email <Lock className="w-4 h-4 ml-2 text-gray-500" />
                  </label>
                  <input
                    disabled
                    type="email"
                    value={formData.email}
                    className="w-full p-2 rounded-md bg-zinc-800/50 border border-zinc-700 text-gray-500 
                             focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    Phone Number <Lock className="w-4 h-4 ml-2 text-gray-500" />
                  </label>
                  <input
                    disabled
                    type="tel"
                    value={formData.phone_number}
                    className="w-full p-2 rounded-md bg-zinc-800/50 border border-zinc-700 text-gray-500 
                             focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Preferred Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full p-2 rounded-md bg-zinc-800/80 border border-zinc-700 text-white 
                             focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-md 
                           transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </Section>
      </AuthenticateUser> 
    </PageLayout>
  )
}

export default EditProfile