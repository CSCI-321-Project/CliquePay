import { ArrowRight, Users, Receipt, Wallet, CreditCard, Sparkles, ChevronRight, Menu, X } from "lucide-react";
import { FeatureCard } from '../components/FeatureCard';
import { Metric } from '../components/Metric';
import { useNavigate } from 'react-router-dom';
import logo from '/images/CliquePay Logo.png';
import { useState } from "react";
import '../App.css';

export default function CliquePay() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Features', path: '/' },
    { name: 'Pricing', path: '/' },
    { name: 'About', path: '/' },
    { name: 'Contact', path: '/' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-yellow-400 to-yellow-500">
      {/* Navigation */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4">
        <nav className="max-w-7xl mx-auto">
          <div className="bg-white/70 backdrop-blur-md rounded-4xl shadow-lg">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <img 
                    src={logo} 
                    alt="CliquePay Logo" 
                    className="h-12 w-auto cursor-pointer"
                    onClick={() => navigate('/')}
                  />
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-8">
                  {navLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.path}
                      className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      {link.name}
                    </a>
                  ))}
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-100"
                  >
                    {isMenuOpen ? (
                      <X className="block h-6 w-6" />
                    ) : (
                      <Menu className="block h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
              <div className="md:hidden border-t border-gray-100">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.path}
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md"
                    >
                      {link.name}
                    </a>
                  ))}
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/download')}
                    className="w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md"
                  >
                    Download App
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-pink-600 text-transparent bg-clip-text">
              Split Bills, Keep Friends
            </h1>
            <p className="text-xl max-w-2xl mx-auto mb-8 text-gray-800">
              No more awkward money talks. CliquePay makes group expenses simple, fair, and fun. Perfect for dinners,
              trips, or any shared expenses!
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center mx-auto"
            >
              Start Splitting Bills <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <FeatureCard
              icon={<Users className="h-8 w-8 text-green-600" />}
              title="Group Expenses"
              description="Create groups for roommates, trips, or events. Track shared expenses effortlessly."
            />
            <FeatureCard
              icon={<Receipt className="h-8 w-8 text-pink-600" />}
              title="Smart Splitting"
              description="Split bills equally or customize amounts. Our smart calculator handles the math."
            />
            <FeatureCard
              icon={<Wallet className="h-8 w-8 text-yellow-600" />}
              title="Instant Settlements"
              description="Send and receive payments instantly. No more waiting for bank transfers."
            />
          </div>

          {/* Social Proof */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Trusted by Friend Groups Everywhere</h2>
              <div className="flex justify-center gap-8 items-center">
                <Metric number="1M+" label="Active Users" />
                <Metric number="50M+" label="Bills Split" />
                <Metric number="4.9" label="App Rating" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CTA Section */}
      <div className="bg-green-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to Make Bill-Splitting Stress-Free?</h2>
          <p className="text-xl mb-8">Join millions of users who trust CliquePay for their group expenses</p>
          <div className="flex justify-center gap-4">
            <button className="bg-white text-green-600 hover:bg-green-50 px-6 py-3 rounded-lg flex items-center font-semibold">
              <CreditCard className="mr-2 h-5 w-5" />
              Download iOS App
            </button>
            <button className="bg-white text-green-600 hover:bg-green-50 px-6 py-3 rounded-lg flex items-center font-semibold">
              <Sparkles className="mr-2 h-5 w-5" />
              Download Android App
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/90 text-white py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} CliquePay. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

