"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Bell, CreditCard, DollarSign, Home, LogOut, Settings, User, Users, Wallet, BarChart3 } from "lucide-react"
import PropTypes from "prop-types"
import { renewTokens } from '../utils/RenewTokens';
// import { useSecurity } from '../context/SecurityContext';
import Cookies from 'js-cookie';

// Import UI components
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"

// Import layout components
import { PageLayout, Section, Header, Footer } from "../components/layout/PageLayout"

// Create a simple Logo component if it doesn't exist
const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="bg-purple-600 w-8 h-8 rounded-md flex items-center justify-center">
      <CreditCard className="w-5 h-5" />
    </div>
    <span className="font-bold text-xl">CliquePay</span>
  </div>
)

// Mock data and component definitions remain unchanged
const MOCK_BILL_SUMMARY = {
  totalBill: 1250.5,
  youOwe: 485.75,
  theyOwe: 764.75,
}

const MOCK_RECENT_ACTIVITY = [
  {
    id: 1,
    description: "Dinner at Olive Garden with Alice",
    amount: 84.5,
    date: "2024-02-20",
  },
  {
    id: 2,
    description: "Movie tickets with Bob",
    amount: 32.0,
    date: "2024-02-19",
  },
  {
    id: 3,
    description: "Grocery shopping with Charlie",
    amount: 156.25,
    date: "2024-02-18",
  },
  {
    id: 4,
    description: "Utilities split with Dana",
    amount: 213.0,
    date: "2024-02-17",
  },
]

const MOCK_FRIENDS = [
  {
    name: "Alice Johnson",
    imgSrc: "/placeholder.svg?height=100&width=100",
    owes: 125.5,
    isOwed: false,
  },
  {
    name: "Bob Smith",
    imgSrc: "/placeholder.svg?height=100&width=100",
    owes: 0,
    isOwed: true,
    amount: 45.75,
  },
  {
    name: "Charlie Brown",
    imgSrc: "/placeholder.svg?height=100&width=100",
    owes: 89.25,
    isOwed: false,
  },
  {
    name: "Dana White",
    imgSrc: "/placeholder.svg?height=100&width=100",
    owes: 0,
    isOwed: true,
    amount: 178.5,
  },
]

// Friend Card Component remains unchanged
function FriendCard({ name, imgSrc, owes, isOwed, amount }) {
  return (
    <Card className="bg-zinc-800 border-zinc-700 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col items-center p-4">
          <Avatar className="h-16 w-16 mb-2">
            <AvatarImage src={imgSrc} alt={name} />
            <AvatarFallback className="bg-purple-900/50 text-white">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-medium text-white">{name}</h3>

          {isOwed ? (
            <div className="mt-2 text-green-400 font-medium">Owes you ${amount.toFixed(2)}</div>
          ) : (
            <div className="mt-2 text-red-400 font-medium">You owe ${owes.toFixed(2)}</div>
          )}

          <div className="mt-3 flex gap-2 w-full">
            <Button variant="outline" size="sm" className="flex-1 border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
              Remind
            </Button>
            <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
              Pay
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

FriendCard.propTypes = {
  name: PropTypes.string.isRequired,
  imgSrc: PropTypes.string.isRequired,
  owes: PropTypes.number,
  isOwed: PropTypes.bool,
  amount: PropTypes.number
}

// ProfileDropdown Component remains unchanged
function ProfileDropdown() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setshowLogoutModal] = useState(false);
  const [error, setError] = useState(null);

  // Add this handler function for profile navigation
  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleLogout = async() => {
    setIsLoggingOut(true);
    try {
      const checkTokens = await renewTokens();
      
      if(!checkTokens) {
        navigate('/login');
        return;
      }
      
      const accessToken = Cookies.get("accessToken");
      const response = await fetch('http://127.0.0.1:8000/api/logout/', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token: accessToken })
      });

      if(!response.ok) {
        throw new Error("Failed to logout");
      }

      // Clear cookies and navigate
      Cookies.remove('accessToken');
      Cookies.remove('idToken');
      Cookies.remove('refreshToken');
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
      setError("Failed to logout. Please try again later.");
    } finally {
      setIsLoggingOut(false);
      setshowLogoutModal(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
            <AvatarFallback className="bg-purple-900/50 text-white">JD</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-zinc-800 border-zinc-700 text-white" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-700" />
        <DropdownMenuItem 
          className="hover:bg-zinc-700 cursor-pointer"
          onClick={handleProfileClick}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-zinc-700 cursor-pointer">
          <Wallet className="mr-2 h-4 w-4" />
          <span>Billing</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-zinc-700 cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-700" />
        <DropdownMenuItem 
          className="hover:bg-zinc-700 cursor-pointer text-red-400"
          onClick={() => setshowLogoutModal(true)}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Log Out</h3>
            <p className="text-gray-400 mb-6">Are you sure you want to log out?</p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setshowLogoutModal(false)}
                className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                disabled={isLoggingOut}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging out..." : "Log out"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DropdownMenu>
  )
}

