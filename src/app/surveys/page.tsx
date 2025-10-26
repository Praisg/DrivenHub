import { EmbeddedFrame } from '@/components';

export default function SurveysPage() {
  const googleFormUrl = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Member Surveys</h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {googleFormUrl ? (
            <EmbeddedFrame
              src={googleFormUrl}
              title="Member Feedback Survey"
              fallbackUrl={googleFormUrl}
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Survey Not Available
              </h3>
              <p className="text-gray-600 mb-4">
                Google Form integration is not configured. Please contact support.
              </p>
              <a
                href="mailto:support@lab.com"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Feedback Matters
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-semibold">✓</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Quick & Easy</h4>
                  <p className="text-sm text-gray-600">Takes just 2-3 minutes to complete</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-semibold">✓</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Anonymous</h4>
                  <p className="text-sm text-gray-600">Your responses are completely private</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-semibold">✓</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Makes a Difference</h4>
                  <p className="text-sm text-gray-600">We use feedback to improve everything</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Having Trouble?
            </h3>
            <p className="text-blue-800 text-sm mb-4">
              If the embedded form isn&apos;t working, you can open it in a new tab.
            </p>
            {googleFormUrl && (
              <a
                href={googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Open in New Tab
              </a>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What We Ask About
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your overall experience</li>
              <li>• What&apos;s working well</li>
              <li>• Areas for improvement</li>
              <li>• Feature requests</li>
              <li>• Event feedback</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-12 bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Thank You for Your Feedback!
        </h3>
        <p className="text-green-800">
          We read every response and use your input to make the LAB Member Hub better. 
          Your voice helps shape everything we do.
        </p>
      </div>
    </div>
  );
}
