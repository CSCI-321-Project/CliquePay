import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from '../components/button.tsx';
import logo from '/images/CliquePay Logo.png';
import { SecurityUtils } from '../utils/security.js'; // Add this import
import "../App.css";

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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!navigator.cookieEnabled) {
      setError("Cookies are disabled. Please enable cookies to sign up.");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sanitize input before setting state
    const sanitizedValue = SecurityUtils.sanitizeInput(value);
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

    // Validate username
    const usernameError = SecurityUtils.validateUsername(formData.username.trim());
    if (usernameError) {
      setError(usernameError);
      setIsLoading(false);
      return;
    }

    // Validate email
    if (!SecurityUtils.validateEmail(formData.email.trim())) {
      setError("Invalid email address");
      setIsLoading(false);
      return;
    }

    // Validate password
    const passwordError = SecurityUtils.validatePassword(formData.password);
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
    if (formData.phoneNumber.trim() && !SecurityUtils.validatePhoneNumber(formData.phoneNumber.trim())) {
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
      const response = await fetch("/api/signup/", {
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
          // Use SecurityUtils for cookie operations
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-yellow-400 to-yellow-500 px-4 py-6">
      {/* Add Logo */}
      <div className="absolute top-6 left-6">
        <div 
          onClick={() => navigate('/')} 
          className="cursor-pointer hover:scale-105 transition-transform"
        >
          <img 
            src={logo} 
            alt="CliquePay Logo" 
            className="h-28 w-auto"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center relative">
          <h2 className="text-3xl font-bold mb-4">Create an Account</h2>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-2 mb-4 text-left text-sm">
              <p className="text-red-700 text-sm leading-tight">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={isLoading}
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={isLoading}
            />
            <input
              type="text"
              name="fullname"
              placeholder="Full Name"
              value={formData.fullname}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={isLoading}
            />
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number (optional)"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={isLoading}
            />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={isLoading}
            />
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
              disabled={isLoading}
            />
            <label className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="mr-2"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-600">Show Password</span>
            </label>
            <Button 
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all font-semibold w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </form>
          <p className="mt-4 text-gray-600 text-lg">
            Already have an account? {" "}
            <a 
              onClick={() => navigate('/login')} 
              className="text-yellow-600 hover:text-yellow-800 cursor-pointer transition-colors"
            >
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}