ProfileDropdown.propTypes = {
  // Add any props if needed
}

export default function Dashboard() {
  const [billSummary, setBillSummary] = useState({
    totalBill: 0,
    youOwe: 0,
    theyOwe: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [friends, setFriends] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Use mock data instead of API call
      setBillSummary(MOCK_BILL_SUMMARY)
      setRecentActivity(MOCK_RECENT_ACTIVITY)
      setFriends(MOCK_FRIENDS)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    }
  }

  const handleSettleUp = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      // Refresh dashboard data after settling up
      fetchDashboardData()
    } catch (error) {
      console.error("Failed to settle up:", error)
    }
  }

  const handleRemind = async (activityId) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      console.log(`Reminder sent for activity ${activityId}`)
      // Could show a success message here
    } catch (error) {
      console.error("Failed to send reminder:", error)
    }
  }

  return (
    <PageLayout>
      {/* Header */}
      <Header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm py-4">
        <Logo />
        <div className="flex items-center gap-4">
          <Button variant="outline" className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Notifications</span>
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <DollarSign className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Payment</span>
          </Button>
          <ProfileDropdown />
        </div>
      </Header>

      {/* Main Content */}
      <Section className="py-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid grid-cols-4 mb-8 bg-zinc-800 border border-zinc-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Home className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Bill Summary Section */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Bill Summary</h2>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <p className="text-gray-400 mb-1">Total Bill</p>
                      <p className="text-3xl font-bold text-white">${billSummary.totalBill.toFixed(2)}</p>
                    </div>
                    <Button onClick={handleSettleUp} className="bg-purple-600 hover:bg-purple-700">
                      Settle Up
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-zinc-800 border-zinc-700">
                      <CardContent className="p-4">
                        <p className="text-gray-400 text-sm">You Owe</p>
                        <p className="text-2xl font-bold text-red-400">${billSummary.youOwe.toFixed(2)}</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-800 border-zinc-700">
                      <CardContent className="p-4">
                        <p className="text-gray-400 text-sm">They Owe You</p>
                        <p className="text-2xl font-bold text-green-400">${billSummary.theyOwe.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Recent Activity</h2>
                <Link to="/transactions" className="text-purple-400 hover:text-purple-300 text-sm">
                  View All
                </Link>
              </div>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-0">
                  <ul className="divide-y divide-zinc-800">
                    {recentActivity.map((activity) => (
                      <li key={activity.id} className="p-4 flex justify-between items-start">
                        <div className="flex flex-col items-start">
                          <p className="font-medium text-white">{activity.description}</p>
                          <p className="text-sm text-gray-400">{activity.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-red-400">-${activity.amount.toFixed(2)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemind(activity.id)}
                            className="text-purple-400 hover:text-purple-300 hover:bg-zinc-800"
                          >
                            Remind
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Friends Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Your Friends</h2>
                <Button variant="link" className="text-purple-400 hover:text-purple-300 p-0">
                  <Users className="h-4 w-4 mr-2" />
                  Add Friend
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {friends.map((friend) => (
                  <FriendCard
                    key={friend.name}
                    name={friend.name}
                    imgSrc={friend.imgSrc}
                    owes={friend.owes}
                    isOwed={friend.isOwed}
                    amount={friend.amount || 0}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription className="text-gray-400">View and manage all your transactions here.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Your transaction history will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription className="text-gray-400">Track your spending patterns and insights.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Your spending analytics will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your account preferences and settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Your account settings will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Section>

      {/* Footer */}
      <Footer className="border-t border-zinc-800 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} CliquePay. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </Footer>
    </PageLayout>
  )
}

