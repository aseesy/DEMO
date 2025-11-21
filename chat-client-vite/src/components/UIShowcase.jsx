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
              {/* Font Families - Technical Specimens */}
              <div>
                <h3 className="text-2xl font-bold text-teal-dark mb-8">Font Family Specimens</h3>

                {/* Serif Font Specimen */}
                <div className="bg-gradient-to-br from-teal-lightest via-white to-teal-lightest p-12 rounded-2xl border-2 border-teal-light mb-8 shadow-lg">
                  <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3 font-sans">Serif Typeface</div>
                  <div className="mb-8">
                    <div className="text-sm text-gray-600 mb-3 font-sans">Font Type Used:</div>
                    <div className="font-serif text-8xl text-gray-900 leading-none">Georgia</div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white/60 p-6 rounded-xl">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-sans">Uppercase Alphabet</div>
                      <div className="font-serif text-3xl text-gray-900 tracking-wide">
                        ABCDEFGHIJKLMNOPQRSTUVWXYZ
                      </div>
                    </div>

                    <div className="bg-white/60 p-6 rounded-xl">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-sans">Lowercase Alphabet</div>
                      <div className="font-serif text-3xl text-gray-900">
                        abcdefghijklmnopqrstuvwxyz
                      </div>
                    </div>

                    <div className="bg-white/60 p-6 rounded-xl">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-sans">Numbers</div>
                      <div className="font-serif text-3xl text-gray-900">
                        0 1 2 3 4 5 6 7 8 9
                      </div>
                    </div>

                    <div className="bg-white/60 p-6 rounded-xl">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-sans">Special Characters & Punctuation</div>
                      <div className="font-serif text-3xl text-gray-900">
                        ! @ # $ % ^ & * ( ) - _ = + [ ] {'{}'} ; : ' " , . / ? \ | ~
                      </div>
                    </div>

                    <div className="bg-white/60 p-6 rounded-xl">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-sans">Font Stack (CSS)</div>
                      <div className="font-mono text-sm text-gray-700 bg-gray-900 text-green-400 p-3 rounded">
                        font-family: Georgia, Cambria, 'Times New Roman', Times, serif;
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sans-Serif Font Specimen */}
                <div className="bg-white p-12 rounded-2xl border-2 border-gray-200 shadow-lg">
                  <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3 font-sans">Sans-Serif Typeface</div>
                  <div className="mb-8">
                    <div className="text-sm text-gray-600 mb-3 font-sans">Font Type Used:</div>
                    <div className="font-sans text-8xl text-gray-900 leading-none font-semibold">Inter</div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-sans">Uppercase Alphabet</div>
                      <div className="font-sans text-3xl text-gray-900 tracking-wide">
                        ABCDEFGHIJKLMNOPQRSTUVWXYZ
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-sans">Lowercase Alphabet</div>
                      <div className="font-sans text-3xl text-gray-900">
                        abcdefghijklmnopqrstuvwxyz
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-sans">Numbers</div>
                      <div className="font-sans text-3xl text-gray-900">
                        0 1 2 3 4 5 6 7 8 9
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-sans">Special Characters & Punctuation</div>
                      <div className="font-sans text-3xl text-gray-900">
                        ! @ # $ % ^ & * ( ) - _ = + [ ] {'{}'} ; : ' " , . / ? \ | ~
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-3 font-sans">Font Stack (CSS)</div>
                      <div className="font-mono text-sm text-gray-700 bg-gray-900 text-green-400 p-3 rounded">
                        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                      </div>
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
                        <div className="text-4xl font-serif text-gray-900">Moving Forward Together</div>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">3xl / 30px</span>
                          <span className="text-xs text-gray-500">Section Headlines</span>
                        </div>
                        <div className="text-3xl font-serif text-gray-900">Professional Mediation & Support</div>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">2xl / 24px</span>
                          <span className="text-xs text-gray-500">Card Headlines</span>
                        </div>
                        <div className="text-2xl font-semibold text-gray-900">Communication Tools</div>
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
                        <div className="text-xl text-gray-800">Expert support for co-parents seeking clarity</div>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">lg / 18px</span>
                          <span className="text-xs text-gray-500">Prominent Body</span>
                        </div>
                        <div className="text-lg text-gray-700">Communication support and scheduling for separated families</div>
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
              </div>

              {/* Real-World Application Examples */}
              <div className="bg-white p-10 rounded-2xl border-2 border-gray-200 shadow-lg">
                <h3 className="text-2xl font-bold text-teal-dark mb-3">Typography in Application</h3>
                <p className="text-gray-600 mb-8">See how these elements come together in real interface patterns</p>

                <div className="space-y-8">
                  {/* Hero Section Example */}
                  <div>
                    <div className="text-xs uppercase tracking-widest text-teal-dark font-semibold mb-3">Hero Section Pattern</div>
                    <div className="bg-gradient-to-br from-teal-lightest to-white p-10 rounded-2xl border-2 border-teal-light">
                      <div className="text-xs uppercase tracking-wider text-teal-medium font-semibold mb-3">PROFESSIONAL MEDIATION</div>
                      <h2 className="font-serif text-5xl text-gray-900 mb-4 leading-tight">
                        Moving forward, <em className="italic">together apart.</em>
                      </h2>
                      <p className="text-lg text-gray-700 max-w-2xl mb-6">
                        Expert communication support and scheduling for co-parents seeking clarity, calm, and stability.
                      </p>
                      <Button variant="teal-solid" size="xl">Get Started Today</Button>
                    </div>
                  </div>

                  {/* Content Card Example */}
                  <div>
                    <div className="text-xs uppercase tracking-widest text-teal-dark font-semibold mb-3">Content Card Pattern</div>
                    <div className="bg-white p-8 rounded-2xl border-2 border-teal-light shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="bg-teal-medium text-white p-3 rounded-xl">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold text-teal-dark mb-2">AI-Mediated Messaging</h3>
                          <p className="text-base text-gray-700 mb-4 leading-relaxed">
                            Real-time message filtering and tone adjustment helps reduce conflict and improve communication quality between co-parents.
                          </p>
                          <div className="flex gap-3">
                            <Button variant="teal-solid" size="medium">Learn More</Button>
                            <Button variant="teal-outline" size="medium">View Demo</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dark Background Example */}
                  <div>
                    <div className="text-xs uppercase tracking-widest text-teal-dark font-semibold mb-3">Dark Background Pattern</div>
                    <div className="bg-teal-dark p-10 rounded-2xl">
                      <div className="max-w-3xl">
                        <h4 className="text-3xl font-serif text-white mb-3 italic">Better co-parenting through better communication</h4>
                        <p className="text-teal-lightest text-lg mb-6 leading-relaxed">
                          Join thousands of separated parents who have improved their communication and reduced conflict using our AI-powered platform.
                        </p>
                        <div className="flex gap-4">
                          <div className="bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl p-4 flex-1">
                            <div className="text-3xl font-bold text-white mb-1">92%</div>
                            <div className="text-teal-lightest text-sm">Report Less Conflict</div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl p-4 flex-1">
                            <div className="text-3xl font-bold text-white mb-1">4.8★</div>
                            <div className="text-teal-lightest text-sm">Average Rating</div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl p-4 flex-1">
                            <div className="text-3xl font-bold text-white mb-1">10k+</div>
                            <div className="text-teal-lightest text-sm">Active Users</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Developer Reference */}
              <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-mono text-green-400">typography-reference.css</div>
                    <div className="text-xs text-gray-500">Developer Quick Reference</div>
                  </div>
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
text-4xl   → 36px   // Hero headings

// RECOMMENDED PATTERNS
<div className="bg-gradient-to-br from-teal-lightest to-white">
  <h1 className="font-serif text-4xl text-gray-900 italic">
    Hero Heading
  </h1>
  <p className="font-sans text-lg text-gray-700">
    Supporting paragraph with readable body text
  </p>
  <Button variant="teal-solid" size="xl">Call to Action</Button>
</div>`}</pre>
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
