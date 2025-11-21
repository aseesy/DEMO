import React, { useState } from 'react';
import { Button, Modal, Input, Textarea, Select, Heading, SectionHeader } from './ui';

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
      <div className="bg-white border-b-2 border-teal-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-teal-dark">LiaiZen Design System</h1>
              <p className="text-teal-medium mt-1">Component Library & Documentation</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                Phase 2 Complete
              </span>
              <span className="px-3 py-1 bg-teal-lightest text-teal-dark text-sm font-semibold rounded-full">
                v2.0
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border-2 border-teal-light">
            <div className="text-2xl font-bold text-teal-dark">33</div>
            <div className="text-sm text-teal-medium">Buttons Migrated</div>
          </div>
          <div className="bg-white rounded-lg p-4 border-2 border-teal-light">
            <div className="text-2xl font-bold text-teal-dark">9</div>
            <div className="text-sm text-teal-medium">Files Completed</div>
          </div>
          <div className="bg-white rounded-lg p-4 border-2 border-teal-light">
            <div className="text-2xl font-bold text-teal-dark">100%</div>
            <div className="text-sm text-teal-medium">Token Usage</div>
          </div>
          <div className="bg-white rounded-lg p-4 border-2 border-teal-light">
            <div className="text-2xl font-bold text-teal-dark">400+</div>
            <div className="text-sm text-teal-medium">Lines Removed</div>
          </div>
        </div>

        {/* Heading Component Section */}
        <section className="mb-12">
          <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
            <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
              <h2 className="text-2xl font-bold text-white">Heading Component</h2>
              <p className="text-teal-lightest mt-1">Professional serif headings for impactful statements</p>
            </div>

            <div className="p-6 space-y-8">
              {/* Hero Variant */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Heading</h3>
                <div className="bg-gradient-to-br from-teal-lightest to-white p-8 rounded-lg">
                  <Heading variant="hero">
                    Moving forward, <em className="italic">together apart.</em>
                  </Heading>
                </div>
              </div>

              {/* Large Variant */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Large Heading</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <Heading variant="large" color="teal">
                    Expert communication support
                  </Heading>
                </div>
              </div>

              {/* Medium & Small Variants */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Medium & Small Headings</h3>
                <div className="space-y-4">
                  <div className="bg-white border-2 border-teal-light p-4 rounded-lg">
                    <Heading variant="medium" as="h2">
                      Clarity, calm, and stability for your children
                    </Heading>
                  </div>
                  <div className="bg-white border-2 border-teal-light p-4 rounded-lg">
                    <Heading variant="small" as="h3" color="teal-medium">
                      The neutral ground you need
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

              {/* Code Example */}
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`<Heading variant="hero">
  Moving forward, <em>together apart.</em>
</Heading>

<Heading variant="large" color="teal">
  Expert communication support
</Heading>`}</pre>
              </div>
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
                  <SectionHeader>Professional Mediation & Support</SectionHeader>
                  <p className="text-gray-700 text-lg mt-2">
                    We provide the neutral ground you need. Expert communication support and scheduling for co-parents seeking clarity, calm, and stability for their children.
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
  Professional Mediation & Support
</SectionHeader>

<SectionHeader size="lg" color="dark">
  Our Services
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
              <p className="text-teal-lightest mt-1">New pill-shaped buttons matching the mediation design</p>
            </div>

            <div className="p-6 space-y-8">
              {/* Professional CTA Buttons */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Call-to-Action Buttons (Pill Shape)</h3>
                <div className="bg-gradient-to-br from-teal-lightest to-white p-8 rounded-lg">
                  <div className="flex flex-wrap gap-4 items-center justify-center">
                    <Button variant="teal-solid" size="large">
                      Book Consultation
                    </Button>
                    <Button variant="teal-outline" size="large">
                      How it Works
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
                  <Button variant="teal-outline" size="small">Learn More</Button>
                  <Button variant="teal-outline" size="medium">Get Started</Button>
                  <Button variant="teal-outline" size="large">Contact Us</Button>
                </div>
              </div>

              {/* Full Demo with Heading */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Professional Layout</h3>
                <div className="bg-gradient-to-br from-teal-lightest to-white p-12 rounded-lg text-center">
                  <SectionHeader className="mb-4">Professional Mediation & Support</SectionHeader>
                  <Heading variant="large" className="mb-6">
                    Moving forward, <em className="italic">together apart.</em>
                  </Heading>
                  <p className="text-gray-700 text-lg mb-8 max-w-3xl mx-auto">
                    We provide the neutral ground you need. Expert communication support and scheduling for co-parents seeking clarity, calm, and stability for their children.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <Button variant="teal-solid" size="large">
                      Book Consultation
                    </Button>
                    <Button variant="teal-outline" size="large">
                      How it Works
                    </Button>
                  </div>
                </div>
              </div>

              {/* Code Example */}
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`<SectionHeader>Professional Mediation</SectionHeader>
<Heading variant="hero">
  Moving forward, <em>together apart.</em>
</Heading>
<Button variant="teal-solid" size="large">
  Book Consultation
</Button>
<Button variant="teal-outline" size="large">
  How it Works
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
                    onChange={() => {}}
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
                    onChange={() => {}}
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
                    onChange={() => {}}
                    disabled
                  />
                  <Input
                    label="Read-only"
                    value="Read-only value"
                    onChange={() => {}}
                    readOnly
                  />
                  <Input
                    label="Required"
                    value=""
                    onChange={() => {}}
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
                  onChange={() => {}}
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
                  onChange={() => {}}
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
                    onChange={() => {}}
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

        {/* Design Tokens Section */}
        <section className="mb-12">
          <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
            <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
              <h2 className="text-2xl font-bold text-white">Design Tokens</h2>
              <p className="text-teal-lightest mt-1">Centralized color system used across all components</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-20 bg-teal-darkest rounded-lg flex items-center justify-center text-white font-semibold">
                    teal-darkest
                  </div>
                  <code className="block text-xs text-gray-600">#1f4447</code>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-teal-dark rounded-lg flex items-center justify-center text-white font-semibold">
                    teal-dark
                  </div>
                  <code className="block text-xs text-gray-600">#275559</code>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-teal-medium rounded-lg flex items-center justify-center text-white font-semibold">
                    teal-medium
                  </div>
                  <code className="block text-xs text-gray-600">#4DA8B0</code>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-teal-light rounded-lg flex items-center justify-center text-teal-dark font-semibold border-2 border-teal-medium">
                    teal-light
                  </div>
                  <code className="block text-xs text-gray-600">#C5E8E4</code>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-teal-lightest rounded-lg flex items-center justify-center text-teal-dark font-semibold border-2 border-teal-light">
                    teal-lightest
                  </div>
                  <code className="block text-xs text-gray-600">#E6F7F5</code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="mb-12">
          <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
            <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
              <h2 className="text-2xl font-bold text-white">Typography System</h2>
              <p className="text-teal-lightest mt-1">Font families, sizes, and the 5-level teal color palette</p>
            </div>

            <div className="p-6 space-y-8">
              {/* Font Families */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Font Families</h3>
                <div className="space-y-4">
                  <div className="bg-white border-2 border-gray-200 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Serif - For headings and impactful statements</p>
                    <p className="font-serif text-2xl">Georgia, Cambria, Times New Roman</p>
                    <p className="font-serif text-lg italic mt-2">Moving forward, together apart.</p>
                  </div>
                  <div className="bg-white border-2 border-gray-200 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Sans-serif - For body text and UI elements</p>
                    <p className="font-sans text-2xl">Inter, system-ui, -apple-system</p>
                    <p className="font-sans text-lg mt-2">Expert communication support for co-parents</p>
                  </div>
                </div>
              </div>

              {/* Font Sizes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Font Size Scale</h3>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-4 bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs font-mono text-gray-500 w-16">xs (12px)</span>
                    <span className="text-xs">The quick brown fox jumps over the lazy dog</span>
                  </div>
                  <div className="flex items-baseline gap-4 bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs font-mono text-gray-500 w-16">sm (14px)</span>
                    <span className="text-sm">The quick brown fox jumps over the lazy dog</span>
                  </div>
                  <div className="flex items-baseline gap-4 bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs font-mono text-gray-500 w-16">base (16px)</span>
                    <span className="text-base">The quick brown fox jumps over the lazy dog</span>
                  </div>
                  <div className="flex items-baseline gap-4 bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs font-mono text-gray-500 w-16">lg (18px)</span>
                    <span className="text-lg">The quick brown fox jumps over the lazy dog</span>
                  </div>
                  <div className="flex items-baseline gap-4 bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs font-mono text-gray-500 w-16">xl (20px)</span>
                    <span className="text-xl">The quick brown fox jumps over the lazy dog</span>
                  </div>
                  <div className="flex items-baseline gap-4 bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs font-mono text-gray-500 w-16">2xl (24px)</span>
                    <span className="text-2xl">The quick brown fox</span>
                  </div>
                  <div className="flex items-baseline gap-4 bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs font-mono text-gray-500 w-16">3xl (30px)</span>
                    <span className="text-3xl">The quick brown fox</span>
                  </div>
                  <div className="flex items-baseline gap-4 bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs font-mono text-gray-500 w-16">4xl (36px)</span>
                    <span className="text-4xl">The quick brown</span>
                  </div>
                </div>
              </div>

              {/* Font Weights */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Font Weights</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-normal text-lg">Normal (400) - Body text and paragraphs</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium text-lg">Medium (500) - Subtle emphasis</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-semibold text-lg">Semibold (600) - Headings and labels</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-bold text-lg">Bold (700) - Strong emphasis</span>
                  </div>
                </div>
              </div>

              {/* 5-Level Teal Color Palette */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">5-Level Teal Color Palette</h3>
                <div className="space-y-4">
                  <div className="bg-teal-lightest p-6 rounded-lg border-2 border-teal-light">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-teal-darkest">teal-lightest</span>
                      <code className="text-sm bg-white px-2 py-1 rounded">#E6F7F5</code>
                    </div>
                    <p className="text-sm text-teal-dark">Backgrounds, subtle highlights, gentle accents</p>
                  </div>

                  <div className="bg-teal-light p-6 rounded-lg border-2 border-teal-medium">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-teal-darkest">teal-light</span>
                      <code className="text-sm bg-white px-2 py-1 rounded">#B2E5E0</code>
                    </div>
                    <p className="text-sm text-teal-darkest">Borders, secondary elements, hover states</p>
                  </div>

                  <div className="bg-teal-medium p-6 rounded-lg border-2 border-teal-dark">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">teal-medium</span>
                      <code className="text-sm bg-white/90 px-2 py-1 rounded text-teal-dark">#4DA8B0</code>
                    </div>
                    <p className="text-sm text-white">Primary buttons, section headers, main brand color</p>
                  </div>

                  <div className="bg-teal-dark p-6 rounded-lg border-2 border-teal-darkest">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">teal-dark</span>
                      <code className="text-sm bg-white/90 px-2 py-1 rounded text-teal-darkest">#275559</code>
                    </div>
                    <p className="text-sm text-teal-lightest">Text, dark buttons, strong emphasis</p>
                  </div>

                  <div className="bg-teal-darkest p-6 rounded-lg border-2 border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">teal-darkest</span>
                      <code className="text-sm bg-white/90 px-2 py-1 rounded text-teal-darkest">#1A3E41</code>
                    </div>
                    <p className="text-sm text-teal-lightest">Hover states, deep contrast, shadows</p>
                  </div>
                </div>
              </div>

              {/* Text Colors in Context */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Text Colors in Context</h3>
                <div className="bg-white border-2 border-gray-200 p-6 rounded-lg space-y-4">
                  <p className="text-teal-lightest text-lg">Text in teal-lightest (use on dark backgrounds)</p>
                  <p className="text-teal-light text-lg">Text in teal-light</p>
                  <p className="text-teal-medium text-lg">Text in teal-medium (primary accent color)</p>
                  <p className="text-teal-dark text-lg">Text in teal-dark (main heading color)</p>
                  <p className="text-teal-darkest text-lg">Text in teal-darkest (strong emphasis)</p>
                </div>
              </div>

              {/* Typography Combinations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Combinations</h3>
                <div className="space-y-6">
                  {/* Hero Section */}
                  <div className="bg-gradient-to-br from-teal-lightest to-white p-8 rounded-lg border-2 border-teal-light">
                    <SectionHeader color="medium" className="mb-2">Professional Mediation</SectionHeader>
                    <h2 className="font-serif text-4xl md:text-5xl text-gray-900 mb-4">
                      Moving forward, <em className="italic">together apart.</em>
                    </h2>
                    <p className="text-lg text-gray-700 mb-6">
                      Expert communication support and scheduling for co-parents seeking clarity, calm, and stability.
                    </p>
                    <Button variant="teal-solid" size="large">Get Started</Button>
                  </div>

                  {/* Content Section */}
                  <div className="bg-white p-8 rounded-lg border-2 border-gray-200">
                    <h3 className="text-2xl font-semibold text-teal-dark mb-3">Section Heading (2xl, semibold, teal-dark)</h3>
                    <p className="text-base text-gray-700 mb-4">
                      Body paragraph (base/16px, normal, gray-700). This is the standard text size for readable content. Use Inter or system sans-serif fonts for optimal legibility in long-form text.
                    </p>
                    <p className="text-sm text-gray-600">
                      Small text (sm/14px, normal, gray-600) for secondary information, captions, or helper text.
                    </p>
                  </div>

                  {/* Card */}
                  <div className="bg-teal-dark p-8 rounded-lg text-white">
                    <h4 className="text-xl font-semibold mb-2">Dark Background Card</h4>
                    <p className="text-teal-lightest mb-4">
                      Use teal-lightest text on dark teal backgrounds for optimal contrast and readability.
                    </p>
                    <Button variant="teal-outline" size="medium" className="border-white text-white hover:bg-white/10">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>

              {/* Code Example */}
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`// Font Families
font-serif → Georgia, Cambria, Times New Roman
font-sans → Inter, system-ui, -apple-system

// Teal Palette
text-teal-lightest → #E6F7F5
text-teal-light → #B2E5E0
text-teal-medium → #4DA8B0
text-teal-dark → #275559
text-teal-darkest → #1A3E41

// Example Usage
<h1 className="font-serif text-4xl text-teal-dark">
  Heading
</h1>
<p className="font-sans text-base text-gray-700">
  Body text
</p>`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section>
          <div className="bg-white rounded-xl shadow-lg border-2 border-teal-light overflow-hidden">
            <div className="bg-gradient-to-r from-teal-dark to-teal-medium px-6 py-4">
              <h2 className="text-2xl font-bold text-white">Documentation Resources</h2>
              <p className="text-teal-lightest mt-1">Comprehensive guides and references</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-teal-light rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-teal-dark mb-2">📚 DESIGN_SYSTEM.md</h3>
                  <p className="text-sm text-gray-600 mb-3">Master documentation with complete API reference, usage guidelines, and patterns</p>
                  <code className="text-xs bg-gray-100 p-1 rounded">Desktop/chat/DESIGN_SYSTEM.md</code>
                </div>
                <div className="border-2 border-teal-light rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-teal-dark mb-2">⚡ BUTTON_QUICK_REFERENCE.md</h3>
                  <p className="text-sm text-gray-600 mb-3">Quick lookup guide for common button patterns and props</p>
                  <code className="text-xs bg-gray-100 p-1 rounded">Desktop/chat/BUTTON_QUICK_REFERENCE.md</code>
                </div>
                <div className="border-2 border-teal-light rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-teal-dark mb-2">📊 PHASE_2_COMPLETION_REPORT.md</h3>
                  <p className="text-sm text-gray-600 mb-3">Comprehensive report with metrics, examples, and achievements</p>
                  <code className="text-xs bg-gray-100 p-1 rounded">Desktop/chat/PHASE_2_COMPLETION_REPORT.md</code>
                </div>
                <div className="border-2 border-teal-light rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-teal-dark mb-2">📝 SESSION_SUMMARY.md</h3>
                  <p className="text-sm text-gray-600 mb-3">Complete session overview with ROI analysis and next steps</p>
                  <code className="text-xs bg-gray-100 p-1 rounded">Desktop/chat/SESSION_SUMMARY.md</code>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="bg-white border-t-2 border-teal-light mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              LiaiZen Design System v2.0 - Phase 2 Complete
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>33 Buttons Migrated</span>
              <span>•</span>
              <span>9 Files Completed</span>
              <span>•</span>
              <span>100% Token Usage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UIShowcase;
