import React, { useState } from 'react';
import { Button } from '../../components/ui';
import { DemoCard, DemoSubsection } from './layout';

/**
 * ButtonsShowcase - Button component demos
 * Each demo manages its own state (state colocation)
 */
export function ButtonsShowcase() {
  return (
    <DemoCard
      title="Button Component"
      description="Flexible, accessible action buttons with multiple variants"
    >
      <VariantsDemo />
      <SizesDemo />
      <StatesDemo />
      <IconsDemo />
      <ToggleDemo />
      <BestPractices />
    </DemoCard>
  );
}

// Each demo is self-contained with its own state
function VariantsDemo() {
  const variants = ['primary', 'secondary', 'tertiary', 'ghost', 'danger'];
  return (
    <DemoSubsection title="Variants">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {variants.map(variant => (
          <div key={variant} className="space-y-2">
            <Button variant={variant}>{variant}</Button>
            <code className="block text-xs bg-gray-100 p-1 rounded">variant="{variant}"</code>
          </div>
        ))}
      </div>
    </DemoSubsection>
  );
}

function SizesDemo() {
  return (
    <DemoSubsection title="Sizes">
      <div className="flex flex-wrap items-end gap-4">
        {['small', 'medium', 'large'].map(size => (
          <Button key={size} variant="primary" size={size}>
            {size}
          </Button>
        ))}
      </div>
    </DemoSubsection>
  );
}

function StatesDemo() {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <DemoSubsection title="States">
      <div className="flex flex-wrap gap-4">
        <Button variant="primary" loading={loading} onClick={handleClick}>
          {loading ? 'Loading...' : 'Click to Load'}
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </div>
    </DemoSubsection>
  );
}

function IconsDemo() {
  return (
    <DemoSubsection title="With Icons">
      <div className="flex flex-wrap gap-4">
        <Button variant="primary" icon={<PlusIcon />}>
          Add Item
        </Button>
        <Button variant="secondary" icon={<EditIcon />}>
          Edit
        </Button>
        <Button variant="danger" icon={<TrashIcon />}>
          Delete
        </Button>
      </div>
    </DemoSubsection>
  );
}

function ToggleDemo() {
  const [selected, setSelected] = useState(['Mon', 'Wed', 'Fri']);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggle = day => {
    setSelected(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));
  };

  return (
    <DemoSubsection title="Toggle Pattern">
      <div className="flex flex-wrap gap-2">
        {days.map(day => (
          <Button
            key={day}
            variant={selected.includes(day) ? 'secondary' : 'tertiary'}
            size="small"
            onClick={() => toggle(day)}
          >
            {day}
          </Button>
        ))}
      </div>
    </DemoSubsection>
  );
}

function BestPractices() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
        <h4 className="font-semibold text-green-800 mb-3">Do's</h4>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>Use semantic variants for different actions</li>
          <li>Provide clear, action-oriented labels</li>
          <li>Use loading states during async operations</li>
          <li>One primary button per section</li>
        </ul>
      </div>
      <div className="bg-red-50 p-6 rounded-xl border-2 border-red-200">
        <h4 className="font-semibold text-red-800 mb-3">Don'ts</h4>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>Don't use too many button styles per page</li>
          <li>Don't use vague labels like "Click Here"</li>
          <li>Don't disable without showing why</li>
          <li>Don't overuse the danger variant</li>
        </ul>
      </div>
    </div>
  );
}

// Icons
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export default ButtonsShowcase;
