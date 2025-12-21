import React, { useState } from 'react';
import { Button, Modal, Input, Textarea, Select, Toast, ToastContainer } from '../ui';
import { DemoCard } from './layout';

/**
 * FormsShowcase - Form component demos
 * Each demo is self-contained with its own state (state colocation)
 */
export function FormsShowcase() {
  return (
    <>
      <ModalDemo />
      <InputDemo />
      <TextareaDemo />
      <SelectDemo />
      <ToastDemo />
    </>
  );
}

function ModalDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DemoCard
      title="Modal Component"
      description="Accessible dialog overlays with backdrop and keyboard support"
    >
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Open Demo Modal
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Demo Modal"
        subtitle="This is a subtitle"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Backdrop overlay</li>
          <li>Escape key support</li>
          <li>Scroll locking</li>
          <li>ARIA attributes</li>
        </ul>
      </Modal>
    </DemoCard>
  );
}

function InputDemo() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');

  const validateEmail = value => {
    setEmail(value);
    setEmailError(value && !value.includes('@') ? 'Please enter a valid email' : '');
  };

  return (
    <DemoCard title="Input Component" description="Form inputs with labels, validation, and icons">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={e => validateEmail(e.target.value)}
          placeholder="name@example.com"
          error={emailError}
          hint="We'll never share your email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter password"
          hint="Must be at least 8 characters"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Search" type="search" placeholder="Search..." leftIcon={<SearchIcon />} />
        <Input label="Disabled" value="This input is disabled" disabled />
      </div>
    </DemoCard>
  );
}

function TextareaDemo() {
  const [bio, setBio] = useState('');

  return (
    <DemoCard
      title="Textarea Component"
      description="Multi-line text inputs with character counting"
    >
      <Textarea
        label="Bio"
        value={bio}
        onChange={e => setBio(e.target.value)}
        placeholder="Tell us about yourself..."
        rows={3}
        maxLength={200}
        showCount
        hint="Brief description for your profile"
      />
    </DemoCard>
  );
}

function SelectDemo() {
  const [country, setCountry] = useState('');
  const [interests, setInterests] = useState([]);

  return (
    <DemoCard
      title="Select Component"
      description="Dropdown selects with single and multi-select modes"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Country"
          value={country}
          onChange={e => setCountry(e.target.value)}
          placeholder="Select a country"
          options={[
            { value: 'us', label: 'United States' },
            { value: 'ca', label: 'Canada' },
            { value: 'uk', label: 'United Kingdom' },
          ]}
        />
        <Select
          label="City"
          placeholder="Select a city"
          disabled
          options={[{ value: 'nyc', label: 'New York' }]}
          hint="Select a country first"
        />
      </div>
      <Select
        label="Interests"
        value={interests}
        onChange={setInterests}
        multiple
        placeholder="Select your interests"
        options={[
          { value: 'tech', label: 'Technology' },
          { value: 'design', label: 'Design' },
          { value: 'business', label: 'Business' },
        ]}
      />
    </DemoCard>
  );
}

function ToastDemo() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type) => {
    const id = Date.now();
    setToasts(prev => [
      ...prev,
      {
        id,
        message,
        type,
        sender: 'System',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <DemoCard title="Toast Notifications" description="Transient feedback messages">
      <div className="flex flex-wrap gap-4">
        <Button variant="primary" onClick={() => addToast('Info message', 'info')}>
          Info
        </Button>
        <Button variant="secondary" onClick={() => addToast('Success!', 'success')}>
          Success
        </Button>
        <Button variant="tertiary" onClick={() => addToast('Warning', 'warning')}>
          Warning
        </Button>
        <Button variant="danger" onClick={() => addToast('Error occurred', 'error')}>
          Error
        </Button>
      </div>
      <ToastContainer>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </ToastContainer>
    </DemoCard>
  );
}

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

export default FormsShowcase;
