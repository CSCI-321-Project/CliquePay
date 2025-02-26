import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';
import Button from '../components/button.tsx';
import logo from '/images/CliquePay Logo.png';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "", 
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
            const response = await fetch("/api/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
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

    return (
        <div className="min-h-screen flex flex-col justify-between bg-yellow-400">
            {/* Logo */}
            <div className="p-6 flex justify-center">
                <div 
                    onClick={() => navigate('/')} 
                    className="cursor-pointer hover:scale-105 transition-transform"
                >
                    <img 
                        src={logo} 
                        alt="CliquePay Logo" 
                        className="h-40 w-auto"
                    />
                </div>
            </div>

            {/* Login Box - Centered */}
            <div className="flex justify-center">
                <div className="bg-white p-8 shadow-lg rounded-md w-96">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-3xl font-semibold mb-4">User Login</p>
                        <div>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                disabled={isLoading}
                            />
                            <label className="flex items-center mt-2">
                                <input
                                    type="checkbox"
                                    checked={showPassword}
                                    onChange={() => setShowPassword(!showPassword)}
                                    className="mr-2"
                                    disabled={isLoading}
                                />
                                <span className="text-sm">Show Password</span>
                            </label>
                        </div>
                        
                        <Button 
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 rounded transition-colors" 
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Button>

                        <div className="text-center mt-4">
                            <p className="text-lg font-semibold mb-2">
                                <a 
                                    onClick={() => navigate('/signup')} 
                                    className="text-yellow-600 hover:text-yellow-800 cursor-pointer"
                                >
                                    Sign up
                                </a>
                            </p>
                            <p className="text-sm">
                                <a 
                                    onClick={() => navigate('/reset-password')} 
                                    className="text-yellow-600 hover:text-yellow-800 cursor-pointer"
                                >
                                    Forgot Password?
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-green-600 text-white text-center py-4 text-lg">
                © 2024 CliquePay. All rights reserved.
            </footer>
        </div>
    );
}

export default Login;
