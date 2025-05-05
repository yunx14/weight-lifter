'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import DashboardAuthWrapper from '@/components/DashboardAuthWrapper';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, refreshSession } = useAuth();
  const [authDebug, setAuthDebug] = useState<string>('');
  
  const handleCheckSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setAuthDebug(`Error getting session: ${error.message}`);
        return;
      }
      
      if (data.session) {
        const expireDate = data.session.expires_at 
          ? new Date(data.session.expires_at * 1000).toLocaleString() 
          : 'unknown';
        
        setAuthDebug(
          `Session found!\n` +
          `User ID: ${data.session.user.id}\n` +
          `Email: ${data.session.user.email}\n` +
          `Expires: ${expireDate}\n` +
          `Token: ${data.session.access_token.substring(0, 15)}...`
        );
      } else {
        setAuthDebug('No session found. Try refreshing your session or logging in again.');
      }
    } catch (e) {
      setAuthDebug(`Unexpected error: ${e}`);
    }
  };

  const handleRefreshSession = async () => {
    try {
      setAuthDebug('Refreshing session...');
      await refreshSession();
      handleCheckSession();
    } catch (e) {
      setAuthDebug(`Error refreshing session: ${e}`);
    }
  };

  return (
    <DashboardAuthWrapper>
      <div className="flex min-h-screen flex-col">
        <Navigation />
        
        <div className="flex-grow p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>
            
            {/* User Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl mr-6">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{user?.email || 'Unknown User'}</h2>
                  <p className="text-gray-500">User ID: {user?.id ? user.id.substring(0, 8) + '...' : 'Not available'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium text-lg mb-2">Account Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium text-gray-700">Email:</span> {user?.email || 'Not available'}</p>
                  <p><span className="font-medium text-gray-700">Last Sign In:</span> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Not available'}</p>
                </div>
              </div>
            </div>
            
            {/* Authentication Debug */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
              
              <div className="flex space-x-4 mb-4">
                <button 
                  onClick={handleCheckSession} 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Check Session
                </button>
                <button 
                  onClick={handleRefreshSession} 
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Refresh Session
                </button>
              </div>
              
              {authDebug && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg overflow-auto max-h-48">
                  <pre className="whitespace-pre-wrap">{authDebug}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardAuthWrapper>
  );
} 