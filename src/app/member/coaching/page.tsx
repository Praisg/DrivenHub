'use client';

import { useState } from 'react';
import MemberLayout from '@/components/layouts/MemberLayout';
import { Card, Button } from '@/components';
import { getCurrentUser } from '@/lib/auth';

export default function MemberCoachingPage() {
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [preferredDates, setPreferredDates] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!topic.trim()) {
      setError('Please tell us what you would like coaching on.');
      return;
    }

    const user = getCurrentUser();
    if (!user || !user.id) {
      setError('You must be logged in to submit a coaching request.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/member/coaching-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          topic: topic.trim(),
          details: details.trim() || null,
          preferredDates: preferredDates.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit coaching request');
      }

      setSuccess(true);
      setTopic('');
      setDetails('');
      setPreferredDates('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit coaching request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MemberLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Request Coaching</h1>
          <p className="text-lg text-gray-600">
            Fill out the form below to request a coaching session. Our team will follow up with you by email.
          </p>
        </div>

        {success && (
          <Card className="mb-6 p-6" style={{ backgroundColor: '#e1ebd9', borderColor: '#c3d7b3', borderWidth: '1px', borderStyle: 'solid' }}>
            <p className="text-gray-900" style={{ color: '#455933' }}>
              Your coaching request has been received. Our team will follow up with you by email.
            </p>
          </Card>
        )}

        {error && (
          <Card className="mb-6 p-6 bg-red-50 border border-red-200">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                What would you like coaching on? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Career transition, Leadership development, Work-life balance..."
                required
              />
            </div>

            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-2">
                Tell us a bit more (optional)
              </label>
              <textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional context or specific challenges you'd like to discuss..."
              />
            </div>

            <div>
              <label htmlFor="preferredDates" className="block text-sm font-medium text-gray-700 mb-2">
                Possible dates and times (optional)
              </label>
              <textarea
                id="preferredDates"
                value={preferredDates}
                onChange={(e) => setPreferredDates(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Weekday mornings, Tuesday afternoons, Any time next week..."
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading}
                className="px-8 py-2"
              >
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </MemberLayout>
  );
}
