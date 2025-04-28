import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { SecurityUtils } from '../utils/Security';
import Loading from '../components/Loading';
import { set } from 'zod';
import { UserContext } from './UserContext';
function AuthenticateUser({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await SecurityUtils.auth.isAuthenticated();
        
        // Check if authenticated is a proper object with required properties
        if (!authenticated || !authenticated.user_sub) {
          console.log("Auth failed or returned invalid data:", authenticated);
          navigate('/login');
          return;
        }
        
        // Check if is_confirmed is false
        if (authenticated.is_confirmed === false) {
          console.log("User not confirmed");
          navigate('/login');
          return;
        }
        
        // Valid authentication
        setUserData(authenticated);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Authentication error:", error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return <Loading/>;
  }
  
  return isAuthenticated && userData ? (
    <UserContext.Provider value={userData}>
      {children}
    </UserContext.Provider>
  ) : null;
}

AuthenticateUser.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthenticateUser;


/*
SAMPLE USEAGE:
  import React, { useState, useEffect } from 'react'
  import { useUser } from '../utils/UserContext'
  import AuthenticateUser from '../utils/AuthenticateUser';
  
  const Content = () => {
      const user = useUser()
      return (
          <div>
              <h1>Welcome, {user.username}</h1>
          </div>
      )
  }
  
  const Friends = () => {
      return (
          <AuthenticateUser>
              <Content />
          </AuthenticateUser> 
      )
  }
  
  export default Friends
*/