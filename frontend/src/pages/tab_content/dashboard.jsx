
import {TabsContent} from "../../components/ui/tabs"
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { useState } from "react"
import SettleUpModal from "../settleup";

const DashboardContent = ({billSummary, setShowSettleUpModal, showSettleUpModal, refreshDashboardData}) => {
    const [settleUpDetails, setSettleUpDetails] = useState({ amount: 0, recipient: '' });
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const handleSettleUp = (amount, recipient) => {
      setSettleUpDetails({ amount, recipient });
      console.log(amount, recipient);
      setShowSettleUpModal(true);
    };

    const confirmSettleUp = async () => {
      setIsProcessingPayment(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // Success handling
        setShowSettleUpModal(false);
        // Refresh dashboard data after settling up
        fetchDashboardData();
      } catch (error) {
        console.error("Failed to settle up:", error);
        // Add error handling here if needed
      } finally {
        setIsProcessingPayment(false);
      }
    };

    return (
      <div>
        {
          showSettleUpModal && (
            <SettleUpModal
              amount={settleUpDetails.amount}
              recipient={settleUpDetails.recipient}
              onClose={() => setShowSettleUpModal(false)}
              onConfirm={confirmSettleUp}
              onSuccess={refreshDashboardData}
              setIsProcessing={setIsProcessingPayment}
              isProcessing={isProcessingPayment}
            />
          )
        }
        <TabsContent value="dashboard" className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Bill Summary</h2>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <p className="text-gray-400 mb-1">Total Bill</p>
                    <p className="text-3xl font-bold text-white">${billSummary.totalBill.toFixed(2)}</p>
                  </div>
                  <Button onClick={() => handleSettleUp(billSummary.youOwe, "friends")} className="bg-purple-600 hover:bg-purple-700">
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

        </TabsContent>
      </div>
    )
}

export default DashboardContent;