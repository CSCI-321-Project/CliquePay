import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useUser } from '../utils/UserContext'
import AuthenticateUser from '../utils/AuthenticateUser';
import { PageLayout, Section, Header } from '../components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import Loading from '../components/Loading';
import { SecurityUtils } from '../utils/security';
import { Users, UserPlus, Search, CreditCard, ArrowLeftFromLine, LogOut, X, UserMinus, UserX } from "lucide-react";
import { set } from 'zod';

// Simple Logo component
const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="bg-purple-600 w-8 h-8 rounded-md flex items-center justify-center">
      <CreditCard className="w-5 h-5" />
    </div>
    <span className="font-bold text-xl">CliquePay</span>
  </div>
)

// Friend Card Component
function FriendCard({ name, imgSrc, email, onRemove }) {
  return (
    <Card className="bg-zinc-800 border-zinc-700 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={imgSrc} alt={name} />
            <AvatarFallback className="bg-purple-900/50 text-white">
              {name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium text-white">{name}</h3>
            <p className="text-sm text-zinc-400">{email}</p>
          </div>
          <Button variant="outline" size="sm" className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
            Message
          </Button>
          <Button variant="outline" size="sm" onClick={onRemove} className="border-red-700 text-red-400 hover:bg-red-900/20">
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

//Search Card Component with updated button state handling
function SearchCard({ name, imgSrc, username, onRequest, isRequested }) {
  const displayName = name || 'Unknown User';
  
  return (
    <Card className="bg-zinc-800 border-zinc-700 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={imgSrc} alt={displayName} />
            <AvatarFallback className="bg-purple-900/50 text-white">
              {displayName.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium text-white">{displayName}</h3>
            <p className="text-sm text-zinc-400">{username || 'No username'}</p>
          </div>
          <Button 
            onClick={onRequest} 
            disabled={isRequested}
            className={`${isRequested 
              ? 'bg-zinc-700 text-zinc-300 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isRequested ? 'Requested' : 'Request'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Request Card Component
function RequestCard({ name, imgSrc, email, onAccept, onDecline }) {
  return (
    <Card className="bg-zinc-800 border-zinc-700 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={imgSrc} alt={name} />
            <AvatarFallback className="bg-purple-900/50 text-white">
              {name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium text-white">{name}</h3>
            <p className="text-sm text-zinc-400">{email}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={onAccept} className="bg-purple-600 hover:bg-purple-700">
              Accept
            </Button>
            <Button variant="outline" size="sm" onClick={onDecline} className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const Content = () => {
    const user = useUser()
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
    const [profileData, setProfileData] = useState(null);
    const [loading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allUsers, setAllUsers] =  useState([]);
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [blocked, setBlocked] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
        const [hasSearched, setHasSearched] = useState(false);
    const [requestedUsers, setRequestedUsers] = useState([]);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [friendToRemove, setFriendToRemove] = useState(null);
    const [sentRequests, setSentRequests] = useState([]);
    const navigate = useNavigate();

    const fetchUserProfile = async () => {
        try {
            setIsLoading(true);
            const token = await SecurityUtils.getCookie('idToken');
            if (!token) {
                setError('No authentication token found');
                return;
            }
            
            const response = await fetch(`${API_URL}/user-profile/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id_token: token })
            });

            const data = await response.json();
            
            if (data.status === 'SUCCESS') {
                setProfileData(data.user_data);

                try{
                    const friendsResponse = await fetch(`${API_URL}/get-user-friends/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id_token: token })
                    });
                    const friendsData = await friendsResponse.json();
                    if (friendsData.status === 'SUCCESS') {
                        setAllUsers(friendsData.friends);
                    } else {
                        setError(friendsData.message || 'Failed to fetch friends data');
                    }
                }catch{
                    setError('Failed to fetch friends data');
                }
            } else {
                setError(data.message || 'Failed to fetch profile data');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setError('Error fetching profile data');
        } finally {
            setIsLoading(false);
        }
    };

    const sortFriendships = (friendships) => {
      const friends = [];
      const requests = [];
      const sentRequests = []; 
      const blocked = [];
      
      const currentUserId = profileData?.id;
      console.log("Current user ID:", currentUserId);
      
      friendships.forEach(friendship => {
        console.log(`Friendship ${friendship.friendship_id}: Initiator=${friendship.initiator}, Current User=${currentUserId}`);
        
        if (friendship.status === 'accepted' || friendship.status === 'ACCEPTED') {
          friends.push(friendship);
        } 
        else if (friendship.status === 'pending' || friendship.status === 'PENDING') {
          if (friendship.initiator === currentUserId) {
            sentRequests.push(friendship); // Outgoing request
          } else {
            requests.push(friendship); // Incoming request
          }
        } 
        else if (friendship.status === 'blocked' || friendship.status === 'BLOCKED') {
          blocked.push(friendship);
        }
      });
      
      setFriends(friends);    
      setRequests(requests); // Only incoming requests
      setSentRequests(sentRequests); // Store outgoing requests separately
      setBlocked(blocked);
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);
    useEffect(() => {
        sortFriendships(allUsers);
    }, [allUsers]);


    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) {
            return;
        }
        
        setHasSearched(true); // Always set this to true to show "no results" message
        
        try {
            const token = await SecurityUtils.getCookie('idToken');
            if (!token) {
                setError('No authentication token found');
                return;
            }
            
            const response = await fetch(`${API_URL}/search-user/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id_token: token, query: searchTerm })
            }); 
    
            const data = await response.json();
            console.log("Search results:", data); // Add this line for debugging
            
            if (data.status === 'SUCCESS') {
                // Check for different possible result structures
                const results = data.users || data.results || [];
                setSearchResults(results);
            } else {
                setError(data.message || 'Failed to fetch search results');
                setSearchResults([]); // Clear previous results
            }
        } catch(error) {
            console.error('Error fetching search results:', error);
            setSearchResults([]); // Clear previous results on error
            setError('Error searching for users');
        }
    };

    const handleRequest = async (friend, username) => {
        try {
            const token = await SecurityUtils.getCookie('idToken');
            if (!token) {
                setError('No authentication token found');
                return;
            }
            
            // Add to requested users immediately for UI feedback
            setRequestedUsers(prev => [...prev, username]);
            
            // Create a temporary request object with proper field names
            const tempRequest = {
                friend_name: friend.full_name,
                email: friend.email,
                profile_photo: friend.profile_photo,
                // Add a temporary ID we'll replace when the API responds
                friendship_id: `temp-${Date.now()}`,
                // is api resoponse pending
                isPending: true
            };
            
            // Add to sent requests immediately with temp data
            setSentRequests(prev => [...prev, tempRequest]);
            
            const response = await fetch(`${API_URL}/send-friend-request/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id_token: token, recieve_username: username })
            });
            const data = await response.json();
            
            if (data.status === 'SUCCESS') {
                // If successful, replace temp request with actual data
                if (data.friendship.id) {
                    setSentRequests(prev => prev.map(req => 
                        req.friendship_id === tempRequest.friendship_id 
                            ? {...tempRequest, friendship_id: data.friendship.id, isPending: false} 
                            : req
                    ));
                }
            } else {
                // On error, remove the temporary request
                setSentRequests(prev => prev.filter(req => req.friendship_id !== tempRequest.friendship_id));
                setError(data.message || 'Failed to send friend request');
            }
        } catch (error) {
            // On exception, remove the temporary request
            setSentRequests(prev => prev.filter(req => req.friendship_id !== tempRequest.friendship_id));
            console.error('Error sending friend request:', error);
            setError('Error sending friend request');
        }
    };

    const handleRemoveFriendClick = (friend) => {
        setFriendToRemove(friend);
        setShowRemoveModal(true);
    };

    const handleRemoveFriend = async () => {
        if (!friendToRemove) return;
        
        try {
          const token = await SecurityUtils.getCookie('idToken');
          if (!token) {
            setError('No authentication token found');
            return;
          }
          
          const response = await fetch(`${API_URL}/remove-friend/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              id_token: token, 
              friendship_id: friendToRemove.friendship_id ,
              block: false
            })
          });
          
          const data = await response.json();
          if (data.status === 'SUCCESS') {
            setFriends(friends.filter(f => f.friend_id !== friendToRemove.friend_id));
            setShowRemoveModal(false);
          } else {
            setError(data.message || 'Failed to remove friend');
          }
        } catch (error) {
          console.error('Error removing friend:', error);
          setError('Error removing friend');    
        }
    };

    const handleRemoveAndBlockFriend = async () => {
        if (!friendToRemove) return;
        
        try {
          const token = await SecurityUtils.getCookie('idToken');
          if (!token) {
            setError('No authentication token found');
            return;
          }
          
          const response = await fetch(`${API_URL}/remove-friend/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              id_token: token, 
              friendship_id: friendToRemove.friendship_id,
              block: true     
            })
          });
          
          const data = await response.json();
          if (data.status === 'SUCCESS') {
            setFriends(friends.filter(f => f.friend_id !== friendToRemove.friend_id));
            setShowRemoveModal(false);
          } else {
            setError(data.message || 'Failed to remove and block friend');
          }
        } catch (error) {
          console.error('Error removing and blocking friend:', error);
          setError('Error removing and blocking friend');
        }
    };

    const handleAcceptRequest = async (friend) => {
        try {
            const token = await SecurityUtils.getCookie('idToken');
            if (!token) {
                setError('No authentication token found');
                return;
            }
            const response = await fetch(`${API_URL}/accept-friend-request/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_token: token, request_id: friend.friendship_id })
            });
            const data = await response.json();
            if (data.status === 'SUCCESS') {
                setFriends([...friends, friend]);
                setRequests(requests.filter(req => req.friendship_id !== friend.friendship_id));
            } else {
                setError(data.message || 'Failed to accept friend request');
            }
        } 
        catch (error) {
            console.error('Error accepting friend request:', error);
        }
        
    };

    const handleDeclineRequest = async (friend) => {
        try{
            const token = await SecurityUtils.getCookie('idToken');
            if (!token) {
                setError('No authentication token found');
                return;
            }
            const response = await fetch(`${API_URL}/reject-friend-request/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id_token: token, request_id: friend.friendship_id })
            });
            const data = await response.json();
            if (data.status === 'SUCCESS') {
                setRequests(requests.filter(req => req.friendship_id !== friend.friendship_id));
            } else {
                setError(data.message || 'Failed to decline friend request');
            }
        } catch(error){
            console.error('Error declining friend request:', error);
        }
    };

    const handleDashboardClick = () => {
        navigate('/dashboard');
    };

    const handleCancelRequest = async (request) => {
        try {
          const token = await SecurityUtils.getCookie('idToken');
          if (!token) {
            setError('No authentication token found');
            return;
          }
          
          const response = await fetch(`${API_URL}/reject-friend-request/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_token: token, request_id: request.friendship_id })
          });
          
          const data = await response.json();
          if (data.status === 'SUCCESS') {
            // Remove from sent requests by friendship_id
            setSentRequests(prev => 
              prev.filter(req => req.friendship_id !== request.friendship_id)
            );
            
            // If we're storing usernames in requestedUsers, remove the friend's name
            const friendUsername = request.username || 
                                  (request.friend_name && extractUsername(request.friend_name));
            
            if (friendUsername) {
              setRequestedUsers(prev => 
                prev.filter(username => username !== friendUsername)
              );
            }
          } else {
            setError(data.message || 'Failed to cancel friend request');
          }
        } catch (error) {
          console.error('Error canceling friend request:', error);
          setError('Error canceling friend request');
        }
      };
      
      // Helper function to extract username if needed
      const extractUsername = (fullName) => {
        // This is a fallback in case you store username in a different format
        return fullName.toLowerCase().replace(/\s+/g, '');
      };

    const handleSearchTermChange = (e) => {
        setSearchTerm(e.target.value);
        setHasSearched(false);
    };

    if (error) {
        return (
            <PageLayout>
                <Card className="bg-zinc-900 border-zinc-800 p-6">
                    <div className="text-red-500">{error}</div>
                </Card>
            </PageLayout>
        );
    }

    if(loading || !profileData){
        return <Loading />;
    }

    return (
        <PageLayout>
            {/* Header */}
            <Header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm py-4">
                <Logo />
                <div className="flex items-center gap-4">
                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleDashboardClick}>
                        <ArrowLeftFromLine className="h-4 w-4 mr-2" />
                        <span>Dashboard</span>
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/login')}>
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Logout</span>
                    </Button>
                </div>
            </Header>

            <Section className="py-8">
                {   /* Profile Card */}
                <Card className="bg-zinc-800 border-zinc-700 p-6 shadow-lg rounded-lg overflow-hidden mb-8">
                    <div className="flex flex-row items-center justify-between gap-4">
                        <div className="flex flex-row items-center gap-4">
                            <div className="relative">
                                <img 
                                    src={profileData.profile_photo || "/placeholder.svg?height=150&width=150"} 
                                    alt={`${profileData.username}'s profile`} 
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-purple-600 shadow-xl" 
                                />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-2xl font-semibold text-white mb-1">{profileData.full_name}</h2>
                                <p className="text-zinc-400 mb-3">@{profileData.username}</p>
                            </div>
                        </div>
                        <div className="flex justify-evenly gap-4">
                            <div className="text-center bg-zinc-700/50 px-6 py-4 rounded-lg border border-zinc-600">
                                <h2 className="text-lg font-medium text-white mb-1">Friends</h2>
                                <p className="text-2xl text-white font-bold">{friends.length}</p>
                            </div>
                            <div className="text-center bg-zinc-700/50 px-6 py-4 rounded-lg border border-zinc-600">
                                <h2 className="text-lg font-medium text-white mb-1">Pending</h2>
                                <p className="text-2xl text-white font-bold">{requests.length}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Tabs for Friends, Requests, Search */}
                <Tabs defaultValue="friends" className="w-full">
                    <TabsList className="grid grid-cols-4 mb-8 bg-zinc-800 border border-zinc-700">
                        <TabsTrigger 
                            value="friends"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                        >
                            Friends
                        </TabsTrigger>
                        <TabsTrigger 
                            value="requests"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                        >
                            Requests
                            {requests.length > 0 && (
                            <span className="ml-1.5 bg-purple-600 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center">
                                {requests.length}
                            </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger 
                            value="sent"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                        >
                            Sent
                            {sentRequests.length > 0 && (
                            <span className="ml-1.5 bg-zinc-700 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center">
                                {sentRequests.length}
                            </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger 
                            value="search"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                        >
                            Search
                        </TabsTrigger>
                    </TabsList>

                    {/* Friends Tab Content */}
                    <TabsContent value="friends" className="space-y-4">
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle>Your Friends</CardTitle>
                                <CardDescription className="text-gray-400">
                                    You have {friends.length} friends
                                </CardDescription>
                            </CardHeader>
                          <CardContent className="space-y-4">
                                {friends.length === 0 ? (
                                    <p className="text-center text-zinc-400 py-4">You don&apos;t have any friends yet. Add some friends to get started!</p>
                                ) : (
                                    friends.map(friend => (
                                        <FriendCard 
                                            key={friend.friend_id}
                                            name={friend.friend_name}
                                            email={friend.email}
                                            imgSrc={friend.profile_photo}
                                            onRemove={() => handleRemoveFriendClick(friend)}
                                        />
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Requests Tab Content */}
                    <TabsContent value="requests" className="space-y-4">
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle>Friend Requests</CardTitle>
                                <CardDescription className="text-gray-400">
                                    You have {requests.length} pending friend requests
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {requests.length === 0 ? (
                                    <p className="text-center text-zinc-400 py-4">You don&apos;t have any pending friend requests.</p>
                                ) : (
                                    requests.map(request => (
                                        <RequestCard 
                                            key={request.friendship_id}
                                            name={request.friend_name}
                                            email={request.email}
                                            imgSrc={request.profile_photo}
                                            onAccept={() => handleAcceptRequest(request)}
                                            onDecline={() => handleDeclineRequest(request)}
                                        />  
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Search Tab Content */}
                     <TabsContent value="search" className="space-y-4">
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle>Find Friends</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Search for friends by name, username or email.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleSearchTermChange} 
                                        placeholder="Search for friends..."
                                        className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                    />
                                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                                        <Search className="h-4 w-4 mr-2" />
                                        Search
                                    </Button>
                                </form>
                                
                                <div className="space-y-4">
                                        {searchResults.length > 0 ? 
                                            searchResults.map(result => (
                                                !result.is_friend ? (
                                                    <SearchCard 
                                                        key={result.id}
                                                        name={result.full_name}
                                                        username={result.username}
                                                        imgSrc={result.profile_photo}
                                                        onRequest={() => handleRequest(result, result.username)}
                                                        isRequested={
                                                          requestedUsers.includes(result.username) || 
                                                          sentRequests.some(req => req.friend_name === result.full_name)
                                                        }
                                                    />
                                                ) : null
                                            ))
                                        : hasSearched && (
                                            <p className="text-center text-zinc-400 py-4">
                                                No results found for &quot;{searchTerm}&quot;
                                            </p>
                                        )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sent" className="space-y-4">
                      <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                          <CardTitle>Sent Requests</CardTitle>
                          <CardDescription className="text-gray-400">
                            You have {sentRequests.length} pending outgoing requests
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {sentRequests.length === 0 ? (
                            <p className="text-center text-zinc-400 py-4">You haven&apos;t sent any friend requests yet.</p>
                          ) : (
                            sentRequests.map(request => (
                              <div key={request.friendship_id} className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={request.profile_photo} alt={request.friend_name} />
                                    <AvatarFallback className="bg-purple-900/50 text-white">
                                      {request.friend_name?.split(" ").map(n => n[0]).join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-white">{request.friend_name}</p>
                                    <p className="text-sm text-zinc-400">Request pending</p>
                                  </div>
                                </div>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="border-zinc-700 hover:bg-zinc-700"
                                  onClick={() => handleCancelRequest(request)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                </Tabs>
            </Section>

            {showRemoveModal && friendToRemove && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Remove Friend</h2>
                            <button 
                            onClick={() => setShowRemoveModal(false)}
                            className="text-zinc-400 hover:text-white"
                            >
                            <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="mb-6">
                            <p className="text-zinc-300">
                            Do you want to remove <span className="text-purple-400 font-semibold">{friendToRemove.friend_name}</span> from your friends list or remove and block them?
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 mt-6">
                            <Button 
                            onClick={handleRemoveFriend}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white w-full flex items-center justify-center"
                            >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove Friend
                            </Button>
                            
                            <Button 
                            onClick={handleRemoveAndBlockFriend}
                            className="bg-red-900/80 hover:bg-red-800 text-white w-full flex items-center justify-center"
                            >
                            <UserX className="h-4 w-4 mr-2" />
                            Remove and Block
                            </Button>
                            
                            <Button 
                            onClick={() => setShowRemoveModal(false)} 
                            variant="outline"
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 w-full"
                            >
                            Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
};

const Friends = () => {
    return (
        <AuthenticateUser>
            <Content />
        </AuthenticateUser> 
    );
};

export default Friends;