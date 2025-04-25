import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

export const renewTokens = async () => {
    try {
        const accessToken = Cookies.get('accessToken');
        const idToken = Cookies.get('idToken');
        const refreshToken = Cookies.get('refreshToken');

        // Check if we have the minimum required tokens
        if (!refreshToken || !idToken) {
            console.log('Missing refresh or ID token');
            return false;
        }

        let needsRenewal = false;

        // Check if tokens need renewal
        if (accessToken) {
            try {
                const accessTokenDecoded = jwtDecode(accessToken);
                const idTokenDecoded = jwtDecode(idToken);
                const currentTime = Math.floor(Date.now() / 1000);
                
                // Renew if any token expires within 5 minutes
                needsRenewal = accessTokenDecoded.exp <= currentTime + 300 || 
                              idTokenDecoded.exp <= currentTime + 300;
            } catch (e) {
                console.log('Token decode error, attempting renewal:', e);
                needsRenewal = true;
            }
        } else {
            needsRenewal = true;
        }

        if (needsRenewal) {
            const response = await fetch('http://127.0.0.1:8000/api/renew/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    refresh_token: refreshToken,
                    id_token: idToken
                })
            });

            const data = await response.json();
            
            if (data.status === 'SUCCESS' && data.access_token && data.id_token) {
                // Store new tokens
                Cookies.set('accessToken', data.access_token, {
                    secure: true,
                    sameSite: 'Strict'
                });
                Cookies.set('idToken', data.id_token, {
                    secure: true,
                    sameSite: 'Strict'
                });
                return true;
            } else {
                console.error('Token renewal failed:', data.message);
                // Only clear tokens if renewal explicitly failed
                Cookies.remove('accessToken');
                Cookies.remove('idToken');
                Cookies.remove('refreshToken');
                return false;
            }
        }

        // If no renewal was needed, return true
        return true;
    } catch (error) {
        console.error('Token renewal error:', error);
        return false;
    }
};

