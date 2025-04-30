import { ArrowRight, CreditCard, Lock, Smartphone, Users, Zap } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { PageLayout, Header, Section, Footer } from "../components/layout/PageLayout";
import BillSplittingVisualization from "../components/designs/bill-splitting-visualization";

export default function Home() {
  const navigate = useNavigate();
  
  return (
    <PageLayout>
      {/* Header */}
      <Header>
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 w-8 h-8 rounded-md flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl">CliquePay</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="!text-white hover:!text-gray-300 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="!text-white hover:!text-gray-300 transition-colors">
            How it works
          </a>
          <a href="#pricing" className="!text-white hover:!text-gray-300 transition-colors">
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <Button 
            variant="highlight" 
            className="hidden md:inline-flex"
            onClick={() => navigate('/login')}
          >
            Log in
          </Button>
          <Button 
            variant="default"
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => navigate('/signup')}
          >
            Get Started
          </Button>
        </div>
      </Header>

      {/* Hero Section */}
      <Section className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-center relative">
          {/* Left column - Text content */}
          <div className="md:w-1/2 mb-6 md:mb-0">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Split bills with friends, effortlessly
            </h1>
            <p className="text-lg text-gray-400 mb-6 max-w-md mx-auto text-center">
              CliquePay makes it easy to split expenses, track debts, and settle up with friends and family.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="primary"
                className="bg-purple-600 hover:bg-purple-700 text-lg px-6 py-5"
                onClick={() => navigate('/signup')}
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                className="text-lg px-6 py-5"
                onClick={() => {
                  document.getElementById('features').scrollIntoView({
                    behavior: 'smooth'
                  });
                }}
              >
                Learn More
              </Button>
            </div>
          </div>
          
          {/* Empty placeholder to maintain layout */}
          <div className="md:w-1/2"></div>
          
          {/* Absolutely positioned visualizer overlay */}
          <div className="absolute top-0 right-0 md:right-0 w-full md:w-1/2 h-full flex items-center justify-center pointer-events-none">
            <div className="w-8/12 md:w-7/12 relative z-10">
              <BillSplittingVisualization />
            </div>
            <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -top-6 -left-6 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </Section>

      {/* Features Section */}
      <Section id="features" className="bg-zinc-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose CliquePay</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our platform is designed to make financial interactions between friends simple and stress-free.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <div className="bg-purple-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-purple-400" />
              </div>
              <CardTitle>Group Expenses</CardTitle>
              <CardDescription className="text-gray-400">
                Create groups for trips, roommates, or events to track shared expenses.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <div className="bg-purple-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-purple-400" />
              </div>
              <CardTitle>Instant Settlements</CardTitle>
              <CardDescription className="text-gray-400">
                Transfer money instantly between friends with zero fees.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <div className="bg-purple-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="text-purple-400" />
              </div>
              <CardTitle>User Friendly</CardTitle>
              <CardDescription className="text-gray-400">
                Intuitive design makes managing expenses simple for everyone in your group.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <div className="bg-purple-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Lock className="text-purple-400" />
              </div>
              <CardTitle>Secure Transactions</CardTitle>
              <CardDescription className="text-gray-400">
                Bank-level security ensures your financial data stays protected.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-zinc-800 border-zinc-700 md:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle>Smart Expense Tracking</CardTitle>
              <CardDescription className="text-gray-400">
                Automatically calculate who owes what and simplify complex group expenses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-700">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-400">Group Trip to Miami</div>
                  <div className="text-sm text-purple-400">$1,240 total</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-zinc-700 rounded-full overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=80&h=80&q=80" 
                          alt="Alex" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>Alex</span>
                    </div>
                    <span className="text-green-400">+$320</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-zinc-700 rounded-full overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=80&h=80&q=80" 
                          alt="Taylor" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>Taylor</span>
                    </div>
                    <span className="text-red-400">-$180</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div class="w-8 h-8 bg-zinc-700 rounded-full overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=80&h=80&q=80" 
                          alt="Jordan" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>Jordan</span>
                    </div>
                    <span className="text-red-400">-$140</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* How It Works */}
      <Section id="how-it-works" className="bg-black">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How CliquePay Works</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Three simple steps to never worry about &quot;who owes what&quot; again.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-purple-400">1</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Create a Group</h3>
            <p className="text-gray-400">
              Start by creating a group and inviting your friends to join using their email or phone number.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-purple-400">2</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Add Expenses</h3>
            <p className="text-gray-400">
              Log expenses as they happen. Split evenly or customize amounts for each person.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-purple-400">3</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Settle Up</h3>
            <p className="text-gray-400">
              When it&apos;s time to pay up, CliquePay calculates the simplest way to settle all debts.
            </p>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="bg-gradient-to-b from-black to-purple-950">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to simplify group expenses?</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of users who have made splitting bills stress-free with CliquePay.
          </p>
          <Button 
            variant="primary"
            className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6"
            onClick={() => navigate('/signup')}
          >
            Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="mt-4 text-gray-400">No credit card required</p>
        </div>
      </Section>

      {/* Footer */}
      <Footer className="bg-zinc-950">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center gap-2 mb-6 md:mb-0">
            <div className="bg-purple-600 w-8 h-8 rounded-md flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl">CliquePay</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              About
            </a>
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Support
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Terms
            </a>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-8 text-center text-gray-500">
          <p className="mb-3">© {new Date().getFullYear()} CliquePay. All rights reserved.</p>
          <p className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-gray-400" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            <a 
              href="https://github.com/CSCI-321-Project/CliquePay" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-purple-400 transition-colors"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </Footer>
    </PageLayout>
  );
}

