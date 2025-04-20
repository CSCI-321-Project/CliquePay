import {TabsContent} from "../../components/ui/tabs"
import { Button } from "../../components/ui/button";
const TransactionContent = () => {
    
    return (
        <TabsContent value="transactions" className="space-y-6">
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-700">
            <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
            <p className="text-sm text-zinc-400 mt-1">View your recent transaction history</p>
          </div>
          
          <div className="p-6">
            <div className="relative overflow-x-auto rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-zinc-900 text-zinc-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">Date</th>
                    <th scope="col" className="px-6 py-3">Description</th>
                    <th scope="col" className="px-6 py-3">Amount</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 1, date: "2023-07-15", description: "Coffee Shop", amount: -4.50, status: "completed" },
                    { id: 2, date: "2023-07-14", description: "Salary Deposit", amount: 2750.00, status: "completed" },
                    { id: 3, date: "2023-07-12", description: "Grocery Store", amount: -65.28, status: "completed" },
                    { id: 4, date: "2023-07-10", description: "Transfer from Sarah", amount: 25.00, status: "completed" },
                    { id: 5, date: "2023-07-08", description: "Monthly Subscription", amount: -12.99, status: "pending" }
                  ].map(transaction => (
                    <tr key={transaction.id} className="bg-zinc-700 border-b border-zinc-600 hover:bg-zinc-600">
                      <td className="px-6 py-4">{transaction.date}</td>
                      <td className="px-6 py-4">{transaction.description}</td>
                      <td className={`px-6 py-4 font-medium ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === 'completed' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="p-6 border-t border-zinc-700 flex justify-between">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">View All Transactions</Button>
          </div>
        </div>
      </TabsContent>
    )
}

export default TransactionContent;