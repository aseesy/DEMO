import React from 'react';

/**
 * Footer - Landing page footer
 */
export function Footer() {
  return (
    <footer className="border-t-2 border-teal-light py-8 px-4 bg-gray-50 pb-24 sm:pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/assets/Logo.svg" alt="LiaiZen Logo" className="h-8 w-auto" />
            <img src="/assets/wordmark.svg" alt="LiaiZen" className="h-10 w-auto" />
          </div>

          {/* Links */}
          <div className="flex gap-6 text-sm">
            <a href="/privacy" className="text-gray-600 hover:text-teal-medium transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-gray-600 hover:text-teal-medium transition-colors">
              Terms of Service
            </a>
            <a
              href="/contact.html"
              className="text-gray-600 hover:text-teal-medium transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>&copy; 2025 LiaiZen. Making co-parenting peaceful, one conversation at a time.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
