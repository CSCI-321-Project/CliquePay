import { TabsContent } from "../../components/ui/tabs"
import { Button } from "../../components/ui/button"
import { useEffect, useState } from "react"
import { SecurityUtils } from "../../utils/Security"
import { CreditCard, ArrowUpRight, ArrowDownLeft, DollarSign, Calendar, Info, Search, Filter } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"

const TransactionContent = () => {
  const [transactions, setTransactions] = useState({ expenses: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userId, setUserId] = useState(null);
  
  useEffect(() => {
    fetchTransactions(activeFilter);
  }, [activeFilter]);

  const fetchTransactions = async (filter = 'all') => {
    try {
      setLoading(true);
      const idToken = await SecurityUtils.getCookie('idToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      
      const response = await fetch(`${API_URL}/api/transactions?idToken=${encodeURIComponent(idToken)}&filter=${filter}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.status === "Returned" && data.expenses) {
        if (data.userId) {
          setUserId(data.userId);
        }
        
        setTransactions({
          expenses: data.expenses,
        });
      } else {
        setError("Failed to load transactions");
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }  
  }

  return (
    <TabsContent value="transactions" className="space-y-6">
  
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        
        <div className="flex gap-2 p-1 bg-zinc-800/70 rounded-lg border border-zinc-700/50">
          <Button 
            variant={activeFilter === 'all' ? 'purple' : 'ghost'} 
            onClick={() => setActiveFilter('all')}
            className="text-sm rounded-md"
            size="sm"
          >
            All
          </Button>
          <Button 
            variant={activeFilter === 'paid' ? 'purple' : 'ghost'} 
            onClick={() => setActiveFilter('paid')}
            className="text-sm rounded-md"
            size="sm"
          >
            You Paid
          </Button>
          <Button 
            variant={activeFilter === 'owed' ? 'purple' : 'ghost'} 
            onClick={() => setActiveFilter('owed')}
            className="text-sm rounded-md"
            size="sm"
          >
            You Owe
          </Button>
        </div>
      </div>
      
      {/* Expenses List */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 backdrop-blur-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 px-4">
            <Info className="h-12 w-12 text-zinc-500 mb-3" />
            <p className="text-zinc-400 text-center">{error}</p>
          </div>
        ) : transactions.expenses && transactions.expenses.length > 0 ? (
          <div className="divide-y divide-zinc-700/50">
            {transactions.expenses.map((expense, index) => {
              // Since paid_by is a full name and we only have userId, 
              // we need to track if the backend tells us the user is the payer
              // We'll look for this in the response data
              const userIsPayer = transactions.current_user_expenses && 
                                  transactions.current_user_expenses.includes(expense.id);
              
              return (
                <div key={expense.id || index} className="p-4 sm:p-5 hover:bg-zinc-700/20 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center">
                      <div className={`rounded-full p-3 mr-4 ${
                        userIsPayer
                          ? "bg-emerald-900/30 text-emerald-400" 
                          : "bg-rose-900/30 text-rose-400"
                      }`}>
                        {userIsPayer
                          ? <ArrowUpRight size={20} />
                          : <ArrowDownLeft size={20} />
                        }
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{expense.description || "No description"}</h4>
                        <div className="flex flex-wrap items-center text-xs text-zinc-400 mt-1">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(expense.created_at).toLocaleDateString()}
                          </span>
                          
                          {expense.deadline && (
                            <span className="ml-3 flex items-center">
                              <Info className="w-3 h-3 mr-1" />
                              Due: {new Date(expense.deadline).toLocaleDateString()}
                            </span>
                          )}
                          
                          <span className="ml-3 bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full">
                            Paid by: {expense.paid_by}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end ml-11 sm:ml-0">
                      <div className={`font-medium ${userIsPayer ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {userIsPayer ? '+' : '-'}${parseFloat(expense.total_amount).toFixed(2)}
                      </div>
                      <div className="flex items-center mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          parseFloat(expense.remaining_amount) === 0 
                            ? "bg-emerald-900/40 text-emerald-300" 
                            : parseFloat(expense.remaining_amount) < parseFloat(expense.total_amount)
                              ? "bg-blue-900/40 text-blue-300"
                              : "bg-amber-900/40 text-amber-300"
                        }`}>
                          {parseFloat(expense.remaining_amount) === 0 
                            ? "Settled" 
                            : parseFloat(expense.remaining_amount) < parseFloat(expense.total_amount)
                              ? "Partially Paid"
                              : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 px-4">
            <CreditCard className="h-12 w-12 text-zinc-500 mb-3" />
            <p className="text-zinc-400 mb-2">No transactions found</p>
            <p className="text-zinc-500 text-sm text-center max-w-md">
              When you create expenses or make payments, they will appear here.
            </p>
          </div>
        )}
      </div>
    </TabsContent>
  )
}

export default TransactionContent;