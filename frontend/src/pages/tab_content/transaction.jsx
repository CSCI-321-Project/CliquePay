import { TabsContent } from "@radix-ui/react-tabs"
import { Button } from "../../components/ui/button"
import { useEffect, useState } from "react"
import { SecurityUtils } from "../../utils/Security"
import { CreditCard, ArrowUpRight, ArrowDownLeft, DollarSign, Calendar, Info, Search, Filter, Users, Check } from "lucide-react"

const TransactionContent = () => {
  const [transactions, setTransactions] = useState({ expenses: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userName, setUserName] = useState(null);
  
  useEffect(() => {
    
    fetchTransactions(activeFilter);
  }, [activeFilter]);

  const fetchTransactions = async (filter = 'all') => {
    try {
      console.log();
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
        const name = await SecurityUtils.getCookie('username');
        if (name) {
          setUserName(name);
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        
        <div className="flex items-center bg-zinc-800/70 rounded-xl border border-zinc-700/50 p-1 shadow-inner">
          <Button 
            variant={activeFilter === 'all' ? 'purple' : 'ghost'} 
            onClick={() => setActiveFilter('all')}
            className={`flex items-center gap-1.5 text-sm rounded-lg transition-all duration-300 ${
              activeFilter === 'all' ? 'shadow-md' : 'hover:bg-zinc-700/50'
            }`}
            size="sm"
          >
            <CreditCard size={14} className={activeFilter === 'all' ? 'text-purple-300' : 'text-zinc-400'} />
            <span>All</span>
          </Button>
          
          <Button 
            variant={activeFilter === 'paid' ? 'purple' : 'ghost'} 
            onClick={() => setActiveFilter('paid')}
            className={`flex items-center gap-1.5 text-sm rounded-lg transition-all duration-300 ${
              activeFilter === 'paid' ? 'shadow-md' : 'hover:bg-zinc-700/50'
            }`}
            size="sm"
          >
            <ArrowUpRight size={14} className={activeFilter === 'paid' ? 'text-purple-300' : 'text-zinc-400'} />
            <span>You Paid</span>
          </Button>
          
          <Button 
            variant={activeFilter === 'owed' ? 'purple' : 'ghost'} 
            onClick={() => setActiveFilter('owed')}
            className={`flex items-center gap-1.5 text-sm rounded-lg transition-all duration-300 ${
              activeFilter === 'owed' ? 'shadow-md' : 'hover:bg-zinc-700/50'
            }`}
            size="sm"
          >
            <ArrowDownLeft size={14} className={activeFilter === 'owed' ? 'text-purple-300' : 'text-zinc-400'} />
            <span>You Owe</span>
          </Button>
        </div>
      </div>
      
      {/* Expenses List */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 backdrop-blur-sm rounded-xl overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="p-4 border-b border-zinc-700/50 sticky top-0 bg-zinc-800/90 backdrop-blur-md z-10">
          <h3 className="text-lg font-semibold text-white">Transaction History</h3>
          <p className="text-xs text-zinc-400">Showing {transactions.expenses?.length || 0} transactions</p>
        </div>
        
        {/* Transactions - Scrollable */}
        <div className="overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800/50">
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
            <div className="space-y-2 p-2">
              {transactions.expenses.map((expense, index) => {
                const userIsPayer = expense.paid_by === userName;
                const formattedDate = new Date(expense.created_at).toLocaleDateString(undefined, { 
                  month: 'short', day: 'numeric' 
                });
                
                return (
                  <div key={expense.id || index} 
                       className="bg-zinc-800/80 hover:bg-zinc-700/80 rounded-lg transition-all duration-200 
                                  border border-zinc-700/50 hover:border-zinc-600/50 shadow-sm">
                    <div className="p-4">
                      {/* Top row - Description and Amount */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-2.5 flex-shrink-0 ${
                            userIsPayer
                              ? "bg-gradient-to-br from-emerald-900/80 to-emerald-700/40 text-emerald-300" 
                              : "bg-gradient-to-br from-rose-900/80 to-rose-700/40 text-rose-300"
                          }`}>
                            {userIsPayer
                              ? <ArrowUpRight size={18} />
                              : <ArrowDownLeft size={18} />
                            }
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-medium text-white truncate max-w-[180px] sm:max-w-xs">
                              {expense.description || "No description"}
                            </h4>
                          </div>
                        </div>
                        <div className={`text-lg font-semibold ${userIsPayer ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {userIsPayer ? '+' : '-'}${parseFloat(expense.total_amount).toFixed(2)}
                        </div>
                      </div>
                      
                      {/* Metadata row */}
                      <div className="flex flex-wrap justify-between items-center mt-1">
                        <div className="flex flex-wrap gap-2 items-center text-xs">
                          <div className="flex items-center bg-zinc-700/50 text-zinc-300 px-2 py-1 rounded-full">
                            <Calendar className="w-3 h-3 mr-1.5" />
                            {formattedDate}
                          </div>
                          
                          <div className="bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full flex items-center">
                            <Users className="w-3 h-3 mr-1.5" />
                            {expense.paid_by}
                          </div>
                          
                          {expense.deadline && (
                            <div className="bg-amber-900/40 text-amber-300 px-2 py-1 rounded-full flex items-center">
                              <Info className="w-3 h-3 mr-1.5" />
                              Due: {new Date(expense.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2 sm:mt-0">
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center ${
                            parseFloat(expense.remaining_amount) === 0 
                              ? "bg-emerald-900/40 text-emerald-300" 
                              : parseFloat(expense.remaining_amount) < parseFloat(expense.total_amount)
                                ? "bg-blue-900/40 text-blue-300"
                                : "bg-amber-900/40 text-amber-300"
                          }`}>
                            <Check className={`w-3 h-3 mr-1.5 ${
                              parseFloat(expense.remaining_amount) === 0 ? 'opacity-100' : 'opacity-0'
                            }`} />
                            {parseFloat(expense.remaining_amount) === 0 
                              ? "Settled" 
                              : parseFloat(expense.remaining_amount) < parseFloat(expense.total_amount)
                                ? "Partially Paid"
                                : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Optional: Add show details button */}
                    {expense.notes && (
                      <div className="px-4 py-2 border-t border-zinc-700/50 text-xs text-zinc-400">
                        <p className="italic">{expense.notes}</p>
                      </div>
                    )}
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
        
        {/* Subtle scroll indicator */}
        {transactions.expenses && transactions.expenses.length > 5 && (
          <div className="hidden sm:flex justify-center py-2 border-t border-zinc-700/50">
            <div className="text-xs text-zinc-500 flex items-center">
              <span>Scroll for more</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>
        )}
      </div>
    </TabsContent>
  )
}

export default TransactionContent;