'use client';

import { useState } from 'react';
import { isValidEmail, storeEmail } from '@/lib/email';
import Button from './Button';

export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidEmail(email)) {
      setStatus('error');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const success = storeEmail(email);
    
    if (success) {
      setStatus('success');
      setEmail('');
    } else {
      setStatus('error');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="bg-blue-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Stay Updated
      </h3>
      <p className="text-gray-600 mb-4">
        Get notified about new events, resources, and announcements.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <Button
          type="submit"
          disabled={isSubmitting || !email}
          className="w-full"
        >
          {isSubmitting ? 'Subscribing...' : 'Subscribe'}
        </Button>
        
        {status === 'success' && (
          <p className="text-sm" style={{ color: '#7EA25A' }}>
            Thanks! You&apos;re now subscribed to updates.
          </p>
        )}
        
        {status === 'error' && (
          <p className="text-red-600 text-sm">
            {email && !isValidEmail(email) 
              ? 'Please enter a valid email address.' 
              : 'This email is already subscribed or there was an error.'}
          </p>
        )}
      </form>
    </div>
  );
}
