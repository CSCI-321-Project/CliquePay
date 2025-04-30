import { useState, useEffect } from 'react';
import { Link, Meta, useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Check, Users, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { SecurityUtils } from '../utils/Security.js';

export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullname: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  useEffect(() => {
    if (!navigator.cookieEnabled) {
      setError("Cookies are disabled. Please enable cookies to sign up.");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sanitize input before setting state
    const sanitizedValue = name === 'password' || name === 'confirmPassword' 
      ? value 
      : (SecurityUtils?.sanitizeInput ? SecurityUtils.sanitizeInput(value) : value);
      
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Check terms agreement
    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      setIsLoading(false);
      return;
    }

    // Validate username
    if (!formData.username.trim()) {
      setError("Username is required");
      setIsLoading(false);
      return;
    }
    
    const usernameError = SecurityUtils?.validateUsername ? 
      SecurityUtils.validateUsername(formData.username.trim()) : null;
    if (usernameError) {
      setError(usernameError);
      setIsLoading(false);
      return;
    }

    // Validate email
    if (!formData.email.trim()) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }
    
    if (SecurityUtils?.validateEmail && !SecurityUtils.validateEmail(formData.email.trim())) {
      setError("Invalid email address");
      setIsLoading(false);
      return;
    }

    // Validate password
    if (!formData.password) {
      setError("Password is required");
      setIsLoading(false);
      return;
    }
    
    const passwordError = SecurityUtils?.validatePassword ? 
      SecurityUtils.validatePassword(formData.password) : null;
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate phone number if provided
    if (formData.phoneNumber.trim() && 
        SecurityUtils?.validatePhoneNumber && 
        !SecurityUtils.validatePhoneNumber(formData.phoneNumber.trim())) {
      setError("Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.");
      setIsLoading(false);
      return;
    }

    const requestBody = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      fullname: formData.fullname.trim(),
      password: formData.password,
      phone_number: formData.phoneNumber.trim() || null,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        try {
          // Set cookie for username
          if (SecurityUtils?.setCookie) {
            SecurityUtils.setCookie('username', formData.username, {
              expires: 365,
              path: '/',
              sameSite: 'Strict',
              secure: window.location.protocol === 'https:'
            });
            
            const storedUsername = SecurityUtils.getCookie('username');
            if (!storedUsername) {
              throw new Error('Failed to store username');
            }
          } else {
            // Fallback if SecurityUtils is not available
            document.cookie = `username=${encodeURIComponent(formData.username)}; max-age=${60*60*24*365}; path=/; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`;
          }

          setTimeout(() => {
            navigate('/verify');
          }, 100);
        } catch (storageError) {
          console.error('Storage error:', storageError);
          setError('Failed to store user data. Please check your browser settings.');
          setIsLoading(false);
        }
      } else {
        if (response.status === 400) {
          setError(data.message || "Please check your input data");
        } else if (response.status === 409) {
          setError("Username or email already exists");
        } else {
          setError(data.message || "Registration failed");
        }
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Cannot connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-purple-600 w-8 h-8 rounded-md flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl">CliquePay</span>
          </div>
          <Link to="/" className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
          {/* Signup Form */}
          <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md mx-auto">
            <form onSubmit={handleSubmit}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                <CardDescription className="text-gray-400">
                  Enter your information to get started with CliquePay
                </CardDescription>
                {error && (
                  <div className="p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm rounded-md">
                    {error}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Username */}
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium leading-none">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="fullname" className="text-sm font-medium leading-none">
                    Full Name
                  </label>
                  <input
                    id="fullname"
                    name="fullname"
                    type="text"
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="John Doe"
                    value={formData.fullname}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Phone Number (optional) */}
                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="text-sm font-medium leading-none flex items-center justify-between">
                    <span>Phone Number</span>
                    <span className="text-xs text-gray-500">Optional</span>
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium leading-none">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters with a number and special character
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="h-4 w-4 mt-1 rounded border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-purple-600"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-400">
                    I agree to the{" "}
                    <Link to="/terms" className="text-purple-400 hover:text-purple-300">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-purple-400 hover:text-purple-300">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-900 px-2 text-zinc-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                    disabled={isLoading}
                  >
                    Google
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                    disabled={isLoading}
                  >
                    Apple
                  </Button>
                </div>
              </CardContent>
            </form>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="text-purple-400 hover:text-purple-300">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Right Side Content */}
          <div className="hidden md:flex flex-col justify-center items-center">
            <div className="relative w-full max-w-md aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-purple-600/20 rounded-2xl"></div>
              <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl"></div>
              <div className="absolute -top-6 -left-6 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl"></div>
              <div className="relative h-full w-full p-8 flex flex-col justify-center">
                <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 space-y-4">
                  <div className="bg-purple-600/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold">Join thousands of users</h3>
                  <p className="text-gray-400">CliquePay makes it easy to split expenses with friends and family.</p>
                  <ul className="space-y-2 pt-2">
                    {[
                      "Split bills effortlessly",
                      "Track group expenses",
                      "Settle debts instantly",
                      "No more awkward money talks",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="h-4 w-4 text-purple-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} CliquePay. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/help" className="text-sm text-gray-400 hover:text-white transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}