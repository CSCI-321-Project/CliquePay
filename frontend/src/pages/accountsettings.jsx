import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, CreditCard, KeyRound, Lock, Save, User, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { PageLayout, Header, Section, Footer } from "../components/layout/PageLayout";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { SecurityUtils } from '../utils/Security';
import AuthenticateUser from '../utils/AuthenticateUser';

export default function AccountSettings() {
  const navigate = useNavigate();
  const API_URL = `${import.meta.env.VITE_API_URL}/api` || 'http://localhost:8000/api';
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: null
  });
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');

  // Fetch user profile data when component mounts
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = await SecurityUtils.getCookie('idToken');
      
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const response = await fetch(`${API_URL}/user-profile/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_token: token }),
      });
      
      const data = await response.json();
      
      if (data.status === 'SUCCESS') {
        setUser({
          name: data.user_data.full_name || '',
          email: data.user_data.email || '',
          phone: data.user_data.phone_number || '',
          avatar: data.user_data.avatar_url || null
        });
      } else {
        setError(data.message || 'Failed to load user profile');
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    
    try {
      const token = await SecurityUtils.getCookie('idToken');
      
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const response = await fetch(`${API_URL}/update-user-profile/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          id_token: token,
          full_name: user.name,
          phone_number: user.phone
        }),
      });
      
      const data = await response.json();
      
      if (data.status === 'SUCCESS') {
        setSuccess('Profile updated successfully!');
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setChangePasswordError('');
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setChangePasswordError('New passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      const accessToken = await SecurityUtils.getCookie('accessToken');
      
      if (!accessToken) {
        setChangePasswordError('Authentication required');
        return;
      }
      
      const response = await fetch(`${API_URL}/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          access_token: accessToken,
          old_password: passwordData.oldPassword,
          new_password: passwordData.newPassword
        }),
      });
      
      const data = await response.json();
      
      if (data.status === 'SUCCESS') {
        setSuccess('Password changed successfully!');
        // Reset form
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setChangePasswordError(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setChangePasswordError("Failed to change password");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordDataChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setChangePasswordError('');
  };

  return (
    <PageLayout>
      <AuthenticateUser>
        <Header>
          <div className="flex items-center gap-2">
            <div className="bg-purple-600 w-8 h-8 rounded-md flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl">CliquePay</span>
          </div>
          <Button 
            variant="ghost" 
            className="!text-white"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Header>

        <Section className="py-12">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
            
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-200 rounded-md flex gap-2 items-center">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-900/30 border border-green-800 text-green-200 rounded-md">
                {success}
              </div>
            )}
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid grid-cols-4 mb-8">
                <TabsTrigger 
                  value="profile" 
                  className="flex gap-2 items-center data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <User className="w-4 h-4" /> Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="flex gap-2 items-center data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <Lock className="w-4 h-4" /> Security
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="flex gap-2 items-center data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <Bell className="w-4 h-4" /> Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="payment" 
                  className="flex gap-2 items-center data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <CreditCard className="w-4 h-4" /> Payment Methods
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription className="text-gray-400">
                      Update your personal information and how others see you on CliquePay
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                          <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input 
                              id="name" 
                              value={user.name} 
                              onChange={(e) => setUser({...user, name: e.target.value})} 
                              className="bg-zinc-900 border-zinc-700 mt-1"
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              value={user.email} 
                              disabled={true} // Email can't be changed via this form
                              className="bg-zinc-900 border-zinc-700 mt-1 opacity-75"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input 
                              id="phone" 
                              type="tel" 
                              value={user.phone} 
                              onChange={(e) => setUser({...user, phone: e.target.value})}
                              className="bg-zinc-900 border-zinc-700 mt-1"
                              disabled={loading}
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-start">
                          <div className="w-32 h-32 rounded-full bg-zinc-700 flex items-center justify-center mb-4">
                            {user.avatar ? (
                              <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="w-12 h-12 text-zinc-400" />
                            )}
                          </div>
                          <Button variant="outline" className="mb-2" disabled={loading}>Upload Photo</Button>
                          <p className="text-xs text-gray-400">JPG, GIF or PNG. 1MB max.</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" /> Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription className="text-gray-400">
                      Manage your password and account security options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Change Password</h3>
                      
                      {changePasswordError && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm rounded-md flex gap-2 items-center">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <p>{changePasswordError}</p>
                        </div>
                      )}
                      
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                          <Label htmlFor="oldPassword">Current Password</Label>
                          <div className="relative">
                            <Input 
                              id="oldPassword"
                              name="oldPassword"
                              type={showOldPassword ? "text" : "password"}
                              value={passwordData.oldPassword} 
                              onChange={handlePasswordDataChange}
                              className="bg-zinc-900 border-zinc-700 mt-1 pr-10"
                              required
                              disabled={loading}
                            />
                            <button 
                              type="button"
                              onClick={() => setShowOldPassword(!showOldPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                              tabIndex="-1"
                            >
                              {showOldPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <Input 
                              id="newPassword"
                              name="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={passwordData.newPassword} 
                              onChange={handlePasswordDataChange}
                              className="bg-zinc-900 border-zinc-700 mt-1 pr-10"
                              required
                              minLength={8}
                              disabled={loading}
                            />
                            <button 
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                              tabIndex="-1"
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Must be at least 8 characters with a number and special character
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <div className="relative">
                            <Input 
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordData.confirmPassword} 
                              onChange={handlePasswordDataChange}
                              className="bg-zinc-900 border-zinc-700 mt-1 pr-10"
                              required
                              disabled={loading}
                            />
                            <button 
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                              tabIndex="-1"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <Button
                          type="submit"
                          disabled={loading}
                          className="mt-2"
                        >
                          {loading ? (
                            <>
                              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                              Updating...
                            </>
                          ) : (
                            <>
                              <KeyRound className="mr-2 h-4 w-4" /> Change Password
                            </>
                          )}
                        </Button>
                      </form>
                    </div>
                    
                    <div className="pt-6 border-t border-zinc-700">
                      <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-300">Add an extra layer of security to your account</p>
                          <p className="text-xs text-gray-400 mt-1">We&apos;ll ask for a verification code in addition to your password</p>
                        </div>
                        <Switch id="2fa" />
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-zinc-700">
                      <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
                      <div className="space-y-4">
                        <div className="bg-zinc-900 p-4 rounded-md flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">Chrome on Windows</p>
                            <p className="text-xs text-gray-400">Current session • Last active: Just now</p>
                          </div>
                          <div className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded-md">
                            Current
                          </div>
                        </div>
                        <div className="bg-zinc-900 p-4 rounded-md flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">Safari on iPhone</p>
                            <p className="text-xs text-gray-400">Last active: Yesterday at 2:15 PM</p>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30">
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription className="text-gray-400">
                      Control how and when CliquePay contacts you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Payment Notifications</p>
                          <p className="text-sm text-gray-400">Get notified when someone sends you money</p>
                        </div>
                        <Switch id="payment-notifications" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Expense Added</p>
                          <p className="text-sm text-gray-400">Get notified when a new expense is added to a group</p>
                        </div>
                        <Switch id="expense-notifications" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Reminders</p>
                          <p className="text-sm text-gray-400">Get reminded about unsettled payments</p>
                        </div>
                        <Switch id="reminder-notifications" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Marketing Updates</p>
                          <p className="text-sm text-gray-400">Receive news and promotional offers</p>
                        </div>
                        <Switch id="marketing-notifications" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="payment">
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription className="text-gray-400">
                      Add or remove payment methods to your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-zinc-900 p-4 rounded-md flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-8 bg-blue-500 rounded-md flex items-center justify-center text-xs font-bold text-white">
                            VISA
                          </div>
                          <div>
                            <p className="font-medium">•••• •••• •••• 4242</p>
                            <p className="text-xs text-gray-400">Expires 09/25</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded-md">
                            Default
                          </div>
                          <Button variant="ghost" size="sm" className="h-8">
                            Edit
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-zinc-900 p-4 rounded-md flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-8 bg-gray-600 rounded-md flex items-center justify-center text-xs font-bold text-white">
                            MC
                          </div>
                          <div>
                            <p className="font-medium">•••• •••• •••• 8888</p>
                            <p className="text-xs text-gray-400">Expires 05/24</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-red-400 hover:text-red-300 hover:bg-red-950/30">
                            Remove
                          </Button>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="w-full mt-4">
                        <CreditCard className="mr-2 h-4 w-4" /> Add Payment Method
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </Section>

        <Footer className="bg-zinc-950">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <div className="bg-purple-600 w-8 h-8 rounded-md flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl">CliquePay</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                About
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Features
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Support
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </a>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} CliquePay. All rights reserved.</p>
          </div>
        </Footer>
      </AuthenticateUser>
    </PageLayout>
  );
}