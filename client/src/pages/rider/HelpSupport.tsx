import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Mail,
  FileText,
  ChevronRight,
} from "lucide-react";

export default function HelpSupport() {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I track a bus?",
      answer:
        'Select a bus from the main dashboard, then tap "View Stops" to see the route and track the bus in real-time.',
    },
    {
      question: "How accurate is the bus location?",
      answer:
        "Bus locations are updated in real-time using GPS. The location is typically accurate within 10-20 meters.",
    },
    {
      question: "Can I set reminders for bus arrivals?",
      answer:
        "Yes! You can set reminders to get notified when your bus is approaching your stop.",
    },
    {
      question: "What if I miss my bus?",
      answer:
        "You can track the next bus on the same route. Check the dashboard for other available buses.",
    },
    {
      question: "How do I change my profile information?",
      answer:
        "Go to Settings from the menu, then edit your name, phone number, or profile picture.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sticky top-0 z-10">
        <button
          title="Back"
          onClick={() => navigate(-1)}
          className="btn btn-icon"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-base font-semibold text-slate-900">
          Help &amp; Support
        </h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Contact Options */}
        <div className="card">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Get in Touch
          </h2>

          <div className="space-y-2">
            <a
              href="mailto:support@bustrack.com"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-gray-300 hover:bg-gray-100 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  Email Support
                </p>
                <p className="text-xs text-slate-500">support@bustrack.com</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </a>

            <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-gray-200 hover:bg-gray-100 transition-all text-left">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  Live Chat
                </p>
                <p className="text-xs text-slate-500">Available 24/7</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-5 h-5 text-gray-700" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group rounded-xl border border-slate-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none hover:bg-slate-50 transition-colors">
                  <p className="text-sm font-semibold text-slate-800 pr-4">
                    {faq.question}
                  </p>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="px-4 pb-4 pt-1 text-sm text-slate-500 leading-relaxed border-t border-slate-100">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="card">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Quick Links
          </h2>

          <div className="space-y-2">
            <button
              onClick={() => navigate("/privacy")}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-gray-300 hover:bg-gray-100 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
              <span className="flex-1 text-sm font-semibold text-slate-900">
                Privacy Policy
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

