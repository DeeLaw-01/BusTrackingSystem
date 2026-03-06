import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Shield,
      title: "Data Collection",
      content:
        "We collect information necessary to provide our bus tracking services, including your name, email address, phone number, and location data when you use the app.",
    },
    {
      icon: Lock,
      title: "Data Security",
      content:
        "Your personal information is encrypted and stored securely. We use industry-standard security measures to protect your data from unauthorized access.",
    },
    {
      icon: Eye,
      title: "Location Data",
      content:
        "We only collect your location data when you actively use the app to track buses. This data is used solely to provide accurate bus tracking and is not shared with third parties.",
    },
    {
      icon: FileText,
      title: "Your Rights",
      content:
        "You have the right to access, update, or delete your personal information at any time through your account settings. You can also opt out of location tracking in your device settings.",
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
          Privacy Policy
        </h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Introduction */}
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Privacy Policy
            </h2>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            At BusTrack, we are committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, and safeguard your
            personal information when you use our bus tracking application.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {sections.map((section, index) => (
            <div key={index} className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <section.icon className="w-4 h-4 text-gray-700" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {section.title}
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="card bg-gray-100 border-gray-200">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Questions About Privacy?
          </h3>
          <p className="text-sm text-slate-600 mb-2">
            If you have any questions about this Privacy Policy or our data
            practices, please contact us at:
          </p>
          <a
            href="mailto:privacy@bustrack.com"
            className="text-sm font-semibold text-gray-700 hover:text-gray-700"
          >
            privacy@bustrack.com
          </a>
        </div>
      </div>
    </div>
  );
}

