import React, { useState } from 'react';
import { Button, Modal, Input, Textarea, Select, Heading, SectionHeader, Toast, ToastContainer } from './ui';


/**
 * UI Component Showcase
 * Interactive documentation and testing page for all design system components
 */
export function UIShowcase() {
  const [showModal, setShowModal] = useState(false);
  const [loadingButton, setLoadingButton] = useState(null);
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Wed', 'Fri']);

  // Form component states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [bio, setBio] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [multiSelect, setMultiSelect] = useState([]);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const newToast = {
      id: Date.now(),
      message,
      sender: 'System',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };


  const handleLoadingDemo = (buttonId) => {
    setLoadingButton(buttonId);
    setTimeout(() => setLoadingButton(null), 2000);
  };

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const validateEmail = (value) => {
    setEmail(value);
    if (value && !value.includes('@')) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-lightest to-white">
      {/* Header */}
      <div className="bg-white border-b-2 border-teal-light shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-5xl font-serif italic text-teal-dark mb-3">
              Style Guide
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Design tokens, usage guidelines, and visual standards
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <nav className="mb-12 bg-white rounded-xl p-6 border-2 border-teal-light shadow-sm">
          <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">Quick Navigation</div>
          <div className="grid grid-cols-2 gap-3">
            <a href="#foundations" className="text-teal-dark hover:text-teal-medium transition-colors font-medium">
              📐 Foundations
            </a>
            <a href="#components" className="text-teal-dark hover:text-teal-medium transition-colors font-medium">
              🧩 Components
            </a>
          </div>
        </nav>

        {/* === FOUNDATIONS === */}
        <div id="foundations" className="mb-16">
          <div className="mb-8">
            <h2 className="text-4xl font-serif text-teal-dark mb-2">📐 Foundations</h2>
            <p className="text-lg text-gray-600">Core design tokens and principles</p>
          </div>

          {/* Color System */}
          <section className="mb-12">
            <div className="bg-white rounded-2xl p-10 border-2 border-gray-200 shadow-lg">
              <h3 className="text-2xl font-bold text-teal-dark mb-3">Color System</h3>
              <p className="text-gray-600 mb-8">A monochromatic teal palette designed for harmony and accessibility</p>

              {/* Color Swatches with Details */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                {/* Teal Darkest */}
                <div className="space-y-3">
                  <div className="h-24 bg-teal-darkest rounded-lg"></div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Darkest</div>
                    <code className="text-xs text-gray-600">#1f4447</code>
                    <div className="text-xs text-gray-500 mt-1">rgb(31, 68, 71)</div>
                    <p className="text-xs text-gray-500 mt-1">Darkest teal – for text on dark backgrounds, or hover states on dark backgrounds</p>
                  </div>
                </div>

                {/* Teal Dark */}
                <div className="space-y-3">
                  <div className="h-24 bg-teal-dark rounded-lg"></div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Dark</div>
                    <code className="text-xs text-gray-600">#275559</code>
                    <div className="text-xs text-gray-500 mt-1">rgb(39, 85, 89)</div>
                    <p className="text-xs text-gray-500 mt-1">Dark teal – for headings on light backgrounds</p>
                  </div>
                </div>

                {/* Teal Medium - PRIMARY */}
                <div className="space-y-3">
                  <div className="h-24 bg-teal-medium rounded-lg relative">
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-bold text-teal-dark">
                      PRIMARY
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Medium</div>
                    <code className="text-xs text-gray-600">#4DA8B0</code>
                    <div className="text-xs text-gray-500 mt-1">rgb(77, 168, 176)</div>
                  </div>
                </div>

                {/* Teal Light */}
                <div className="space-y-3">
                  <div className="h-24 bg-teal-light rounded-lg border-2 border-teal-medium"></div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Light</div>
                    <code className="text-xs text-gray-600">#C5E8E4</code>
                    <div className="text-xs text-gray-500 mt-1">rgb(197, 232, 228)</div>
                    <p className="text-xs text-gray-500 mt-1">Light teal – subtle UI backgrounds</p>
                  </div>
                </div>

                {/* Teal Lightest */}
                <div className="space-y-3">
                  <div className="h-24 bg-teal-lightest rounded-lg border-2 border-teal-light"></div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Lightest</div>
                    <code className="text-xs text-gray-600">#E6F7F5</code>
                    <div className="text-xs text-gray-500 mt-1">rgb(230, 247, 245)</div>
                    <p className="text-xs text-gray-500 mt-1">Lightest teal – background fills and subtle accents</p>
                  </div>
                </div>
              </div>

              {/* Usage Guidelines */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Usage Guidelines</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-teal-light rounded-lg p-4 bg-teal-lightest">
                      <div className="text-sm font-semibold text-teal-dark mb-2">✓ Do</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Use teal-medium for primary actions</li>
                        <li>• Use teal-dark for headings on light backgrounds</li>
                        <li>• Use teal-lightest for subtle backgrounds</li>
                      </ul>
                    </div>
                    <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="text-sm font-semibold text-red-700 mb-2">✗ Don't</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Don't use teal-light for body text</li>
                        <li>• Don't use teal-lightest on white (low contrast)</li>
                        <li>• Don't mix with other color families</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Accessibility */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Accessibility (WCAG 2.1)</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2">Combination</th>
                          <th className="text-left py-2">Contrast Ratio</th>
                          <th className="text-left py-2">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2">teal-dark on white</td>
                          <td className="py-2 font-mono">7.2:1</td>
                          <td className="py-2"><span className="text-green-600 font-semibold">AAA ✓</span></td>
                        </tr>
                        <tr>
                          <td className="py-2">teal-medium on white</td>
                          <td className="py-2 font-mono">3.1:1</td>
                          <td className="py-2"><span className="text-yellow-600 font-semibold">AA (Large)</span></td>
                        </tr>
                        <tr>
                          <td className="py-2">white on teal-dark</td>
                          <td className="py-2 font-mono">8.5:1</td>
                          <td className="py-2"><span className="text-green-600 font-semibold">AAA ✓</span></td>
                        </tr>
                        <tr>
                          <td className="py-2">white on teal-medium</td>
                          <td className="py-2 font-mono">2.8:1</td>
                          <td className="py-2"><span className="text-red-600 font-semibold">Fail ✗</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Color Combinations */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Recommended Combinations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border-2 border-teal-light rounded-lg overflow-hidden">
                      <div className="bg-white p-4">
                        <div className="text-teal-dark font-semibold mb-1">Heading</div>
                        <div className="text-gray-700 text-sm">Body text on white background</div>
                      </div>
                      <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600">
                        teal-dark + gray-700 on white
                      </div>
                    </div>

                    <div className="border-2 border-teal-dark rounded-lg overflow-hidden">
                      <div className="bg-teal-medium p-4">
                        <div className="text-white font-semibold mb-1">Primary Button</div>
                        <div className="text-white text-sm opacity-90">Call to action</div>
                      </div>
                      <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600">
                        white on teal-medium (large text only)
                      </div>
                    </div>

                    <div className="border-2 border-teal-light rounded-lg overflow-hidden">
                      <div className="bg-teal-lightest p-4">
                        <div className="text-teal-dark font-semibold mb-1">Subtle Section</div>
                        <div className="text-gray-700 text-sm">Background highlight</div>
                      </div>
                      <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600">
                        teal-dark + gray-700 on teal-lightest
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Spacing System */}
          <section className="mb-12">
            <div className="bg-white rounded-2xl p-10 border-2 border-gray-200 shadow-lg">
              <h3 className="text-2xl font-bold text-teal-dark mb-3">Spacing System</h3>
              <p className="text-gray-600 mb-8">Consistent spacing creates rhythm and hierarchy</p>

              {/* Spacing Scale */}
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-4">Spacing Scale</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-right">
                      <code className="text-sm font-mono text-gray-700">xs / 4px</code>
                    </div>
                    <div className="flex-1 bg-gray-100 p-2 rounded">
                      <div className="bg-teal-medium rounded" style={{ width: '4px', height: '24px' }}></div>
                    </div>
                    <div className="w-48 text-sm text-gray-600">Tight spacing</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-24 text-right">
                      <code className="text-sm font-mono text-gray-700">sm / 8px</code>
                    </div>
                    <div className="flex-1 bg-gray-100 p-2 rounded">
                      <div className="bg-teal-medium rounded" style={{ width: '8px', height: '24px' }}></div>
                    </div>
                    <div className="w-48 text-sm text-gray-600">Internal padding</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-24 text-right">
                      <code className="text-sm font-mono text-gray-700">md / 16px</code>
                    </div>
                    <div className="flex-1 bg-gray-100 p-2 rounded">
                      <div className="bg-teal-medium rounded" style={{ width: '16px', height: '24px' }}></div>
                    </div>
                    <div className="w-48 text-sm text-gray-600">Default unit</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-24 text-right">
                      <code className="text-sm font-mono text-gray-700">lg / 24px</code>
                    </div>
                    <div className="flex-1 bg-gray-100 p-2 rounded">
                      <div className="bg-teal-medium rounded" style={{ width: '24px', height: '24px' }}></div>
                    </div>
                    <div className="w-48 text-sm text-gray-600">Between elements</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-24 text-right">
                      <code className="text-sm font-mono text-gray-700">xl / 32px</code>
                    </div>
                    <div className="flex-1 bg-gray-100 p-2 rounded">
                      <div className="bg-teal-medium rounded" style={{ width: '32px', height: '24px' }}></div>
                    </div>
                    <div className="w-48 text-sm text-gray-600">Between sections</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-24 text-right">
                      <code className="text-sm font-mono text-gray-700">2xl / 48px</code>
                    </div>
                    <div className="flex-1 bg-gray-100 p-2 rounded">
                      <div className="bg-teal-medium rounded" style={{ width: '48px', height: '24px' }}></div>
                    </div>
                    <div className="w-48 text-sm text-gray-600">Major breaks</div>
                  </div>
                </div>
              </div>

              {/* Visual Examples */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Spacing in Practice</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Padding Example */}
                    <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700">
                        Padding (p-md / 16px)
                      </div>
                      <div className="bg-white p-4" style={{ padding: '16px' }}>
                        <div className="bg-teal-lightest border-2 border-teal-medium rounded p-4">
                          <div className="text-sm text-gray-700">Content with 16px padding</div>
                        </div>
                      </div>
                    </div>

                    {/* Margin Example */}
                    <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700">
                        Margin (mb-lg / 24px)
                      </div>
                      <div className="bg-white p-4">
                        <div className="bg-teal-lightest border-2 border-teal-medium rounded p-2 text-sm text-gray-700" style={{ marginBottom: '24px' }}>
                          First element
                        </div>
                        <div className="bg-teal-lightest border-2 border-teal-medium rounded p-2 text-sm text-gray-700">
                          Second element (24px gap above)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Guidelines */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Usage Guidelines</h4>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• <strong>xs (4px):</strong> Icon-to-text spacing, badge padding</li>
                      <li>• <strong>sm (8px):</strong> Button padding, form field internal spacing</li>
                      <li>• <strong>md (16px):</strong> Card padding, default element spacing</li>
                      <li>• <strong>lg (24px):</strong> Section spacing, related content groups</li>
                      <li>• <strong>xl (32px):</strong> Major section breaks, page margins</li>
                      <li>• <strong>2xl (48px):</strong> Page-level spacing, hero sections</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Brand Assets & Iconography */}
          <section className="mb-12">
            <div className="bg-white rounded-2xl p-10 border-2 border-gray-200 shadow-lg">
              <h3 className="text-2xl font-bold text-teal-dark mb-3">Brand Assets & Logo</h3>
              <p className="text-gray-600 mb-8">Official LiaiZen brand marks and usage guidelines</p>

              {/* Logo Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Primary Logo */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border-2 border-gray-200">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-4 font-semibold">Primary Logo</div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-center justify-center mb-4">
                    <img src="/assets/LZlogo.svg" alt="LiaiZen Logo" className="h-16" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="mb-2"><strong>Usage:</strong> Headers, marketing materials, presentations</p>
                    <p className="mb-2"><strong>Path:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">/assets/LZlogo.svg</code></p>
                    <p><strong>Note:</strong> The "ai" portion uses teal gradient for emphasis</p>
                  </div>
                </div>

                {/* Icon Mark */}
                <div className="bg-gradient-to-br from-teal-lightest to-white p-8 rounded-xl border-2 border-teal-light">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-4 font-semibold">Icon Mark</div>
                  <div className="bg-white p-6 rounded-lg border border-teal-light flex items-center justify-center mb-4">
                    <img src="/assets/TransB.svg" alt="LiaiZen Icon" className="h-16" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="mb-2"><strong>Usage:</strong> Favicon, app icon, social media avatars</p>
                    <p className="mb-2"><strong>Formats:</strong> SVG, PNG (192px, 512px)</p>
                    <p><strong>Path:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">/assets/TransB.svg</code></p>
                  </div>
                </div>
              </div>

              {/* Logo Usage Guidelines */}
              <div className="bg-teal-lightest p-6 rounded-xl border-2 border-teal-light">
                <h4 className="text-lg font-semibold text-teal-dark mb-4">Logo Usage Guidelines</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-semibold text-teal-dark mb-2">✅ Do:</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Use adequate clear space around the logo</li>
                      <li>• Maintain aspect ratio when scaling</li>
                      <li>• Use on white or light teal backgrounds</li>
                      <li>• Use SVG format for web when possible</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-red-600 mb-2">❌ Don't:</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Stretch, skew, or distort the logo</li>
                      <li>• Change the color of the "ai" gradient</li>
                      <li>• Add drop shadows or effects</li>
                      <li>• Use on busy background patterns</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Clear Space */}
              <div className="mt-8 bg-gray-50 p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-teal-dark mb-4">Clear Space & Sizing</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Minimum Size</div>
                    <p className="text-sm text-gray-700">32px height for digital<br/>1 inch height for print</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Clear Space</div>
                    <p className="text-sm text-gray-700">Equal to the height of the "L" on all sides</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Recommended</div>
                    <p className="text-sm text-gray-700">48-64px for headers<br/>16-24px for inline use</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* === COMPONENTS === */}
        <div id="components" className="mb-16">
          <div className="mb-8">
            <h2 className="text-4xl font-serif text-teal-dark mb-2">🧩 Components</h2>
            <p className="text-lg text-gray-600">Reusable UI components</p>
          </div>

          {/* Heading Component Section */}
          <section className="mb-12">
            <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
              <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
                <h2 className="text-2xl font-bold text-white">Heading Component</h2>
                <p className="text-teal-lightest mt-1">Professional serif headings for impactful statements</p>
              </div>

              <div className="p-6 space-y-8">
                {/* Hero and Large Heading examples removed – not needed for the style guide */}

                {/* Medium & Small Variants */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Medium & Small Headings</h3>
                  <div className="space-y-4">
                    <div className="bg-white border-2 border-teal-light p-4 rounded-lg">
                      <Heading variant="medium" as="h2">
                        Medium Heading Example
                      </Heading>
                    </div>
                    <div className="bg-white border-2 border-teal-light p-4 rounded-lg">
                      <Heading variant="small" as="h3" color="teal-medium">
                        Small Heading Example
                      </Heading>
                    </div>
                  </div>
                </div>

                {/* Color Variants */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                      <Heading variant="medium" color="dark" as="h3">Dark Text</Heading>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-2 border-teal-medium">
                      <Heading variant="medium" color="teal" as="h3">Teal Text</Heading>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-2 border-teal-light">
                      <Heading variant="medium" color="teal-medium" as="h3">Teal Medium</Heading>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                      <Heading variant="medium" color="light" as="h3">Light Text</Heading>
                    </div>
                  </div>
                </div>

                {/* Color Options */}
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    The color options above illustrate how the <code className="bg-gray-100 px-1 rounded">Heading</code> component can be styled with different semantic colors. Use <code className="bg-gray-100 px-1 rounded">color="dark"</code> for standard dark text, <code className="bg-gray-100 px-1 rounded">color="teal"</code> for brand teal, and <code className="bg-gray-100 px-1 rounded">color="light"</code> for lighter contexts.
                  </p>
                </div>
                {/* Code Example removed – not needed for the style guide */}
              </div>
            </div>
          </section>

          {/* SectionHeader Component Section */}
          <section className="mb-12">
            <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
              <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
                <h2 className="text-2xl font-bold text-white">SectionHeader Component</h2>
                <p className="text-teal-lightest mt-1">Small caps section labels and category headers</p>
              </div>

              <div className="p-6 space-y-8">
                {/* Basic Usage */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Usage</h3>
                  <div className="bg-gradient-to-br from-teal-lightest to-white p-8 rounded-lg space-y-4">
                    <SectionHeader>Section Header Example</SectionHeader>
                    <p className="text-gray-700 text-lg mt-2">
                      This is an example paragraph demonstrating how section headers work with body text.
                    </p>
                  </div>
                </div>

                {/* Size Variants */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Size Variants</h3>
                  <div className="space-y-4">
                    <div className="bg-white border-2 border-teal-light p-4 rounded-lg">
                      <SectionHeader size="sm">Small Section Header</SectionHeader>
                    </div>
                    <div className="bg-white border-2 border-teal-light p-4 rounded-lg">
                      <SectionHeader size="base">Base Section Header</SectionHeader>
                    </div>
                    <div className="bg-white border-2 border-teal-light p-4 rounded-lg">
                      <SectionHeader size="lg">Large Section Header</SectionHeader>
                    </div>
                  </div>
                </div>

                {/* Color Variants */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Variants</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border-2 border-teal-light p-4 rounded-lg">
                      <SectionHeader color="light">Teal Light</SectionHeader>
                    </div>
                    <div className="bg-white border-2 border-teal-medium p-4 rounded-lg">
                      <SectionHeader color="medium">Teal Medium</SectionHeader>
                    </div>
                    <div className="bg-white border-2 border-teal-dark p-4 rounded-lg">
                      <SectionHeader color="dark">Teal Dark</SectionHeader>
                    </div>
                  </div>
                </div>

                {/* Code Example */}
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`<SectionHeader>
  Section Header Example
</SectionHeader>

<SectionHeader size="lg" color="dark">
  Large Dark Header
</SectionHeader>`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* Professional Button Styles */}
          <section className="mb-12">
            <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
              <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
                <h2 className="text-2xl font-bold text-white">Professional Button Styles</h2>
                <p className="text-teal-lightest mt-1">Pill-shaped button variants</p>
              </div>

              <div className="p-6 space-y-8">
                {/* Professional CTA Buttons */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Call-to-Action Buttons (Pill Shape)</h3>
                  <div className="bg-gradient-to-br from-teal-lightest to-white p-8 rounded-lg">
                    <div className="flex flex-wrap gap-4 items-center justify-center">
                      <Button variant="teal-solid" size="large">
                        Primary Action
                      </Button>
                      <Button variant="teal-outline" size="large">
                        Secondary Action
                      </Button>
                    </div>
                  </div>
                </div>

                {/* All Sizes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Button Sizes</h3>
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200 flex flex-wrap gap-4 items-center">
                    <Button variant="teal-solid" size="small">Small</Button>
                    <Button variant="teal-solid" size="medium">Medium</Button>
                    <Button variant="teal-solid" size="large">Large</Button>
                    <Button variant="teal-solid" size="xl">Extra Large</Button>
                  </div>
                </div>

                {/* Outlined Variants */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Outlined Variants</h3>
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200 flex flex-wrap gap-4 items-center">
                    <Button variant="teal-outline" size="small">Small</Button>
                    <Button variant="teal-outline" size="medium">Medium</Button>
                    <Button variant="teal-outline" size="large">Large</Button>
                  </div>
                </div>

                {/* Full Demo with Heading */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Professional Layout</h3>
                  <div className="bg-gradient-to-br from-teal-lightest to-white p-12 rounded-lg text-center">
                    <SectionHeader className="mb-4">Section Header</SectionHeader>
                    <Heading variant="large" className="mb-6">
                      Large Heading <em className="italic">Example</em>
                    </Heading>
                    <p className="text-gray-700 text-lg mb-8 max-w-3xl mx-auto">
                      This is an example paragraph demonstrating a complete layout with section header, heading, body text, and action buttons.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                      <Button variant="teal-solid" size="large">
                        Primary Action
                      </Button>
                      <Button variant="teal-outline" size="large">
                        Secondary Action
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Code Example */}
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`<SectionHeader>Section Header</SectionHeader>
<Heading variant="hero">
  Large Heading <em>Example</em>
</Heading>
<Button variant="teal-solid" size="large">
  Primary Action
</Button>
<Button variant="teal-outline" size="large">
  Secondary Action
</Button>`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* Button Component Section */}
          <section className="mb-12">
            <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
              <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
                <h2 className="text-2xl font-bold text-white">Button Component</h2>
                <p className="text-teal-lightest mt-1">Flexible, accessible action buttons with multiple variants</p>
              </div>

              <div className="p-6 space-y-8">
                {/* Variants */}
                <div>
                  <h3 className="text-lg font-semibold text-teal-dark mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-teal-medium rounded"></span>
                    Variants
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-600">Primary</div>
                      <Button variant="primary">Primary Button</Button>
                      <code className="block text-xs bg-gray-100 p-2 rounded">
                        variant="primary"
                      </code>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-600">Secondary</div>
                      <Button variant="secondary">Secondary Button</Button>
                      <code className="block text-xs bg-gray-100 p-2 rounded">
                        variant="secondary"
                      </code>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-600">Tertiary</div>
                      <Button variant="tertiary">Tertiary Button</Button>
                      <code className="block text-xs bg-gray-100 p-2 rounded">
                        variant="tertiary"
                      </code>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-600">Ghost</div>
                      <Button variant="ghost">Ghost Button</Button>
                      <code className="block text-xs bg-gray-100 p-2 rounded">
                        variant="ghost"
                      </code>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-600">Danger</div>
                      <Button variant="danger">Danger Button</Button>
                      <code className="block text-xs bg-gray-100 p-2 rounded">
                        variant="danger"
                      </code>
                    </div>
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h3 className="text-lg font-semibold text-teal-dark mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-teal-medium rounded"></span>
                    Sizes
                  </h3>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-600">Small</div>
                      <Button variant="primary" size="small">Small Button</Button>
                      <code className="block text-xs bg-gray-100 p-2 rounded">
                        size="small"
                      </code>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-600">Medium (Default)</div>
                      <Button variant="primary" size="medium">Medium Button</Button>
                      <code className="block text-xs bg-gray-100 p-2 rounded">
                        size="medium"
                      </code>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-600">Large</div>
                      <Button variant="primary" size="large">Large Button</Button>
                      <code className="block text-xs bg-gray-100 p-2 rounded">
                        size="large"
                      </code>
                    </div>
                  </div>
                </div>

                {/* States */}
                <div>
                  <h3 className="text-lg font-semibold text-teal-dark mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-teal-medium rounded"></span>
                    States
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-600">Loading State</div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          loading={loadingButton === 'demo1'}
                          onClick={() => handleLoadingDemo('demo1')}
                        >
                          Click to Load
                        </Button>
                      </div>
                      <code className="block text-xs bg-gray-100 p-2 rounded">
                        loading={'{isLoading}'}
                      </code>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-600">Disabled State</div>
                      <Button variant="primary" disabled>Disabled Button</Button>
                      <code className="block text-xs bg-gray-100 p-2 rounded">
                        disabled={'{true}'}
                      </code>
                    </div>
                  </div>
                </div>

                {/* With Icons */}
                <div>
                  <h3 className="text-lg font-semibold text-teal-dark mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-teal-medium rounded"></span>
                    With Icons
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant="primary"
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      }
                    >
                      Add Item
                    </Button>
                    <Button
                      variant="secondary"
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      }
                    >
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      }
                      aria-label="Close"
                    />
                  </div>
                  <code className="block text-xs bg-gray-100 p-2 rounded mt-3">
                    icon={'{<IconComponent />}'}
                  </code>
                </div>

                {/* Full Width */}
                <div>
                  <h3 className="text-lg font-semibold text-teal-dark mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-teal-medium rounded"></span>
                    Full Width
                  </h3>
                  <Button variant="primary" fullWidth>Full Width Button</Button>
                  <code className="block text-xs bg-gray-100 p-2 rounded mt-3">
                    fullWidth={'{true}'}
                  </code>
                </div>

                {/* Toggle Pattern */}
                <div>
                  <h3 className="text-lg font-semibold text-teal-dark mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-teal-medium rounded"></span>
                    Toggle Pattern (Days Selector)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <Button
                        key={day}
                        variant={selectedDays.includes(day) ? 'secondary' : 'tertiary'}
                        size="small"
                        onClick={() => toggleDay(day)}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                  <code className="block text-xs bg-gray-100 p-2 rounded mt-3">
                    variant={'{isActive ? "secondary" : "tertiary"}'}
                  </code>
                </div>

                {/* Props API */}
                <div>
                  <h3 className="text-lg font-semibold text-teal-dark mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-teal-medium rounded"></span>
                    Props API
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-teal-lightest border-b-2 border-teal-light">
                          <th className="p-3 font-semibold text-teal-dark">Prop</th>
                          <th className="p-3 font-semibold text-teal-dark">Type</th>
                          <th className="p-3 font-semibold text-teal-dark">Default</th>
                          <th className="p-3 font-semibold text-teal-dark">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        <tr className="border-b border-gray-200">
                          <td className="p-3 font-mono text-xs bg-gray-50">variant</td>
                          <td className="p-3 font-mono text-xs">string</td>
                          <td className="p-3 font-mono text-xs">"primary"</td>
                          <td className="p-3 text-gray-700">
                            Button style variant: <code className="bg-gray-100 px-1 rounded">primary</code>, <code className="bg-gray-100 px-1 rounded">secondary</code>, <code className="bg-gray-100 px-1 rounded">tertiary</code>, <code className="bg-gray-100 px-1 rounded">ghost</code>, <code className="bg-gray-100 px-1 rounded">danger</code>, <code className="bg-gray-100 px-1 rounded">teal-solid</code>, <code className="bg-gray-100 px-1 rounded">teal-outline</code>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-3 font-mono text-xs bg-gray-50">size</td>
                          <td className="p-3 font-mono text-xs">string</td>
                          <td className="p-3 font-mono text-xs">"medium"</td>
                          <td className="p-3 text-gray-700">
                            Button size: <code className="bg-gray-100 px-1 rounded">small</code>, <code className="bg-gray-100 px-1 rounded">medium</code>, <code className="bg-gray-100 px-1 rounded">large</code>, <code className="bg-gray-100 px-1 rounded">xl</code>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-3 font-mono text-xs bg-gray-50">fullWidth</td>
                          <td className="p-3 font-mono text-xs">boolean</td>
                          <td className="p-3 font-mono text-xs">false</td>
                          <td className="p-3 text-gray-700">If true, button expands to fill container width</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-3 font-mono text-xs bg-gray-50">disabled</td>
                          <td className="p-3 font-mono text-xs">boolean</td>
                          <td className="p-3 font-mono text-xs">false</td>
                          <td className="p-3 text-gray-700">Disables button interaction and applies disabled styling</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-3 font-mono text-xs bg-gray-50">loading</td>
                          <td className="p-3 font-mono text-xs">boolean</td>
                          <td className="p-3 font-mono text-xs">false</td>
                          <td className="p-3 text-gray-700">Shows loading spinner and "Loading..." text, disables interaction</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-3 font-mono text-xs bg-gray-50">icon</td>
                          <td className="p-3 font-mono text-xs">React.Node</td>
                          <td className="p-3 font-mono text-xs">null</td>
                          <td className="p-3 text-gray-700">Icon component to display alongside button text</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-3 font-mono text-xs bg-gray-50">iconPosition</td>
                          <td className="p-3 font-mono text-xs">string</td>
                          <td className="p-3 font-mono text-xs">"left"</td>
                          <td className="p-3 text-gray-700">
                            Icon placement: <code className="bg-gray-100 px-1 rounded">left</code> or <code className="bg-gray-100 px-1 rounded">right</code>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-3 font-mono text-xs bg-gray-50">onClick</td>
                          <td className="p-3 font-mono text-xs">function</td>
                          <td className="p-3 font-mono text-xs">-</td>
                          <td className="p-3 text-gray-700">Click event handler</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-3 font-mono text-xs bg-gray-50">type</td>
                          <td className="p-3 font-mono text-xs">string</td>
                          <td className="p-3 font-mono text-xs">"button"</td>
                          <td className="p-3 text-gray-700">
                            HTML button type: <code className="bg-gray-100 px-1 rounded">button</code>, <code className="bg-gray-100 px-1 rounded">submit</code>, <code className="bg-gray-100 px-1 rounded">reset</code>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-3 font-mono text-xs bg-gray-50">className</td>
                          <td className="p-3 font-mono text-xs">string</td>
                          <td className="p-3 font-mono text-xs">""</td>
                          <td className="p-3 text-gray-700">Additional CSS classes to apply</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Accessibility */}
                <div className="bg-teal-lightest p-6 rounded-xl border-2 border-teal-light">
                  <h4 className="text-lg font-semibold text-teal-dark mb-4">♿ Accessibility Features</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-teal-medium font-bold">✓</span>
                      <span><strong>Minimum Touch Target:</strong> All buttons meet 44px minimum height for mobile accessibility</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-medium font-bold">✓</span>
                      <span><strong>Keyboard Navigation:</strong> Fully keyboard accessible with focus ring indicators</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-medium font-bold">✓</span>
                      <span><strong>ARIA Attributes:</strong> Uses <code className="bg-gray-100 px-1 rounded">aria-busy</code> for loading states</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-medium font-bold">✓</span>
                      <span><strong>Disabled State:</strong> Proper cursor and visual feedback for disabled buttons</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-medium font-bold">✓</span>
                      <span><strong>Color Contrast:</strong> All variants meet WCAG AA standards for text contrast</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Modal Component Section */}
          <section className="mb-12">
            <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
              <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
                <h2 className="text-2xl font-bold text-white">Modal Component</h2>
                <p className="text-teal-lightest mt-1">Accessible dialog overlays with backdrop and keyboard support</p>
              </div>

              <div className="p-6 space-y-8">
                {/* Modal Demo */}
                <div>
                  <h3 className="text-lg font-semibold text-teal-dark mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-teal-medium rounded"></span>
                    Interactive Demo
                  </h3>
                  <Button variant="primary" onClick={() => setShowModal(true)}>
                    Open Demo Modal
                  </Button>
                  <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Demo Modal"
                    subtitle="This is a subtitle explaining the modal purpose"
                    footer={
                      <>
                        <Button variant="tertiary" onClick={() => setShowModal(false)}>
                          Cancel
                        </Button>
                        <Button variant="primary" onClick={() => setShowModal(false)}>
                          Confirm
                        </Button>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <p className="text-gray-700">
                        This is a demo modal showing the Modal component in action. It includes:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Backdrop overlay (40% black)</li>
                        <li>Escape key support (press Esc to close)</li>
                        <li>Scroll locking on body</li>
                        <li>Custom footer with buttons</li>
                        <li>Proper accessibility (ARIA attributes)</li>
                        <li>Mobile-safe padding (pb-24)</li>
                      </ul>
                    </div>
                  </Modal>
                </div>

                {/* Modal Features */}
                <div>
                  <h3 className="text-lg font-semibold text-teal-dark mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-teal-medium rounded"></span>
                    Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-teal-lightest p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-teal-dark">Escape Key</span>
                      </div>
                      <p className="text-sm text-teal-medium">Press Esc to close modal</p>
                    </div>
                    <div className="bg-teal-lightest p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-teal-dark">Scroll Lock</span>
                      </div>
                      <p className="text-sm text-teal-medium">Body scroll locked when open</p>
                    </div>
                    <div className="bg-teal-lightest p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-teal-dark">ARIA Support</span>
                      </div>
                      <p className="text-sm text-teal-medium">Proper accessibility attributes</p>
                    </div>
                    <div className="bg-teal-lightest p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-teal-dark">Custom Footer</span>
                      </div>
                      <p className="text-sm text-teal-medium">Flexible footer content</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Input Component Section */}
          <section className="mb-12">
            <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
              <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
                <h2 className="text-2xl font-bold text-white">Input Component</h2>
                <p className="text-teal-lightest mt-1">Text inputs with validation, states, and accessibility</p>
              </div>

              <div className="p-6 space-y-8">
                {/* Basic inputs */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Inputs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={validateEmail}
                      placeholder="you@example.com"
                      error={emailError}
                    />
                    <Input
                      label="Password"
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="••••••••"
                      helperText="At least 8 characters"
                    />
                  </div>
                </div>

                {/* Character counter */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Character Counter</h3>
                  <Input
                    label="Bio"
                    value={bio}
                    onChange={setBio}
                    placeholder="Tell us about yourself..."
                    maxLength={150}
                    showCharCount
                    helperText="Short bio for your profile"
                  />
                </div>

                {/* Prefix/Suffix */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">With Icons</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Search"
                      type="search"
                      value=""
                      onChange={() => { }}
                      placeholder="Search..."
                      prefix={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      }
                    />
                    <Input
                      label="Website"
                      type="url"
                      value=""
                      onChange={() => { }}
                      placeholder="https://example.com"
                      suffix={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      }
                    />
                  </div>
                </div>

                {/* States */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">States</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Disabled"
                      value="Disabled input"
                      onChange={() => { }}
                      disabled
                    />
                    <Input
                      label="Read-only"
                      value="Read-only value"
                      onChange={() => { }}
                      readOnly
                    />
                    <Input
                      label="Required"
                      value=""
                      onChange={() => { }}
                      placeholder="Required field"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Textarea Component Section */}
          <section className="mb-12">
            <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
              <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
                <h2 className="text-2xl font-bold text-white">Textarea Component</h2>
                <p className="text-teal-lightest mt-1">Multi-line text inputs with auto-resize</p>
              </div>

              <div className="p-6 space-y-8">
                {/* Basic textarea */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Textarea</h3>
                  <Textarea
                    label="Description"
                    value={description}
                    onChange={setDescription}
                    placeholder="Enter a detailed description..."
                    rows={4}
                    helperText="Provide as much detail as possible"
                  />
                </div>

                {/* Auto-resize */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Resize</h3>
                  <Textarea
                    label="Auto-expanding Textarea"
                    value=""
                    onChange={() => { }}
                    placeholder="Type to see it expand..."
                    autoResize
                    minRows={2}
                    maxRows={8}
                    helperText="Automatically expands as you type"
                  />
                </div>

                {/* Character counter */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">With Character Counter</h3>
                  <Textarea
                    label="Feedback"
                    value=""
                    onChange={() => { }}
                    placeholder="Share your feedback..."
                    maxLength={500}
                    showCharCount
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Select Component Section */}
          <section className="mb-12">
            <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
              <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
                <h2 className="text-2xl font-bold text-white">Select Component</h2>
                <p className="text-teal-lightest mt-1">Dropdowns with search and multi-select</p>
              </div>

              <div className="p-6 space-y-8">
                {/* Basic select */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Select (Native)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Country"
                      value={country}
                      onChange={setCountry}
                      options={[
                        { value: 'us', label: 'United States' },
                        { value: 'ca', label: 'Canada' },
                        { value: 'mx', label: 'Mexico' },
                        { value: 'uk', label: 'United Kingdom' },
                        { value: 'au', label: 'Australia' }
                      ]}
                      placeholder="Select a country..."
                    />
                    <Select
                      label="Priority"
                      value=""
                      onChange={() => { }}
                      options={[
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                        { value: 'urgent', label: 'Urgent' }
                      ]}
                      placeholder="Select priority..."
                      required
                    />
                  </div>
                </div>

                {/* Searchable select */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Searchable Select</h3>
                  <Select
                    label="City"
                    value={city}
                    onChange={setCity}
                    searchable
                    options={[
                      { value: 'nyc', label: 'New York City' },
                      { value: 'la', label: 'Los Angeles' },
                      { value: 'chicago', label: 'Chicago' },
                      { value: 'houston', label: 'Houston' },
                      { value: 'phoenix', label: 'Phoenix' },
                      { value: 'philadelphia', label: 'Philadelphia' },
                      { value: 'san-antonio', label: 'San Antonio' },
                      { value: 'san-diego', label: 'San Diego' },
                      { value: 'dallas', label: 'Dallas' },
                      { value: 'san-jose', label: 'San Jose' }
                    ]}
                    placeholder="Search for a city..."
                    helperText="Type to filter cities"
                  />
                </div>

                {/* Multi-select */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Multi-Select</h3>
                  <Select
                    label="Skills"
                    value={multiSelect}
                    onChange={setMultiSelect}
                    multiple
                    searchable
                    options={[
                      { value: 'react', label: 'React' },
                      { value: 'vue', label: 'Vue' },
                      { value: 'angular', label: 'Angular' },
                      { value: 'svelte', label: 'Svelte' },
                      { value: 'nodejs', label: 'Node.js' },
                      { value: 'python', label: 'Python' },
                      { value: 'java', label: 'Java' },
                      { value: 'go', label: 'Go' }
                    ]}
                    placeholder="Select multiple skills..."
                    helperText="Click to select/deselect multiple options"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Toast Component Section */}
          <section className="mb-12">
            <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
              <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
                <h2 className="text-2xl font-bold text-white">Toast Notifications (Updated)</h2>

                <p className="text-teal-lightest mt-1">In-app notifications for feedback and updates</p>
              </div>

              <div className="p-6 space-y-8">
                {/* Interactive Demo */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive Demo</h3>
                  <div className="bg-gray-50 p-8 rounded-lg border-2 border-gray-200 relative min-h-[200px]">
                    <div className="flex flex-wrap gap-4 mb-8">
                      <Button
                        variant="primary"
                        onClick={() => addToast('Action completed successfully!')}
                      >
                        Show Success Toast
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => addToast('New message received from Sarah')}
                      >
                        Show Message Toast
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => addToast('Connection lost. Retrying...')}
                      >
                        Show Error Toast
                      </Button>
                    </div>

                    <div className="absolute bottom-4 right-4 w-80 pointer-events-none">
                      <ToastContainer
                        toasts={toasts}
                        onDismiss={removeToast}
                        onClick={() => { }}
                      />
                    </div>

                    <p className="text-sm text-gray-500 text-center mt-8">
                      Toasts appear in the bottom-right corner (simulated here)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Typography Section */}
        <section className="mb-12">
          <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
            <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
              <h2 className="text-2xl font-bold text-white">Typography System</h2>
              <p className="text-teal-lightest mt-1">Font families, sizes, and the 5-level teal color palette</p>
            </div>

            <div className="p-6 space-y-8">
              {/* Font Families - Simplified */}
              <div>
                <h3 className="text-2xl font-bold text-teal-dark mb-6">Font Families</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Serif */}
                  <div className="bg-gradient-to-br from-teal-lightest to-white p-6 rounded-lg border-2 border-teal-light">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Serif — Headings</div>
                    <div className="font-serif text-4xl text-gray-900 mb-3">Georgia</div>
                    <div className="text-sm text-gray-600 mb-3">Used for headings, emphasis, and impactful statements</div>
                    <code className="text-xs text-gray-500 block">font-family: Georgia, serif</code>
                  </div>

                  {/* Sans-serif */}
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Sans-serif — Body & UI</div>
                    <div className="font-sans text-4xl text-gray-900 mb-3 font-semibold">Inter</div>
                    <div className="text-sm text-gray-600 mb-3">Used for body text, UI elements, and labels</div>
                    <code className="text-xs text-gray-500 block">font-family: Inter, sans-serif</code>
                  </div>
                </div>

                {/* Usage Guidelines */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Usage Guidelines</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-teal-light rounded-lg p-4 bg-teal-lightest">
                      <div className="text-sm font-semibold text-teal-dark mb-2">✓ Do</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Use serif (Georgia) for all headings</li>
                        <li>• Use sans-serif (Inter) for body text</li>
                        <li>• Maintain consistent hierarchy</li>
                        <li>• Keep line length 45-75 characters</li>
                      </ul>
                    </div>
                    <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="text-sm font-semibold text-red-700 mb-2">✗ Don't</div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Don't mix serif in body paragraphs</li>
                        <li>• Don't use sans-serif for headings</li>
                        <li>• Don't go below 14px for UI text</li>
                        <li>• Don't exceed 90 characters per line</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Type Scale - CEO Presentation Style */}
              <div className="bg-white p-10 rounded-2xl border-2 border-gray-200 shadow-lg">
                <h3 className="text-2xl font-bold text-teal-dark mb-6">Type Scale & Hierarchy</h3>

                <div className="space-y-6">
                  {/* Display Sizes */}
                  <div className="border-b-2 border-gray-100 pb-6">
                    <div className="text-xs uppercase tracking-widest text-teal-dark font-semibold mb-4">Display Sizes — Hero & Headlines</div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">4xl / 36px</span>
                          <span className="text-xs text-gray-500">Hero Headlines</span>
                        </div>
                        <div className="text-4xl font-serif text-gray-900">Display Heading Example</div>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">3xl / 30px</span>
                          <span className="text-xs text-gray-500">Section Headlines</span>
                        </div>
                        <div className="text-3xl font-serif text-gray-900">Section Heading Example</div>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">2xl / 24px</span>
                          <span className="text-xs text-gray-500">Card Headlines</span>
                        </div>
                        <div className="text-2xl font-semibold text-gray-900">Card Heading Example</div>
                      </div>
                    </div>
                  </div>

                  {/* Body Sizes */}
                  <div className="border-b-2 border-gray-100 pb-6">
                    <div className="text-xs uppercase tracking-widest text-teal-dark font-semibold mb-4">Body Sizes — Content & UI</div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">xl / 20px</span>
                          <span className="text-xs text-gray-500">Subheadings</span>
                        </div>
                        <div className="text-xl text-gray-800">Example subheading text for demonstration</div>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">lg / 18px</span>
                          <span className="text-xs text-gray-500">Prominent Body</span>
                        </div>
                        <div className="text-lg text-gray-700">Example prominent body text for demonstration purposes</div>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">base / 16px</span>
                          <span className="text-xs text-gray-500">Standard Body Text</span>
                        </div>
                        <div className="text-base text-gray-700">This is the primary reading size for paragraphs and longer content</div>
                      </div>
                    </div>
                  </div>

                  {/* Small Sizes */}
                  <div>
                    <div className="text-xs uppercase tracking-widest text-teal-dark font-semibold mb-4">Small Sizes — Metadata & Labels</div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">sm / 14px</span>
                          <span className="text-xs text-gray-500">Helper Text, Captions</span>
                        </div>
                        <div className="text-sm text-gray-600">Secondary information and supporting details appear at this size</div>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">xs / 12px</span>
                          <span className="text-xs text-gray-500">Labels, Timestamps</span>
                        </div>
                        <div className="text-xs text-gray-500">Small labels, metadata, and supplementary information</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Font Weights */}
              <div className="bg-white p-10 rounded-2xl border-2 border-gray-200 shadow-lg">
                <h3 className="text-2xl font-bold text-teal-dark mb-6">Font Weights</h3>
                <div className="space-y-6">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Normal / 400</div>
                    <div className="font-normal text-2xl text-gray-900 mb-1">Body Text Weight</div>
                    <p className="font-normal text-base text-gray-600">Standard weight for paragraphs and readable content. Maintains excellent legibility at all sizes.</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Medium / 500</div>
                    <div className="font-medium text-2xl text-gray-900 mb-1">Subtle Emphasis Weight</div>
                    <p className="font-medium text-base text-gray-700">Slightly heavier than normal for gentle emphasis without overwhelming the hierarchy.</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Semibold / 600</div>
                    <div className="font-semibold text-2xl text-gray-900 mb-1">Heading Weight</div>
                    <p className="font-semibold text-base text-gray-800">Perfect for subheadings, labels, and UI elements that need clear distinction.</p>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Bold / 700</div>
                    <div className="font-bold text-2xl text-gray-900 mb-1">Strong Emphasis Weight</div>
                    <p className="font-bold text-base text-gray-900">Maximum emphasis for critical information, calls to action, and primary headings.</p>
                  </div>
                </div>
              </div>

              {/* 5-Level Teal Color Palette - CEO Presentation Style */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-10 rounded-2xl border-2 border-gray-200 shadow-lg">
                <h3 className="text-2xl font-bold text-teal-dark mb-3">Brand Color Palette</h3>
                <p className="text-gray-600 mb-8">A monochromatic teal system designed for harmony, trust, and clarity</p>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Teal Lightest */}
                  <div className="group">
                    <div className="bg-teal-lightest h-32 rounded-t-xl border-2 border-teal-light transition-transform group-hover:scale-105"></div>
                    <div className="bg-white p-4 rounded-b-xl border-2 border-t-0 border-teal-light">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Lightest</div>
                      <div className="font-mono text-sm font-bold text-teal-darkest mb-2">#E6F7F5</div>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        Backgrounds, subtle highlights, gentle accents
                      </div>
                    </div>
                  </div>

                  {/* Teal Light */}
                  <div className="group">
                    <div className="bg-teal-light h-32 rounded-t-xl border-2 border-teal-medium transition-transform group-hover:scale-105"></div>
                    <div className="bg-white p-4 rounded-b-xl border-2 border-t-0 border-teal-medium">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Light</div>
                      <div className="font-mono text-sm font-bold text-teal-darkest mb-2">#B2E5E0</div>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        Borders, secondary elements, hover states
                      </div>
                    </div>
                  </div>

                  {/* Teal Medium - PRIMARY BRAND */}
                  <div className="group">
                    <div className="bg-teal-medium h-32 rounded-t-xl border-2 border-teal-dark transition-transform group-hover:scale-105 relative overflow-hidden">
                      <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-semibold text-teal-dark">
                        PRIMARY
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-b-xl border-2 border-t-0 border-teal-dark">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Medium</div>
                      <div className="font-mono text-sm font-bold text-teal-darkest mb-2">#4DA8B0</div>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        Primary buttons, headers, main brand color
                      </div>
                    </div>
                  </div>

                  {/* Teal Dark */}
                  <div className="group">
                    <div className="bg-teal-dark h-32 rounded-t-xl border-2 border-teal-darkest transition-transform group-hover:scale-105"></div>
                    <div className="bg-white p-4 rounded-b-xl border-2 border-t-0 border-teal-darkest">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Dark</div>
                      <div className="font-mono text-sm font-bold text-teal-darkest mb-2">#275559</div>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        Text, dark buttons, strong emphasis
                      </div>
                    </div>
                  </div>

                  {/* Teal Darkest */}
                  <div className="group">
                    <div className="bg-teal-darkest h-32 rounded-t-xl border-2 border-gray-800 transition-transform group-hover:scale-105"></div>
                    <div className="bg-white p-4 rounded-b-xl border-2 border-t-0 border-gray-800">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Darkest</div>
                      <div className="font-mono text-sm font-bold text-teal-darkest mb-2">#1A3E41</div>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        Hover states, deep contrast, shadows
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Usage Examples */}
                <div className="mt-8 pt-8 border-t-2 border-gray-200">
                  <div className="text-xs uppercase tracking-widest text-teal-dark font-semibold mb-4">Color In Context</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-teal-lightest p-6 rounded-xl border-2 border-teal-light">
                      <div className="text-teal-dark font-semibold mb-2">Light Background</div>
                      <p className="text-teal-dark text-sm">Perfect for cards, panels, and subtle section backgrounds that need gentle visual separation.</p>
                    </div>
                    <div className="bg-teal-medium p-6 rounded-xl border-2 border-teal-dark">
                      <div className="text-white font-semibold mb-2">Primary Actions</div>
                      <p className="text-white text-sm">Use for call-to-action buttons, active states, and primary interactive elements.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border-2 border-teal-light">
                      <div className="text-teal-dark font-semibold mb-2">Text on White</div>
                      <p className="text-teal-dark text-sm">Use teal-dark or teal-darkest for headings on white backgrounds for maximum readability.</p>
                    </div>
                    <div className="bg-teal-dark p-6 rounded-xl border-2 border-teal-darkest">
                      <div className="text-teal-lightest font-semibold mb-2">Dark Backgrounds</div>
                      <p className="text-teal-lightest text-sm">Use teal-lightest text on dark teal backgrounds for optimal contrast and elegance.</p>
                    </div>
                  </div>
                </div>

                {/* Accessibility Guidelines */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Accessibility</h4>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• <strong>Minimum Body Text:</strong> 16px (1rem) for optimal readability</li>
                      <li>• <strong>Minimum UI Text:</strong> 14px for labels, captions, and small UI elements</li>
                      <li>• <strong>Line Height:</strong> 1.5 (150%) for body text, 1.2 (120%) for headings</li>
                      <li>• <strong>Line Length:</strong> 45-75 characters for optimal reading</li>
                      <li>• <strong>Paragraph Spacing:</strong> At least 1.5x the line height</li>
                      <li>• <strong>Letter Spacing:</strong> At least 0.12x the font size</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section>
          <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
            <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
              <h2 className="text-2xl font-bold text-white">Documentation Resources</h2>
              <p className="text-teal-lightest mt-1">Quick reference for developers</p>
            </div>
            <div className="p-6 text-green-400 font-mono text-sm overflow-x-auto">
              <pre className="leading-relaxed">{`// FONT FAMILIES
font-serif     → Georgia, Cambria, Times New Roman
font-sans      → Inter, system-ui, -apple-system

// BRAND COLOR PALETTE (5-Level Teal)
text-teal-lightest   → #E6F7F5  // Light backgrounds, text on dark
text-teal-light      → #B2E5E0  // Borders, secondary elements
text-teal-medium     → #4DA8B0  // PRIMARY - Buttons, headers
text-teal-dark       → #275559  // Headings, emphasis text
text-teal-darkest    → #1A3E41  // Hover states, deep contrast

// TYPOGRAPHY SCALE
text-xs    → 12px   // Labels, timestamps
text-sm    → 14px   // Helper text, captions
text-base  → 16px   // Body paragraphs (default)
text-lg    → 18px   // Prominent body text
text-xl    → 20px   // Subheadings
text-2xl   → 24px   // Card headings
text-3xl   → 30px   // Section headings
text-4xl   → 36px   // Hero headings`}</pre>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="bg-white border-t-2 border-teal-light mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-center">
              <div className="text-sm text-gray-600">
                Style Guide Documentation
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UIShowcase;
