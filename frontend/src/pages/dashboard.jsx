import { AlertTriangle, Bell, CreditCard, CircleDollarSign, DollarSign, Home, Users, BarChart3, MessagesSquare, MessageSquareDot, UsersRound } from "lucide-react";
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { renewTokens } from '../utils/RenewTokens';
import Cookies from 'js-cookie';
import { ProfileDropdown } from "../components/profile/ProfileDropdown"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { PageLayout, Section, Header, Footer } from "../components/layout/PageLayout"
import ChatsContainer from "../components/chats/ChatsContainer";
import { getTotalUnreadCount } from "../components/chats/ChatNotifications";
import { SecurityUtils } from "../utils/Security";
import { PaymentModal } from "./newpayment";
import TransactionContent from "./tab_content/transaction";
import DashboardContent from "./tab_content/dashboard";

const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="bg-purple-600 w-8 h-8 rounded-md flex items-center justify-center">
      <CreditCard className="w-5 h-5" />
    </div>
    <span className="font-bold text-xl">CliquePay</span>
  </div>
)

export default function Dashboard() {
  const navigate = useNavigate()
  const [showSettleUpModal, setShowSettleUpModal] = useState(false);
  const [showPaymentModalOpen, setShowPaymentModalOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState("")
  const [groupChats, setGroupChats] = useState([]);
  const [directChats, setDirectChats] = useState([]);
  const [billSummary, setBillSummary] = useState({
    totalBill: 0,
    youOwe: 0,
    theyOwe: 0,
})


  // API URL from environment variable or fallback
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setError("");
      
      // Get the user's ID token
      const idToken = await SecurityUtils.getCookie('idToken');
      if (!idToken) {
        throw new Error("Authentication required");
      }
      
      // Fetch expenses
      const response = await fetch(`${API_URL}/get-financial-summary/?idToken=${encodeURIComponent(idToken)}`);
      const data = await response.json();
      if (data.status === 'SUCCESS') {
        // Update bill summary directly from the API
        setBillSummary(data.summary);
        // setRecentActivity(recentExpenses);
      } else {
        setError("Failed to load expenses data");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    }
  };

  const handlePaymentModalOpen = () => {
    setShowPaymentModalOpen(true);
  }



  const refreshDashboardData = () => {
    fetchDashboardData();
  };

  const handleOpenGroupChat = (chatId) => {
    // Mark as read
    setGroupChats(groupChats.map(chat => 
      chat.id === chatId ? {...chat, unreadCount: 0} : chat
    ));
    
    // Here you would navigate to the chat or open a chat modal
    console.log(`Opening group chat ${chatId}`);
  };
  
  const handleOpenDirectChat = (chatId) => {
    // Mark as read
    setDirectChats(directChats.map(chat => 
      chat.id === chatId ? {...chat, unreadCount: 0} : chat
    ));
    
    // Here you would navigate to the chat or open a chat modal
    console.log(`Opening direct chat ${chatId}`);
  };

  const LogoutConfirmationModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-center mb-4 text-red-600">
          <AlertTriangle size={48} />
        </div>
        <h3 className="text-xl font-bold text-center mb-4">Logout</h3>
        <p className="text-gray-600 text-center mb-6">
        Are you sure you want to logout?
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setShowLogoutModal(false)}
            className="flex-1 py-2 px-4 rounded-lg border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
  

  const handleLogout = async() => {
    setIsLoggingOut(true);
    try {
      const checkTokens = await renewTokens();
      
      if(!checkTokens) {
        navigate('/login');
        return;
      }
      
      const accessToken = Cookies.get("accessToken");
      const response = await fetch(`${API_URL}/logout/`, {
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
      setShowLogoutModal(false);
    }
  };

  return (
    <PageLayout>
      {showLogoutModal && <LogoutConfirmationModal />}


      {
        showPaymentModalOpen && (
          <PaymentModal
          isOpen={showPaymentModalOpen}
          onClose={() => setShowPaymentModalOpen(false)}
          onSuccess={refreshDashboardData}  // Add this line
        />
        )
      }
      
      <Header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm py-4 relative z-[100]">
          <Logo />
          <div className="flex items-center gap-4 relative z-[100]">
            <Button 
          variant="ghost" 
          className="hover:bg-zinc-800 relative group"
          title="Friend List"
          onClick={() => navigate('/friends')}
            >
          <UsersRound className="h-auto w-auto text-white" />
          {getTotalUnreadCount(groupChats, directChats) > 0 && (
            <span 
              className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center"
            >
              {getTotalUnreadCount(groupChats, directChats)}
            </span>
          )}
            </Button>
            <Button 
              variant="ghost" 
              className="hover:bg-zinc-800 relative group"
              title="New Payment"
              onClick={handlePaymentModalOpen}
            >
              <CircleDollarSign className="h-auto w-auto text-white" />
            </Button>
            <Button
              variant="ghost"
              className="hover:bg-zinc-800 relative group"
              title="notifications"
            >
              <Bell className="h-auto w-auto text-white" />
              <span className="absolute -top-0 right-3.5 bg-purple-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {getTotalUnreadCount(groupChats, directChats)}
              </span>
            </Button>
            <ProfileDropdown onLogout={() => setShowLogoutModal(true)} />
          </div>
        </Header>

        {/* Main Content */}
      <Section className="py-8">
        <Tabs defaultValue="dashboard" className="w-full relative z-10">
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
            {/* <TransactionsPage /> */}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="Chats" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white relative">
              {getTotalUnreadCount(groupChats, directChats) > 0 ? (
                <MessageSquareDot className="h-4 w-4 mr-2 text-purple-400" />
              ) : (
                <MessagesSquare className="h-4 w-4 mr-2" />
              )}
              <span className="hidden sm:inline">Chats</span>
              {getTotalUnreadCount(groupChats, directChats) > 0 && (
                <span className="absolute -top-1 right-0 bg-purple-600 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center">
                  {getTotalUnreadCount(groupChats, directChats)}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <DashboardContent billSummary={billSummary} setShowSettleUpModal={setShowSettleUpModal} showSettleUpModal={showSettleUpModal} refreshDashboardData={refreshDashboardData}/>

          <TransactionContent />

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

          <TabsContent value="Chats">
            <ChatsContainer 
              groupChats={groupChats}
              directChats={directChats}
              onOpenGroupChat={handleOpenGroupChat}
              onOpenDirectChat={handleOpenDirectChat}
            />
          </TabsContent>
        </Tabs>
      </Section>

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

