import React from 'react'
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function ProtectedRoute({ children }) {

    const token = localStorage.getItem('token');
    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000; // Convert to seconds

            // Check if token is expired
            if (decodedToken.exp > currentTime) {
                return children; // Token is valid, render children
            } else {
                localStorage.removeItem('token'); // Token expired, remove it
            } 
        } catch (error) {
            console.error('Error decoding token:', error);
        }
    }
  return <Navigate to="/login" />; // Redirect to login if no valid token
}

export default ProtectedRoute