
import { BarChart3, PieChart, LineChart } from "lucide-react";
import { TabsContent } from "../../components/ui/tabs";
const AnalyticsContent = () => {

    return (
        <TabsContent value="analytics">
        <div className="bg-zinc-800/50 border border-zinc-700/50 backdrop-blur-sm rounded-xl overflow-hidden">
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            {/* Construction Icon with Animation */}
            <div className="relative mb-6">
              <BarChart3 className="h-16 w-16 text-purple-400 opacity-50" />  
            </div>
            
            {/* Status Badge */}
            <div className="bg-purple-900/40 text-purple-300 px-3 py-1 rounded-full text-sm font-medium mb-4 flex items-center">
              <span className="inline-block h-2 w-2 rounded-full bg-purple-400 mr-2 animate-pulse"></span>
              In Development
            </div>
            
            {/* Title and Description */}
            <h3 className="text-xl font-bold text-white mb-2">Analytics Dashboard Coming Soon</h3>
            <p className="text-zinc-400 max-w-md mb-6">
              We're building powerful analytics tools to help you track spending patterns, 
              visualize expenses, and gain financial insights.
            </p>
            
            {/* Progress Bar */}
            <div className="w-full max-w-md h-2 bg-zinc-700/50 rounded-full overflow-hidden mb-2">
              <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full" style={{ width: '55%' }}></div>
            </div>
            <p className="text-zinc-500 text-sm">Approximately 55% complete</p>
            
            {/* Features Coming */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-left">
                <BarChart3 className="h-5 w-5 text-purple-400 mb-2" />
                <h4 className="text-white text-sm font-medium mb-1">Expense Tracking</h4>
                <p className="text-zinc-500 text-xs">Visualize your spending patterns over time</p>
              </div>
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-left">
                <PieChart className="h-5 w-5 text-purple-400 mb-2" />
                <h4 className="text-white text-sm font-medium mb-1">Category Insights</h4>
                <p className="text-zinc-500 text-xs">See where your money goes by category</p>
              </div>
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-left">
                <LineChart className="h-5 w-5 text-purple-400 mb-2" />
                <h4 className="text-white text-sm font-medium mb-1">Debt Forecasting</h4>
                <p className="text-zinc-500 text-xs">Predict when you'll be debt-free</p>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    )
}

export default AnalyticsContent;