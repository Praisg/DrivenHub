'use client';

import MemberLayout from '@/components/layouts/MemberLayout';
import { Button } from '@/components';

export default function MemberResourcesPage() {
  const slackUrl = 'https://app.slack.com/client/T06GCESFL82/C09CQ8PU86B';

  return (
    <MemberLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Resources</h1>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              This is where you'll find valuable video recordings, podcasts, documents, and downloads when they are posted.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              For now, please visit our Slack community to access shared resources and updates.
            </p>
            
            <div className="text-center">
              <Button
                href={slackUrl}
                className="px-8 py-3 text-lg"
              >
                Go to Slack
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
