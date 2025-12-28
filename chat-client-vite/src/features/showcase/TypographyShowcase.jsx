import React from 'react';
import { DemoCard, DemoSubsection } from './layout';

/**
 * TypographyShowcase - Typography system and font documentation
 * Each subsection is self-contained (state colocation)
 */
export function TypographyShowcase() {
  return (
    <DemoCard
      title="Typography System"
      description="Font families, sizes, and the 5-level teal color palette"
    >
      <FontFamilies />
      <TypeScale />
      <FontWeights />
      <BrandColors />
    </DemoCard>
  );
}

function FontFamilies() {
  return (
    <DemoSubsection title="Font Families">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-teal-lightest to-white p-6 rounded-lg border-2 border-teal-light">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Serif — Headings</div>
          <div className="font-serif text-4xl text-gray-900 mb-3">Georgia</div>
          <div className="text-sm text-gray-600 mb-3">
            Used for headings, emphasis, and impactful statements
          </div>
          <code className="text-xs text-gray-500 block">font-family: Georgia, serif</code>
        </div>
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
            Sans-serif — Body & UI
          </div>
          <div className="font-sans text-4xl text-gray-900 mb-3 font-semibold">Inter</div>
          <div className="text-sm text-gray-600 mb-3">
            Used for body text, UI elements, and labels
          </div>
          <code className="text-xs text-gray-500 block">font-family: Inter, sans-serif</code>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-2 border-teal-light rounded-lg p-4 bg-teal-lightest">
          <div className="text-sm font-semibold text-teal-dark mb-2">Do</div>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>Use serif (Georgia) for all headings</li>
            <li>Use sans-serif (Inter) for body text</li>
            <li>Keep line length 45-75 characters</li>
          </ul>
        </div>
        <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
          <div className="text-sm font-semibold text-red-700 mb-2">Don't</div>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>Don't mix serif in body paragraphs</li>
            <li>Don't use sans-serif for headings</li>
            <li>Don't go below 14px for UI text</li>
          </ul>
        </div>
      </div>
    </DemoSubsection>
  );
}

function TypeScale() {
  const displaySizes = [
    { size: '4xl / 36px', use: 'Hero Headlines', text: 'Display Heading Example' },
    { size: '3xl / 30px', use: 'Section Headlines', text: 'Section Heading Example' },
    { size: '2xl / 24px', use: 'Card Headlines', text: 'Card Heading Example' },
  ];

  const bodySizes = [
    { size: 'xl / 20px', use: 'Subheadings', text: 'Example subheading text' },
    { size: 'lg / 18px', use: 'Prominent Body', text: 'Example prominent body text' },
    { size: 'base / 16px', use: 'Standard Body', text: 'Primary reading size for paragraphs' },
  ];

  const smallSizes = [
    { size: 'sm / 14px', use: 'Helper Text', text: 'Secondary information and details' },
    { size: 'xs / 12px', use: 'Labels', text: 'Small labels and metadata' },
  ];

  return (
    <DemoSubsection title="Type Scale & Hierarchy">
      <div className="bg-white p-10 rounded-2xl border-2 border-gray-200 shadow-lg space-y-6">
        <TypeScaleSection title="Display Sizes — Hero & Headlines" items={displaySizes} serif />
        <TypeScaleSection title="Body Sizes — Content & UI" items={bodySizes} />
        <TypeScaleSection title="Small Sizes — Metadata & Labels" items={smallSizes} noBorder />
      </div>
    </DemoSubsection>
  );
}

function TypeScaleSection({ title, items, serif, noBorder }) {
  const sizeClass = {
    '4xl / 36px': 'text-4xl',
    '3xl / 30px': 'text-3xl',
    '2xl / 24px': 'text-2xl',
    'xl / 20px': 'text-xl',
    'lg / 18px': 'text-lg',
    'base / 16px': 'text-base',
    'sm / 14px': 'text-sm',
    'xs / 12px': 'text-xs',
  };

  return (
    <div className={noBorder ? '' : 'border-b-2 border-gray-100 pb-6'}>
      <div className="text-xs uppercase tracking-widest text-teal-dark font-semibold mb-4">
        {title}
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-mono text-gray-500">{item.size}</span>
              <span className="text-xs text-gray-500">{item.use}</span>
            </div>
            <div className={`${sizeClass[item.size]} ${serif ? 'font-serif' : ''} text-gray-900`}>
              {item.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FontWeights() {
  const weights = [
    {
      weight: 'Normal / 400',
      name: 'Body Text Weight',
      class: 'font-normal',
      desc: 'Standard weight for paragraphs',
    },
    {
      weight: 'Medium / 500',
      name: 'Subtle Emphasis',
      class: 'font-medium',
      desc: 'Gentle emphasis without overwhelming',
    },
    {
      weight: 'Semibold / 600',
      name: 'Heading Weight',
      class: 'font-semibold',
      desc: 'Perfect for subheadings and labels',
    },
    {
      weight: 'Bold / 700',
      name: 'Strong Emphasis',
      class: 'font-bold',
      desc: 'Maximum emphasis for critical info',
    },
  ];

  return (
    <DemoSubsection title="Font Weights">
      <div className="bg-white p-10 rounded-2xl border-2 border-gray-200 shadow-lg space-y-6">
        {weights.map((w, i) => (
          <div key={i}>
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{w.weight}</div>
            <div className={`${w.class} text-2xl text-gray-900 mb-1`}>{w.name}</div>
            <p className={`${w.class} text-base text-gray-600`}>{w.desc}</p>
          </div>
        ))}
      </div>
    </DemoSubsection>
  );
}

function BrandColors() {
  const colors = [
    {
      name: 'Lightest',
      hex: '#E6F7F5',
      bg: 'bg-teal-lightest',
      border: 'border-teal-light',
      use: 'Backgrounds, subtle highlights',
    },
    {
      name: 'Light',
      hex: '#B2E5E0',
      bg: 'bg-teal-light',
      border: 'border-teal-medium',
      use: 'Borders, secondary elements',
    },
    {
      name: 'Medium',
      hex: '#00908B',
      bg: 'bg-teal-medium',
      border: 'border-teal-dark',
      use: 'Primary actions, focus states',
      primary: true,
    },
    {
      name: 'Dark',
      hex: '#00908B',
      bg: 'bg-teal-dark',
      border: 'border-teal-darkest',
      use: 'Text, headings on light',
    },
    {
      name: 'Darkest',
      hex: '#1f4447',
      bg: 'bg-teal-darkest',
      border: 'border-gray-800',
      use: 'Emphasis, dark mode text',
    },
  ];

  return (
    <DemoSubsection title="Brand Color Palette">
      <div className="bg-gradient-to-br from-gray-50 to-white p-10 rounded-2xl border-2 border-gray-200 shadow-lg">
        <p className="text-gray-600 mb-8">
          A monochromatic teal system designed for harmony, trust, and clarity
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {colors.map((c, i) => (
            <div key={i} className="group">
              <div
                className={`${c.bg} h-32 rounded-t-xl border-2 ${c.border} transition-transform group-hover:scale-105 relative`}
              >
                {c.primary && (
                  <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-bold text-teal-dark">
                    PRIMARY
                  </div>
                )}
              </div>
              <div className={`bg-white p-4 rounded-b-xl border-2 border-t-0 ${c.border}`}>
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{c.name}</div>
                <div className="font-mono text-sm font-bold text-teal-darkest mb-2">{c.hex}</div>
                <div className="text-xs text-gray-600 leading-relaxed">{c.use}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DemoSubsection>
  );
}

export default TypographyShowcase;
