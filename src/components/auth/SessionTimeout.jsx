import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/Button';

export default function SessionTimeout() {
  const { sessionTimeout, logout } = useAuth();
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionTimeout) {
      setShow(true);
      
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sessionTimeout, logout]);

  const handleExtendSession = async () => {
    // Refresh the token to extend session
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        // The axios interceptor will handle token refresh
        setShow(false);
        setCountdown(300);
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  };

  if (!show) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Session Expiring Soon
            </h3>
            <p className="text-gray-600 mb-4">
              Your session will expire in{' '}
              <span className="font-semibold text-red-600">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
              . You will be automatically logged out.
            </p>
            
            <div className="flex gap-3">
              <Button onClick={handleExtendSession} className="flex-1">
                Stay Logged In
              </Button>
              <Button variant="outline" onClick={logout} className="flex-1">
                Logout Now
              </Button>
            </div>
          </div>

          <button
            onClick={() => setShow(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

