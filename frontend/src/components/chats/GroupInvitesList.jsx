import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { MessageSquare, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import PropTypes from "prop-types";
import { SecurityUtils } from '../../utils/Security';

const Loading = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className="flex justify-center items-center w-full py-6">
      <div 
        className={cn(
          "animate-spin rounded-full border-4 border-zinc-700 border-t-purple-600", 
          sizeClasses[size]
        )}
      />
    </div>
  );
};

export default function GroupInvitesList({ invites = [], isLoading, onInviteAction }) {
  const [processingInvites, setProcessingInvites] = useState({});
  const [errors, setErrors] = useState({});
  const API_URL = `${import.meta.env.VITE_API_URL}/api` || 'http://127.0.0.1:8000/api';

  const handleInviteAction = async (inviteId, action) => {
    // Set this invite as processing
    setProcessingInvites(prev => ({ ...prev, [inviteId]: true }));
    // Clear any previous errors for this invite
    setErrors(prev => ({ ...prev, [inviteId]: null }));
    
    try {
      const token = await SecurityUtils.getCookie("idToken");
      if (!token) {
        setErrors(prev => ({ ...prev, [inviteId]: "Authentication required" }));
        return;
      }
      
      const endpoint = action === 'accept' ? 'accept-group-invite' : 'reject-group-invite';
      
      console.log(`Sending ${action} request for invite ${inviteId} to ${API_URL}/${endpoint}/`);
      
      const response = await fetch(`${API_URL}/${endpoint}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_token: token, invite_id: inviteId }),
      });
      
      const data = await response.json();
      console.log(`Response for ${action} invitation:`, data);
      
      if (data.status === "SUCCESS") {
        console.log(`Successfully ${action === 'accept' ? 'accepted' : 'rejected'} invite`);
        // Call the parent callback to update the UI
        if (onInviteAction) {
          onInviteAction(inviteId, action);
        }
      } else {
        console.error(`Error ${action === 'accept' ? 'accepting' : 'rejecting'} invite:`, data.message);
        setErrors(prev => ({ ...prev, [inviteId]: data.message || `Failed to ${action} invite` }));
      }
    } catch (error) {
      console.error(`Error ${action === 'accept' ? 'accepting' : 'rejecting'} group invite:`, error);
      setErrors(prev => ({ ...prev, [inviteId]: `Network error: ${error.message}` }));
    } finally {
      setProcessingInvites(prev => ({ ...prev, [inviteId]: false }));
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (invites.length === 0) {
    return (
      <div className="text-center py-6 bg-zinc-800 rounded-lg">
        <div className="flex justify-center mb-3">
          <MessageSquare className="h-8 w-8 text-zinc-600" />
        </div>
        <p className="text-gray-400">No group invites</p>
      </div>
    );
  }

  return (
    <div>
      <ul className="space-y-2">
        {invites.map((invite) => (
          <li key={invite.invite_id} className="bg-zinc-800 hover:bg-zinc-750 rounded-lg overflow-hidden">
            <div className="p-3 flex items-start">
              <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                <AvatarImage src={invite.photo_url || "/placeholder.svg?height=40&width=40"} alt={invite.group_name} />
                <AvatarFallback className="bg-purple-600">{invite.group_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{invite.group_name}</p>
                <p className="text-sm text-gray-400 truncate">
                  {invite.description || "No description"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Invited {new Date(invite.created_at).toLocaleDateString()}
                </p>
                {errors[invite.invite_id] && (
                  <div className="flex items-center mt-1 text-red-400 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors[invite.invite_id]}
                  </div>
                )}
              </div>
              <div className="ml-2 flex space-x-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "border-green-600 text-green-500 hover:bg-green-900/20",
                    processingInvites[invite.invite_id] && "opacity-70 cursor-not-allowed"
                  )}
                  onClick={() => handleInviteAction(invite.invite_id, 'accept')}
                  disabled={processingInvites[invite.invite_id]}
                >
                  {processingInvites[invite.invite_id] ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Accept
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "border-red-600 text-red-500 hover:bg-red-900/20",
                    processingInvites[invite.invite_id] && "opacity-70 cursor-not-allowed"
                  )}
                  onClick={() => handleInviteAction(invite.invite_id, 'reject')}
                  disabled={processingInvites[invite.invite_id]}
                >
                  {processingInvites[invite.invite_id] ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-1" />
                  )}
                  Decline
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

GroupInvitesList.propTypes = {
  invites: PropTypes.array,
  isLoading: PropTypes.bool.isRequired,
  onInviteAction: PropTypes.func
};