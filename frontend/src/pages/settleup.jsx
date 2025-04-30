import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DollarSign, Users, User, BarChart3 } from "lucide-react";
import { Button } from "../components/ui/button";
import { SecurityUtils } from '../utils/Security';

const SettleUpModal = ({ onClose, onConfirm, amount, isProcessing, onSuccess, setIsProcessing }) => {
    const [settlementType, setSettlementType] = useState('all'); 
    const [selectedEntityId, setSelectedEntityId] = useState('');
    const [groups, setGroups] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalAmount, setTotalAmount] = useState(amount);
    const [error, setError] = useState(null);
    const [settlements, setSettlements] = useState([]);
    const [success, setSuccess] = useState(false); 

    const API_URL = `${import.meta.env.VITE_API_URL}/api` || 'http://127.0.0.1:8000/api';
    
    useEffect(() => {
        fetchSettlementData();
    }, []);
    const handleConfirmSettlement = async () => {
        try {
          setIsProcessing(true);
          setError(null);
          const token = await SecurityUtils.getCookie('idToken');
          
          if (!token) {
            setError('Authentication required');
            return;
          }
          
          // Base payment data
          const paymentData = {
            id_token: token,
            description: 'Settling up'
          };
          
          let apiResponse;
          
          if (settlementType === 'all') {
            // For "all" tab, we need to make individual requests for each settlement
            let successCount = 0;
            let totalSettlements = settlements.length;
            
            for (const settlement of settlements) {
              // For each settlement, create a specific payment request
              const specificPayment = {
                id_token: token,
                user_id: settlement.id,
                amount: settlement.amount,
                description: `Settling up with ${settlement.name}`
              };

              // Make the API call for this specific settlement
              const response = await fetch(`${API_URL}/record-payment/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(specificPayment)
              });
              
              const data = await response.json();
              
              if (data.status === 'success') {
                successCount++;
              }
            }
            
            // Consider it successful if at least one settlement worked
            apiResponse = {
              status: successCount > 0 ? 'success' : 'error',
              message: `Successfully settled ${successCount} out of ${totalSettlements} payments`
            };
            
          } else if (settlementType === 'friends' && selectedEntityId) {
            // Settle with specific friend - existing code
            paymentData.user_id = selectedEntityId;
            paymentData.amount = totalAmount;
            
            const response = await fetch(`${API_URL}/record-payment/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(paymentData)
            });
            
            apiResponse = await response.json();
            
          } else if (settlementType === 'groups' && selectedEntityId) {
            // Settle within specific group - existing code
            paymentData.group_id = selectedEntityId;
            paymentData.amount = totalAmount;
            console.log('Group payment data:', paymentData);
            const response = await fetch(`${API_URL}/record-payment/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(paymentData)
            });
            
            apiResponse = await response.json();
            
          } else {
            setError('Invalid selection');
            setIsProcessing(false);
            return;
          }
          
          // Handle the result
          if (apiResponse.status === 'success') {
            // Show success state
            setSuccess(true);
            
            // Close modal after delay and call onSuccess if provided
            setTimeout(() => {
              onClose();
              if (typeof onSuccess === 'function') {
                onSuccess();
              }
            }, 2000);
          } else {
            setError(apiResponse.message || 'Failed to process payment');
          }
        } catch (error) {
          console.error('Error settling up:', error);
          setError('Could not process payment. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      };

    const fetchSettlementData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await SecurityUtils.getCookie('idToken');
    
            if (!token) {
                console.error('No auth token found');
                setError('Authentication required');
                return;
            }
            
            const response = await fetch(`${API_URL}/get-settlement-data/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id_token: token })
            });
            
            const data = await response.json();
            
            if (data.status === 'SUCCESS') {
                const friendsData = [];
                const groupsData = [];
                
                // Process settlements
                data.settlements.forEach(settlement => {
                    // Check if any expenses are group expenses
                    const hasGroupExpenses = settlement.expenses.some(expense => 
                        expense.group_id !== undefined && expense.group_id !== null);
                    
                    if (hasGroupExpenses) {
                        console.log(settlement)
                        groupsData.push(settlement);
                    } else {
                        friendsData.push(settlement);
                    }
                });
                setFriends(friendsData);
                setGroups(groupsData);
                setSettlements(data.settlements);
                
                // Set total amount to the total owed from the API
                setTotalAmount(data.total_to_pay || 0);

            } else {
                setError('Failed to load settlement data');
            }
        } catch (error) {
            console.error('Error fetching settlement data:', error);
            setError('Could not connect to the server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                onClick={onClose}
            />
            
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full mx-auto shadow-xl">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        disabled={isProcessing}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    
                    <div className="flex items-center justify-center mb-4 text-purple-400">
                        <DollarSign size={48} />
                    </div>
                    
                    <h2 className="text-xl font-bold text-center mb-6">
                        Settle Up
                    </h2>
                    
                       
                    {success ? (
                        <div className="text-center py-8">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-white">Payment Successful!</h3>
                        </div>
                    ) : (
                        <div>
                            {/* Tab Navigation */}
                            <div className="flex mb-6 border-b border-zinc-800">
                            <button
                                className={`flex-1 py-2 text-center ${settlementType === 'all' 
                                    ? 'text-purple-400 border-b-2 border-purple-400' 
                                    : 'text-gray-400 hover:text-white'}`}
                                onClick={() => setSettlementType('all')}
                            >
                                All
                            </button>
                            <button
                                className={`flex-1 py-2 text-center ${settlementType === 'groups' 
                                    ? 'text-purple-400 border-b-2 border-purple-400' 
                                    : 'text-gray-400 hover:text-white'}`}
                                onClick={() => setSettlementType('groups')}
                            >
                                <span className="flex items-center justify-center">
                                    <Users size={16} className="mr-1" />
                                    Groups
                                </span>
                            </button>
                            <button
                                className={`flex-1 py-2 text-center ${settlementType === 'friends' 
                                    ? 'text-purple-400 border-b-2 border-purple-400' 
                                    : 'text-gray-400 hover:text-white'}`}
                                onClick={() => setSettlementType('friends')}
                            >
                                <span className="flex items-center justify-center">
                                    <User size={16} className="mr-1" />
                                    Friends
                                </span>
                            </button>
                        </div>
                        
                        {/* Tab Content */}
                        <div className="mb-6">
                            {settlementType === 'all' && (
                                <div>
                                    <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 text-center">
                                        <p className="text-gray-400 mb-1">Total amount to pay</p>
                                        <p className="text-2xl font-bold text-white">${totalAmount?.toFixed(2) || "0.00"}</p>
                                    </div>
                                </div>
                            )}
                            
                            {settlementType === 'groups' && (
                                <div>
                                    <p className="text-gray-300 mb-4">
                                        Select a group to settle balances.
                                    </p>
                                    {loading ? (
                                        <div className="flex justify-center py-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                                        </div>
                                    ) : groups.length > 0 ? (
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                            {groups.map(group => (
                                                <button
                                                    key={group.expenses[0].group_id}
                                                    className={`w-full p-3 flex items-center rounded-lg border ${
                                                        selectedEntityId === group.expenses[0].group_id
                                                            ? 'border-purple-500 bg-purple-900/20'
                                                            : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
                                                    }`}
                                                    onClick={() => {
                                                        if (selectedEntityId === group.expenses[0].group_id) {
                                                            // Clicking the same group again deselects it
                                                            setSelectedEntityId('');
                                                            // Reset to total amount
                                                            setTotalAmount(data.total_owed || 0);
                                                        } else {
                                                            // Select this group
                                                            setSelectedEntityId(group.expenses[0].group_id);
                                                            setTotalAmount(group.amount);
                                                        }
                                                    }}
                                                >
                                                    <div className="bg-zinc-700 rounded-full p-2 mr-3">
                                                        <Users size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <h4 className="font-medium text-white">{group.expenses[0].group_name}</h4>
                                                        <p className="text-sm text-gray-400">${group.amount?.toFixed(2) || "0.00"}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-400 py-4">No groups found</p>
                                    )}
                                </div>
                            )}
                            
                            {settlementType === 'friends' && (
                                    <div>
                                        <p className="text-gray-300 mb-4">
                                            Select a friend to pay.
                                        </p>
                                        {loading ? (
                                            <div className="flex justify-center py-4">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                                            </div>
                                        ) : friends.length > 0 ? (
                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                                {friends.map(friend => (
                                                    <button
                                                        key={friend.id}
                                                        className={`w-full p-3 flex items-center rounded-lg border ${
                                                            selectedEntityId === friend.id
                                                                ? 'border-purple-500 bg-purple-900/20'
                                                                : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
                                                        }`}
                                                        onClick={() => {
                                                            if (selectedEntityId === friend.id) {
                                                                // Clicking the same friend again deselects it
                                                                setSelectedEntityId('');
                                                                // Reset to total amount
                                                                
                                                                setTotalAmount(data.total_to_pay || 0);
                                                            } else {
                                                                // Select this friend
                                                                setSelectedEntityId(friend.id);
                                                                setTotalAmount(friend.amount);
                                                            }
                                                        }}
                                                    >
                                                        <div className="bg-zinc-700 rounded-full p-2 mr-3">
                                                            <User size={18} />
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <h4 className="font-medium text-white">{friend.name}</h4>
                                                            <p className="text-sm text-gray-400">
                                                                You owe
                                                            </p>
                                                        </div>
                                                        <div className="text-right text-red-400">
                                                            <p className="font-medium">${friend.amount.toFixed(2)}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center text-gray-400 py-4">No friends owe you money</p>
                                        )}
                                    </div>
                                )}
                        </div>
                        
                        {error && (
                            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm rounded-md">
                                {error}
                            </div>
                        )}
                        
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="outline"
                                className="flex-1 border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                                disabled={isProcessing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirmSettlement}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                                disabled={isProcessing || (settlementType !== 'all' && !selectedEntityId)}
                            >
                                {isProcessing ? (
                                <span className="flex items-center justify-center">
                                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    Processing...
                                </span>
                                ) : (
                                "Settle Up"
                                )}
                            </Button>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
};

SettleUpModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    amount: PropTypes.number,
    recipient: PropTypes.string,
    isProcessing: PropTypes.bool,
};

export default SettleUpModal;