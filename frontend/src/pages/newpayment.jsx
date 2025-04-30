import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DollarSign, Users, User, Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
import { SecurityUtils } from '../utils/Security';

export const PaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentType, setPaymentType] = useState('groups'); // 'groups' or 'friends'
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [deadline, setDeadline] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7); // Default to 7 days from now
    return tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });

  const API_URL = `${import.meta.env.VITE_API_URL}/api` || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    if (isOpen) {
      if (paymentType === 'groups') {
        fetchGroups();
      } else {
        fetchFriends();
      }
    }
  }, [isOpen, paymentType]);
  
  if (!isOpen) return null;

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await SecurityUtils.getCookie('idToken');
      console.log(token)
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const encodedToken = encodeURIComponent(token);
      const response = await fetch(`${API_URL}/get-user-groups/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_token: encodedToken })
      });
      
      const data = await response.json();
      if (data.status === 'SUCCESS' && Array.isArray(data.groups)) {
        setGroups(data.groups);
      } else {
        setError('Failed to load groups');
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await SecurityUtils.getCookie('idToken');

      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const encodedToken = encodeURIComponent(token);
      const response = await fetch(`${API_URL}/get-user-friends/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }, 
        body: JSON.stringify({ id_token: encodedToken })
      });
      
      const data = await response.json();
      
      if (data.status === 'SUCCESS' && Array.isArray(data.friends)) {
        setFriends(data.friends);
      } else {
        setError('Failed to load friends');
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }
    
    if (paymentType === 'groups' && !selectedGroupId) {
      setError('Please select a group');
      return;
    }
    
    if (paymentType === 'friends' && !selectedFriendId) {
      setError('Please select a friend');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const token = await SecurityUtils.getCookie('idToken');
      if (!token) {
        setError('Authentication required');
        return;
      }
      const encodedToken = encodeURIComponent(token);
      
      // Different endpoints for group vs friend payment
      const endpoint =`${API_URL}/create-expense/` 
      
      const requestBody = paymentType === 'groups' 
        ? {
            group_id: selectedGroupId,
            total_amount: parseFloat(amount),
            description: description,
            paid_by: encodedToken, 
            deadline: deadline,
          }
        : {
            friend_id: selectedFriendId,
            total_amount: parseFloat(amount),
            description: description,
            paid_by: encodedToken,
            deadline: deadline, 
          };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      if (data.status === 'SUCCESS') {
        setSuccess(true);
        // Reset form after success
        setAmount('');
        setDescription('');
        setSelectedGroupId('');
        setSelectedFriendId('');

        const defaultDeadline = new Date();
        defaultDeadline.setDate(defaultDeadline.getDate() + 7);
        setDeadline(defaultDeadline.toISOString().split('T')[0]);
        
        if (typeof onSuccess === 'function') {
          onSuccess();
        }

        // Close after a short delay
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(data.message || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      setError('Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => onClose()}
      />
      
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full mx-auto shadow-xl">
          <button 
            onClick={() => onClose()}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
            disabled={submitting}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          
          <div className="flex items-center justify-center mb-4 text-purple-400">
            <DollarSign size={48} />
          </div>
          
          <h2 className="text-xl font-bold text-center mb-6">
            New Payment
          </h2>
          
          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">Payment Successful!</h3>
              <p className="text-gray-400 mt-2">
                {paymentType === 'groups' 
                  ? 'Your payment has been processed and split among the group members.' 
                  : 'Your payment has been sent to your friend.'}
              </p>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="flex mb-6 border-b border-zinc-800">
                <button
                  className={`flex-1 py-2 text-center ${paymentType === 'groups' 
                    ? 'text-purple-400 border-b-2 border-purple-400' 
                    : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setPaymentType('groups')}
                >
                  <span className="flex items-center justify-center">
                    <Users size={16} className="mr-1" />
                    Group Payment
                  </span>
                </button>
                <button
                  className={`flex-1 py-2 text-center ${paymentType === 'friends' 
                    ? 'text-purple-400 border-b-2 border-purple-400' 
                    : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setPaymentType('friends')}
                >
                  <span className="flex items-center justify-center">
                    <User size={16} className="mr-1" />
                    Friend Payment
                  </span>
                </button>
              </div>
            
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm rounded-md">
                    {error}
                  </div>
                )}
                
                {/* Group Selection (shown only if paymentType is 'groups') */}
                {paymentType === 'groups' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Select Group:
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full p-3 rounded-md bg-zinc-800 border border-zinc-700 text-white appearance-none"
                        disabled={loading || submitting}
                      >
                        <option value="">Select a group</option>
                        {loading ? (
                          <option disabled>Loading groups...</option>
                        ) : groups.length > 0 ? (
                          groups.map((group) => (
                            
                            <option key={group.group_id} value={group.group_id}>
                              {group.group_name}
                            </option>
                          ))
                        ) : (
                          <option disabled>No groups available</option>
                        )}
                      </select>
                      <Users className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      The payment will be split equally among all group members.
                    </p>
                  </div>
                )}
                
                {/* Friend Selection (shown only if paymentType is 'friends') */}
                {paymentType === 'friends' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Select Friend:
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedFriendId}
                        onChange={(e) => setSelectedFriendId(e.target.value)}
                        className="w-full p-3 rounded-md bg-zinc-800 border border-zinc-700 text-white appearance-none"
                        disabled={loading || submitting}
                      >
                        <option value="">Select a friend</option>
                        {loading ? (
                          <option disabled>Loading friends...</option>
                        ) : friends.length > 0 ? (
                          friends.map((friend) => (
                            <option key={friend.friend_id} value={friend.friend_id}>
                              {friend.friend_name}
                            </option>
                          ))
                        ) : (
                          <option disabled>No friends available</option>
                        )}
                      </select>
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                    </div>
                  </div>
                )}
                
                {/* Amount - for both payment types */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Amount:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-3 pl-8 rounded-md bg-zinc-800 border border-zinc-700 text-white"
                      placeholder="0.00"
                      disabled={submitting}
                    />
                  </div>
                </div>
                
                {/* Description - for both payment types */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description:
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 rounded-md bg-zinc-800 border border-zinc-700 text-white"
                    placeholder={paymentType === 'groups' ? 'e.g., Dinner at Italian Restaurant' : 'e.g., Movie tickets'}
                    disabled={submitting}
                  />
                </div>
                {/* Deadline - for both payment types */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Payment Deadline:
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      min={new Date().toISOString().split('T')[0]} // Can't select dates in the past
                      className="w-full p-3 pl-8 rounded-md bg-zinc-800 border border-zinc-700 text-white"
                      disabled={submitting}
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
              
                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                    disabled={submitting || (paymentType === 'groups' && !selectedGroupId) || (paymentType === 'friends' && !selectedFriendId)}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center">
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Processing...
                      </span>
                    ) : (
                      paymentType === 'groups' ? "Pay & Split" : "Pay Friend"
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

PaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};