import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Check, CreditCard, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
      email: "", 
      password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          [name]: value
      }));
      setError("");
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setError("");

      if (!formData.email.trim()) {
          setError("Email is required");
          setIsLoading(false);
          return;
      }

      if (!formData.password) {
          setError("Password is required");
          setIsLoading(false);
          return;
      }

      try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login/`, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
              },
              body: JSON.stringify({
                  email: formData.email.trim(),
                  password: formData.password,
                  remember_me: rememberMe,
              }),
          });

          const data = await response.json();

            if (response.ok) {
                console.log("Login successful:", data);
                Cookies.set('username', data.username)
                // Refresh token - long lived (365 days)
                Cookies.set('refreshToken', data.refresh_token, {
                    expires: 365,
                    secure: true,
                    sameSite: 'strict',
                    path: '/'
                });
                
                // ID token - short lived (1 hour)
                Cookies.set('idToken', data.id_token, {
                    expires: 365, // THIS EXPIRES IN ONE HOUR, I set it 365 as backend just needs it to decode username
                    secure: true,
                    sameSite: 'strict',
                    path: '/'
                });
                
                // Access token - short lived (1 hour)
                Cookies.set('accessToken', data.access_token, {
                    expires: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour in milliseconds
                    secure: true,
                    sameSite: 'strict',
                    path: '/'
                });

              navigate('/dashboard');
          } else {
              setError(data.message || "Login failed. Please check your credentials.");
          }
      } catch (err) {
          console.error("Network error:", err);
          setError("Cannot connect to server. Please try again.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleSocialLogin = (provider) => {
    setIsLoading(true);
    setError("");
    // Note: Replace this with actual OAuth implementation
    console.log(`Logging in with ${provider}`);
    
    setTimeout(() => {
      setError(`${provider} login is not implemented yet.`);
      setIsLoading(false);
    }, 1000);
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
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
          {/* Login Form */}
          <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md mx-auto">
            <form onSubmit={handleSubmit}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                <CardDescription className="text-gray-400">Enter your credentials to access your account</CardDescription>
                {error && (
                  <div className="mt-2 p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm rounded-md">
                    {error}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-start"> 
                    <label
                      htmlFor="email"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Email
                    </label>
                  </div>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Password
                    </label>
                    <Link to="/forgot" className="text-sm text-purple-400 hover:text-purple-300">
                      Forgot password?
                    </Link>
                  </div>
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
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-purple-600"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-400">
                    Remember me
                  </label>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
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
                    onClick={() => handleSocialLogin('Google')}
                    disabled={isLoading}
                  >
                    Google
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                    onClick={() => handleSocialLogin('Apple')}
                    disabled={isLoading}
                  >
                    Apple
                  </Button>
                </div>
              </CardContent>
            </form>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm text-gray-400">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="text-purple-400 hover:text-purple-300">
                  Sign up
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
                    <Check className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold">Secure Payments</h3>
                  <p className="text-gray-400">
                    Your transactions are protected with enterprise-grade security and encryption.
                  </p>
                  <ul className="space-y-2 pt-2">
                    {["End-to-end encryption", "Two-factor authentication", "Fraud protection"].map((item, i) => (
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
              <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

