import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import GroupChatsList from "./GroupChatsList";
import GroupInvitesList from "./GroupInvitesList";
import DirectMessagesList from "./DirectMessagesList";
import PropTypes from "prop-types";
import { SecurityUtils } from "../../utils/security";

export default function ChatsContainer() {
  const [groupChats, setGroupChats] = useState([]);
  const [directChats, setDirectChats] = useState([]);
  const [groupInvites, setGroupInvites] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingDirects, setIsLoadingDirects] = useState(true);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  // Format group data helper
  const   formatGroupData = (groups) => {
    if (!groups || !Array.isArray(groups)) return [];
    
    return groups.map((group) => {
      // Format the timestamp if it exists
      let formattedTime = "";
      if (group.last_message_time) {
        const messageDate = new Date(group.last_message_time);
        const now = new Date();
        const isToday = messageDate.toDateString() === now.toDateString();
        
        if (isToday) {
          // Format as time only if message is from today (e.g., "2:30 PM")
          formattedTime = messageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        } else {
          // Format as short date if not today (e.g., "Jan 5")
          formattedTime = messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
      }
      
      return {
        id: group.group_id,
        name: group.group_name,
        avatarSrc: group.photo_url || "/placeholder.svg?height=40&width=40",
        lastMessage: group.last_message || "No messages yet",
        lastMessageTime: formattedTime,
        unreadCount: group.unread_count || 0,
        participants: group.members_count || 0
      };
    });
  };

  // Fetch group chats
  const fetchGroupChats = async () => {
    setIsLoadingGroups(true);
    try {
      const token = await SecurityUtils.getCookie("idToken");
      if (!token) {
        setIsLoadingGroups(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/get-user-groups/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_token: token }),
      });
      
      const data = await response.json();
      if (data.status === "SUCCESS") {
        // Format and save groups
        setGroupChats(formatGroupData(data.groups));
      } else {
        console.error("Failed to fetch user groups:", data.message);
      }
    } catch (error) {
      console.error("Error fetching user groups:", error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // New function to fetch group invites
  const fetchGroupInvites = async () => {
    setIsLoadingInvites(true);
    try {
      const token = await SecurityUtils.getCookie("idToken");
      if (!token) {
        setIsLoadingInvites(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/get-user-invites/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_token: token }),
      });
      
      const data = await response.json();
      if (data.status === "SUCCESS") {
        setGroupInvites(data.invites || []);
      } else {
        console.error("Failed to fetch group invites:", data.message);
      }
    } catch (error) {
      console.error("Error fetching group invites:", error);
    } finally {
      setIsLoadingInvites(false);
    }
  };

  // Handle invite actions (accept/reject)
  const handleInviteAction = (inviteId, action) => {
    // Remove the invite from the list immediately for better UX
    setGroupInvites(prev => prev.filter(invite => invite.invite_id !== inviteId));
    
    // If invitation was accepted, refresh the groups list
    if (action === 'accept') {
      fetchGroupChats();
    }
  };

  // Handle creating a new group
  const handleGroupCreate = (newGroupData) => {
    // If this is a deletion operation
    if (newGroupData.deleted && newGroupData.groupId) {
      // First update the UI immediately by removing the group from state
      setGroupChats(prevGroups => prevGroups.filter(group => group.id !== newGroupData.groupId));
      
      // Then fetch fresh data to make sure everything is in sync
      fetchGroupChats();
      return;
    }
    
    // If this is a leave operation (similar to deletion from UI perspective)
    if (newGroupData.left && newGroupData.groupId) {
      // First update the UI immediately by removing the group from state
      setGroupChats(prevGroups => prevGroups.filter(group => group.id !== newGroupData.groupId));
      
      // Then fetch fresh data to make sure everything is in sync
      fetchGroupChats();
      return;
    }
    
    // If this is a creation operation
    setGroupChats(prevGroups => [
      {
        id: newGroupData.group_id,
        name: newGroupData.group_name,
        avatarSrc: newGroupData.photo_url || "/placeholder.svg?height=40&width=40",
        lastMessage: "No messages yet",
        lastMessageTime: "",
        unreadCount: 0,
        participants: 1 // Just the creator initially
      },
      ...prevGroups
    ]);

    // Refresh the groups list after adding to ensure we get the latest data
    fetchGroupChats();
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchGroupChats();
    fetchGroupInvites();
    // Add any other data fetching here
  }, []);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle>Chats</CardTitle>
        <CardDescription className="text-gray-400">
          Stay connected with your friends and groups
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6 bg-zinc-800 border border-zinc-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              All
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Groups
            </TabsTrigger>
            <TabsTrigger value="direct" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Direct
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-6">
            {/* Group Invites Section */}
            {groupInvites.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Group Invites</h3>
                <GroupInvitesList 
                  invites={groupInvites}
                  isLoading={isLoadingInvites}
                  onInviteAction={handleInviteAction}
                />
              </div>
            )}
            
            {/* Group Chats Section */}
            <GroupChatsList 
              groups={groupChats}
              isLoading={isLoadingGroups}
              onGroupCreate={handleGroupCreate}
            />
            
            {/* Direct Messages Section */}
            <DirectMessagesList 
              directChats={directChats} 
              onOpenChat={() => {}}
            />
          </TabsContent>
          
          <TabsContent value="groups">
            {/* Group Invites Section */}
            {groupInvites.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Group Invites</h3>
                <GroupInvitesList 
                  invites={groupInvites}
                  isLoading={isLoadingInvites}
                  onInviteAction={handleInviteAction}
                />
              </div>
            )}
            
            <GroupChatsList 
              groups={groupChats}
              isLoading={isLoadingGroups}
              onGroupCreate={handleGroupCreate}
            />
          </TabsContent>
          
          <TabsContent value="direct">
            {/* Group Invites Section */}
            {groupInvites.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Group Invites</h3>
                <GroupInvitesList 
                  invites={groupInvites}
                  isLoading={isLoadingInvites}
                  onInviteAction={handleInviteAction}
                />
              </div>
            )}
            
            <DirectMessagesList 
              directChats={directChats} 
              onOpenChat={() => {}}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}