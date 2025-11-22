'use client';

import AdminLayout from '@/components/layouts/AdminLayout';
import { EmbeddedFrame } from '@/components';

export default function AdminSurveysPage() {
  const googleFormUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Surveys Management</h1>
          <p className="text-gray-600">Manage and view survey responses</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {googleFormUrl ? (
              <EmbeddedFrame
                src={googleFormUrl}
                title="Survey Management"
                fallbackUrl={googleFormUrl}
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Survey Not Configured
                </h3>
                <p className="text-gray-600 mb-4">
                  Google Form integration is not configured. Please set NEXT_PUBLIC_GOOGLE_FORM_URL in your environment variables.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Survey Management
              </h3>
              <p className="text-sm text-gray-600">
                View and manage survey responses from members. Use Google Forms to collect feedback and track responses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

