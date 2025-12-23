import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Terms of Service Page Component
 * Renders the terms of service content
 */
export function TermsPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600">
            Last updated: <span>January 2025</span>
          </p>
        </header>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 mb-8">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing or using LiaiZen ("the Service"), you agree to be bound by these Terms of
              Service ("Terms"). If you disagree with any part of these Terms, you may not access or
              use the Service.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms apply to all users of the Service, including without limitation users who
              are browsers, vendors, customers, merchants, and contributors of content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              LiaiZen is a communication platform designed to facilitate secure, mediated
              communication between co-parents. The Service includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Secure messaging between authorized users</li>
              <li>AI-powered communication mediation and suggestions</li>
              <li>Contact management for co-parenting relationships</li>
              <li>Task management features</li>
              <li>Room-based communication channels</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at
              any time, with or without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. User Accounts and Registration
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Account Creation</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Account Requirements</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You must be at least 18 years old to use the Service. By using the Service, you
              represent and warrant that you are at least 18 years old and have the legal capacity
              to enter into these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Permitted Use</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to use the Service only for lawful purposes and in accordance with these
              Terms. You agree not to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Use the Service in any way that violates any applicable law or regulation</li>
              <li>
                Transmit any harmful, threatening, abusive, harassing, defamatory, vulgar, obscene,
                or otherwise objectionable content
              </li>
              <li>
                Impersonate any person or entity or falsely state or misrepresent your affiliation
                with any person or entity
              </li>
              <li>
                Interfere with or disrupt the Service or servers or networks connected to the
                Service
              </li>
              <li>
                Attempt to gain unauthorized access to any portion of the Service or any other
                accounts, computer systems, or networks
              </li>
              <li>
                Use any robot, spider, or other automatic device to access the Service for any
                purpose without our express written permission
              </li>
              <li>Collect or harvest any personally identifiable information from the Service</li>
              <li>Use the Service to send spam or unsolicited communications</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              4.2 Co-Parenting Communication
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Service is designed to facilitate constructive communication between co-parents.
              You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Communicate respectfully and constructively</li>
              <li>Use the Service in good faith for co-parenting purposes</li>
              <li>Not use the Service to harass, threaten, or abuse others</li>
              <li>Respect the privacy and boundaries of other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. AI Mediation and Suggestions
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Service includes AI-powered communication mediation features that analyze messages
              and provide suggestions, tips, and rewrites. You acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>AI suggestions are provided for informational purposes only</li>
              <li>AI suggestions do not constitute legal, medical, or professional advice</li>
              <li>
                You are solely responsible for the content you send, regardless of any AI
                suggestions
              </li>
              <li>AI mediation is an optional feature that you may choose to ignore</li>
              <li>
                We are not liable for any consequences arising from following or ignoring AI
                suggestions
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Content and Messages</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Ownership</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You retain ownership of all content you submit, post, or display on the Service ("User
              Content"). By submitting User Content, you grant us a non-exclusive, worldwide,
              royalty-free license to use, store, and process your User Content solely for the
              purpose of providing the Service.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Responsibility</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You are solely responsible for your User Content and the consequences of posting or
              publishing it. You represent and warrant that:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>You own or have the necessary rights to post your User Content</li>
              <li>
                Your User Content does not violate any third-party rights, including intellectual
                property rights
              </li>
              <li>Your User Content does not violate any applicable laws or regulations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.3 Content Moderation</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              While we may monitor User Content, we are not obligated to do so. We reserve the right
              to remove any User Content that violates these Terms or is otherwise objectionable, at
              our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Service and its original content, features, and functionality are and will remain
              the exclusive property of LiaiZen and its licensors. The Service is protected by
              copyright, trademark, and other laws. Our trademarks and trade dress may not be used
              without our prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your use of the Service is also governed by our Privacy Policy. Please review our
              Privacy Policy, which also governs your use of the Service, to understand our
              practices regarding the collection and use of your information.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <Link to="/privacy" className="text-teal-medium hover:underline">
                View Privacy Policy
              </Link>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Service Availability and Modifications
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We strive to provide continuous access to the Service, but we do not guarantee that
              the Service will be available at all times. We reserve the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Modify, suspend, or discontinue the Service at any time</li>
              <li>Perform maintenance that may result in service interruptions</li>
              <li>Limit access to certain features or users</li>
              <li>Change or update features without prior notice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Disclaimers and Limitations of Liability
            </h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              10.1 Disclaimer of Warranties
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF
              PERFORMANCE.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              10.2 Limitation of Liability
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, LIAIZEN SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
              REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL,
              OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>Your use or inability to use the Service</li>
              <li>Any unauthorized access to or use of our servers or data</li>
              <li>
                Any errors or omissions in any content or for any loss or damage incurred as a
                result of your use of any content
              </li>
              <li>The deletion of, corruption of, or failure to store any content or data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              10.3 Not Legal or Professional Advice
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Service, including AI mediation features, does not provide legal, medical,
              financial, or professional advice. You should consult with qualified professionals for
              advice regarding legal matters, child custody, financial issues, or other professional
              concerns.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to defend, indemnify, and hold harmless LiaiZen and its officers, directors,
              employees, and agents from and against any claims, liabilities, damages, losses, and
              expenses, including without limitation reasonable legal and accounting fees, arising
              out of or in any way connected with your access to or use of the Service or your
              violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Termination</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">12.1 By You</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may terminate your account at any time by contacting us or using the account
              deletion features in the Service. Upon termination, your right to use the Service will
              immediately cease.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">12.2 By Us</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may terminate or suspend your account and access to the Service immediately,
              without prior notice or liability, for any reason, including if you breach these
              Terms. Upon termination, your right to use the Service will immediately cease.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">12.3 Effect of Termination</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Upon termination, all provisions of these Terms which by their nature should survive
              termination shall survive, including ownership provisions, warranty disclaimers,
              indemnity, and limitations of liability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              13. Governing Law and Dispute Resolution
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the
              jurisdiction in which LiaiZen operates, without regard to its conflict of law
              provisions. Any disputes arising from these Terms or the Service shall be resolved
              through binding arbitration in accordance with applicable arbitration rules.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any
              time. If a revision is material, we will provide at least 30 days' notice prior to any
              new terms taking effect. What constitutes a material change will be determined at our
              sole discretion.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              By continuing to access or use our Service after those revisions become effective, you
              agree to be bound by the revised terms. If you do not agree to the new terms, please
              stop using the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700">
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:legal@coparentliaizen.com"
                  className="text-teal-medium hover:underline"
                >
                  legal@coparentliaizen.com
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
            <Link to="/privacy" className="hover:text-teal-dark transition-colors">
              Privacy Policy
            </Link>
            <span className="hidden md:inline">|</span>
            <Link to="/terms" className="hover:text-teal-dark transition-colors font-semibold">
              Terms of Service
            </Link>
          </div>
          <p className="mt-4">© 2025 LiaiZen. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default TermsPage;
