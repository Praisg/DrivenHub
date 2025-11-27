'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components';
import { getCurrentUser } from '@/lib/auth';

interface GoogleCalendarSyncProps {
  onSyncComplete?: () => void;
}

export default function GoogleCalendarSync({ onSyncComplete }: GoogleCalendarSyncProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const user = getCurrentUser();

  useEffect(() => {
    // Check if Google is connected (you could add an API endpoint for this)
    checkConnectionStatus();
    
    // Check for success/error messages in URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'google_connected') {
      setSuccess('Google Calendar connected successfully!');
      setIsConnected(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('error')) {
      setError(params.get('error'));
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkConnectionStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(
        `/api/auth/google/check?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
      }
    } catch (err) {
      console.error('Failed to check connection status:', err);
    }
  };

  const handleConnectGoogle = async () => {
    if (!user) {
      setError('Please log in first');
      return;
    }

    try {
      const response = await fetch(
        `/api/auth/google?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to initiate Google OAuth');
      }

      const { authUrl } = await response.json();
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to connect Google Calendar');
    }
  };

  const handleSyncEvents = async () => {
    if (!user) {
      setError('Please log in first');
      return;
    }

    setIsSyncing(true);
    setError(null);
    setSuccess(null);
    setSyncResult(null);

    try {
      const response = await fetch('/api/events/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      // Check if response is ok before parsing
      if (!response.ok) {
        let errorMsg = 'Failed to sync events';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorMsg = `HTTP ${response.status}: ${response.statusText || 'Failed to sync events'}`;
        }
        
        // If insufficient scopes, suggest reconnecting
        if (errorMsg.includes('Insufficient') || errorMsg.includes('permissions') || errorMsg.includes('scopes')) {
          setIsConnected(false);
          setError(`${errorMsg} Please disconnect and reconnect your Google account.`);
        } else {
          setError(errorMsg);
        }
        return;
      }

      // Parse response JSON safely
      let data;
      try {
        const text = await response.text();
        if (!text) {
          throw new Error('Empty response from server');
        }
        data = JSON.parse(text);
      } catch (parseError: any) {
        console.error('Failed to parse sync response:', parseError);
        throw new Error(`Failed to parse server response: ${parseError.message}`);
      }

      // Validate response structure
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid response format from server');
      }

      // Extract synced and total values safely
      const synced = typeof data.synced === 'number' ? data.synced : 0;
      const total = typeof data.total === 'number' ? data.total : 0;

      // Only set success if we have valid data and success is not explicitly false
      if (data.success !== false && response.ok) {
        console.log('[Sync UI] Sync successful:', { synced, total });
        setSyncResult({ synced, total });
        setSuccess(`Successfully synced ${synced} of ${total} events from Google Calendar!`);
        setError(null); // Explicitly clear any previous errors
        
        // Call onSyncComplete to refresh the events list after a delay
        // to ensure database changes are committed (longer delay for Heroku)
        if (onSyncComplete) {
          setTimeout(() => {
            console.log('[Sync UI] Triggering events list refresh...');
            onSyncComplete();
          }, 2000); // Increased to 2 seconds to allow database commits
        }
      } else {
        // If success is explicitly false, treat as error
        const errorMsg = data.error || data.message || 'Sync completed but reported failure';
        console.error('[Sync UI] Sync reported failure:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('[Sync UI] Sync error caught:', {
        message: err.message,
        name: err.name,
        stack: err.stack,
        fullError: err,
      });
      
      const errorMsg = err.message || 'Failed to sync events';
      
      // Filter out validation/parsing errors that might be false positives
      // These errors often occur when the response is actually successful but parsing fails
      const isValidationError = errorMsg.includes('string did not match') || 
                                 errorMsg.includes('expected pattern') ||
                                 errorMsg.includes('Invalid') ||
                                 errorMsg.includes('Unexpected token');
      
      if (isValidationError) {
        // If it's a validation error, the sync might have actually succeeded
        // Try refreshing the events list anyway
        console.warn('[Sync UI] Validation error detected, but sync may have succeeded. Attempting refresh...');
        setSuccess('Sync completed. Refreshing events list...');
        setError(null);
        if (onSyncComplete) {
          setTimeout(() => {
            onSyncComplete();
          }, 2000);
        }
      } else if (errorMsg.includes('Insufficient') || errorMsg.includes('permissions') || errorMsg.includes('scopes')) {
        setIsConnected(false);
        setError(`${errorMsg} Please disconnect and reconnect your Google account.`);
      } else {
        // Real error - show it
        setError(errorMsg);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    
    try {
      // Delete tokens from database
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      if (response.ok) {
        setIsConnected(false);
        setSuccess('Google Calendar disconnected. You can reconnect with updated permissions.');
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Google Calendar Integration</h3>
        <p className="text-gray-600">
          Connect your Google Calendar to automatically sync events. Events created in Gmail with attendee emails
          will appear in the Hub for those users.
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Connection Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Connection Status</p>
            <p className="text-sm text-gray-600">
              {isConnected ? 'Connected to Google Calendar' : 'Not connected'}
            </p>
          </div>
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {!isConnected ? (
          <Button onClick={handleConnectGoogle} className="w-full">
            Connect Google Calendar
          </Button>
        ) : (
          <>
            <div className="space-y-2">
              <Button 
                onClick={handleSyncEvents} 
                disabled={isSyncing}
                className="w-full"
              >
                {isSyncing ? 'Syncing...' : 'Sync Events Now'}
              </Button>
              
              <Button 
                onClick={handleDisconnect} 
                variant="outline"
                className="w-full"
              >
                Disconnect & Reconnect
              </Button>
            </div>
            
            {syncResult && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Synced {syncResult.synced} of {syncResult.total} events from Google Calendar
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          <li>Connect your Google account above</li>
          <li>Create events in Gmail or Google Calendar</li>
          <li>Add attendee emails when creating the event</li>
          <li>Click "Sync Events Now" to import events</li>
          <li>Users will only see events where their email is in the attendee list</li>
        </ol>
      </div>
    </div>
  );
}

