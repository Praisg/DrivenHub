import { EmbeddedFrame, Accordion } from '@/components';

export default function CoachingPage() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

  const faqs = [
    {
      question: "What should I expect from a coaching session?",
      answer: "Our coaching sessions are 30-minute focused conversations where we dive deep into your specific challenges. We&apos;ll help you clarify goals, overcome obstacles, and create actionable next steps. Come prepared with questions or specific areas you&apos;d like to work on."
    },
    {
      question: "Do I need a Calendly account?",
      answer: "No! Scheduling uses Calendly behind the scenes, but you don&apos;t need an account. Just pick a time that works for you, fill out the brief form, and you&apos;ll receive a calendar invite with all the details."
    },
    {
      question: "What if I need to reschedule?",
      answer: "You can reschedule or cancel your session directly from the calendar invite you receive. We ask for at least 24 hours notice when possible, but we understand that life happens."
    },
    {
      question: "What topics can we cover?",
      answer: "We can help with goal setting, productivity systems, career transitions, leadership challenges, work-life balance, and more. If you&apos;re not sure if your topic is a good fit, just book a session and we&apos;ll figure it out together."
    },
    {
      question: "How often should I book sessions?",
      answer: "It depends on your needs! Some members book weekly sessions for ongoing support, others book monthly check-ins, and some book sessions as needed when specific challenges arise. There's no right or wrong frequency."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Book Coaching</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {calendlyUrl ? (
            <EmbeddedFrame
              src={calendlyUrl}
              title="Schedule Your Coaching Session"
              fallbackUrl={calendlyUrl}
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Coaching Scheduling
              </h3>
              <p className="text-gray-600 mb-4">
                Calendly integration is not configured. Please contact support.
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
              What to Expect
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Pick Your Time</h4>
                  <p className="text-sm text-gray-600">Choose from available 30-minute slots</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Fill Out Form</h4>
                  <p className="text-sm text-gray-600">Tell us what you&apos;d like to work on</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Get Calendar Invite</h4>
                  <p className="text-sm text-gray-600">We&apos;ll send you all the details</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Join Session</h4>
                  <p className="text-sm text-gray-600">Connect via Zoom or phone</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Scheduling Made Simple
            </h3>
            <p className="text-blue-800 text-sm">
              Scheduling uses Calendly behind the scenes; you don&apos;t need an account. 
              Just pick a time and we&apos;ll handle the rest.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Accordion key={index} title={faq.question}>
              <p>{faq.answer}</p>
            </Accordion>
          ))}
        </div>
      </div>
    </div>
  );
}
