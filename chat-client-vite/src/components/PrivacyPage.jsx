import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Privacy Policy Page Component
 * Renders the privacy policy content
 */
export function PrivacyPage() {
  return (
    <div className="h-dvh bg-gray-50 overflow-y-auto pt-nav-mobile pb-nav-mobile">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="text-teal-dark text-2xl font-bold hover:opacity-80 transition-opacity"
            >
              LiaiZen
            </Link>
            <Link to="/" className="text-gray-600 hover:text-teal-dark transition-colors">
              ← Back to App
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">
            Last updated: <span>January 2025</span>
          </p>
          {/* Privacy page route configured in App.jsx */}
        </header>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 mb-8">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to LiaiZen ("we," "our," or "us"). We are committed to protecting your privacy
              and ensuring you have a positive experience while using our co-parenting communication
              platform. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you use our service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using LiaiZen, you agree to the collection and use of information in accordance
              with this policy. If you do not agree with our policies and practices, please do not
              use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Account Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Username</li>
              <li>Email address (optional)</li>
              <li>Password (encrypted and never stored in plain text)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Profile Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may choose to provide additional information in your profile:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>First and last name</li>
              <li>Address</li>
              <li>Household members</li>
              <li>Occupation</li>
              <li>Communication style and preferences</li>
              <li>Communication goals and triggers</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Communication Data</h3>
            <p className="text-gray-700 leading-relaxed mb-4">We collect and store:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Messages you send and receive through the platform</li>
              <li>Timestamp and metadata for all messages</li>
              <li>Room membership and connection information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.4 Context Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To provide AI-mediated communication assistance, you may provide:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Co-parent's name</li>
              <li>Separation date</li>
              <li>Children's information (names, ages)</li>
              <li>Concerns and challenges</li>
              <li>Contact information for relevant parties</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.5 Technical Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We automatically collect certain technical information:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Usage patterns and activity logs</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>
                <strong>Service Delivery:</strong> To provide, maintain, and improve our
                communication platform
              </li>
              <li>
                <strong>AI Mediation:</strong> To analyze messages and provide communication
                suggestions, tips, and rewrites using artificial intelligence
              </li>
              <li>
                <strong>Authentication:</strong> To verify your identity and manage your account
              </li>
              <li>
                <strong>Communication:</strong> To facilitate messaging between you and your
                co-parent or other authorized contacts
              </li>
              <li>
                <strong>Support:</strong> To respond to your inquiries and provide customer support
              </li>
              <li>
                <strong>Safety:</strong> To detect, prevent, and address technical issues, fraud, or
                abuse
              </li>
              <li>
                <strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and
                legal processes
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. AI Processing and Third-Party Services
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 OpenAI Integration</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use OpenAI's GPT-3.5-turbo model to analyze messages and provide AI-mediated
              communication assistance. When messages are processed:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Message content is sent to OpenAI for analysis</li>
              <li>OpenAI's privacy policy applies to data sent to their services</li>
              <li>
                We do not store your messages on OpenAI's servers beyond what is necessary for
                processing
              </li>
              <li>AI suggestions are optional and you can choose to ignore them</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              For more information about OpenAI's data practices, please visit:{' '}
              <a
                href="https://openai.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-medium hover:underline"
              >
                https://openai.com/privacy
              </a>
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Email Service</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you choose to send invitations via email, we use email services (such as Gmail via
              OAuth) to send messages. Your email address and recipient email addresses are
              processed through these services in accordance with their privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Storage and Security</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Data Storage</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your data is stored securely using:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Encrypted databases on secure servers</li>
              <li>Password hashing using industry-standard bcrypt encryption</li>
              <li>Secure HTTPS connections for all data transmission</li>
              <li>Regular security updates and monitoring</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Data Retention</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain your information for as long as your account is active or as needed to
              provide services. If you delete your account, we will delete or anonymize your
              personal information within 30 days, except where we are required to retain it for
              legal purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Local Storage</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and browser local storage to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Maintain your login session (httpOnly cookies for security)</li>
              <li>Remember your preferences</li>
              <li>Improve user experience</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              You can control cookies through your browser settings, though disabling cookies may
              affect the functionality of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>
                <strong>Access:</strong> Request access to your personal information
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and associated data
              </li>
              <li>
                <strong>Export:</strong> Request a copy of your data in a portable format
              </li>
              <li>
                <strong>Opt-Out:</strong> Disable AI mediation features (though this may limit
                platform functionality)
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              To exercise these rights, please contact us using the information provided in the
              "Contact Us" section below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Data Sharing and Disclosure
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information only in the
              following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>
                <strong>With Your Consent:</strong> When you explicitly authorize sharing (e.g.,
                connecting with a co-parent)
              </li>
              <li>
                <strong>Service Providers:</strong> With third-party services that help us operate
                the platform (e.g., OpenAI for AI features)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law, court order, or
                government regulation
              </li>
              <li>
                <strong>Safety:</strong> To protect the rights, property, or safety of users or
                others
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              LiaiZen is designed for adult co-parents. We do not knowingly collect personal
              information from children under 13. If you believe we have collected information from
              a child under 13, please contact us immediately so we can delete it.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              While you may provide information about your children in your profile or context
              settings, this information is stored securely and is only used to provide personalized
              communication assistance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. International Data Transfers
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your information may be transferred to and processed in countries other than your
              country of residence. These countries may have data protection laws that differ from
              your country. By using our service, you consent to the transfer of your information to
              these countries.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
              You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please
              contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700">
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:privacy@coparentliaizen.com"
                  className="text-teal-medium hover:underline"
                >
                  privacy@coparentliaizen.com
                </a>
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Website:</strong>{' '}
                <a href="https://coparentliaizen.com" className="text-teal-medium hover:underline">
                  coparentliaizen.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-600 text-sm py-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <Link to="/" className="hover:text-teal-dark transition-colors">
              Home
            </Link>
            <span className="hidden md:inline">|</span>
            <Link to="/privacy" className="hover:text-teal-dark transition-colors font-semibold">
              Privacy Policy
            </Link>
            <span className="hidden md:inline">|</span>
            <Link to="/terms" className="hover:text-teal-dark transition-colors">
              Terms of Service
            </Link>
          </div>
          <p className="mt-4">© 2025 LiaiZen. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default PrivacyPage;
