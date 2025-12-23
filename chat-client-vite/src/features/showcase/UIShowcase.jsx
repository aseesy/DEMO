import React from 'react';
import {
  FoundationsSection,
  HeadingsShowcase,
  ButtonsShowcase,
  FormsShowcase,
  TypographyShowcase,
} from './index.js';
import { DocSection, DemoCard } from './layout';

/**
 * UI Component Showcase
 * Interactive documentation and testing page for all design system components
 *
 * @note This is an intentional dev tool for design system documentation
 * Accessible via /ui-showcase route
 */
export function UIShowcase() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-teal-lightest to-white">
      {/* Header */}
      <div className="bg-white border-b-2 border-teal-light shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-5xl font-serif italic text-teal-dark mb-3">Style Guide</h1>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Design tokens, usage guidelines, and visual standards
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <nav className="mb-12 bg-white rounded-xl p-6 border-2 border-teal-light shadow-sm">
          <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
            Quick Navigation
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href="#foundations"
              className="text-teal-dark hover:text-teal-medium transition-colors font-medium"
            >
              Foundations
            </a>
            <a
              href="#components"
              className="text-teal-dark hover:text-teal-medium transition-colors font-medium"
            >
              Components
            </a>
            <a
              href="#forms"
              className="text-teal-dark hover:text-teal-medium transition-colors font-medium"
            >
              Forms
            </a>
            <a
              href="#typography"
              className="text-teal-dark hover:text-teal-medium transition-colors font-medium"
            >
              Typography
            </a>
          </div>
        </nav>

        {/* Foundations Section (uses DocSection internally) */}
        <FoundationsSection />

        {/* Components Section */}
        <DocSection id="components" title="Components" description="Reusable UI components">
          <HeadingsShowcase />
          <ButtonsShowcase />
        </DocSection>

        {/* Forms Section */}
        <DocSection
          id="forms"
          title="Form Components"
          description="Input, select, and modal components"
        >
          <FormsShowcase />
        </DocSection>

        {/* Typography Section */}
        <DocSection
          id="typography"
          title="Typography"
          description="Font families, sizes, and colors"
        >
          <TypographyShowcase />
        </DocSection>

        {/* Documentation Resources */}
        <DemoCard title="Documentation Resources">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ResourceCard
              title="Components"
              desc="Import from src/components/ui"
              code="import { Button, Modal } from '../../components/ui'"
            />
            <ResourceCard
              title="Design Tokens"
              desc="Tailwind CSS custom colors"
              code="bg-teal-medium, text-teal-dark"
            />
            <ResourceCard
              title="Accessibility"
              desc="WCAG 2.1 AA compliant"
              code="Focus states, ARIA labels"
            />
          </div>
        </DemoCard>
      </div>
    </div>
  );
}

function ResourceCard({ title, desc, code }) {
  return (
    <div className="bg-teal-lightest p-4 rounded-lg border-2 border-teal-light">
      <h4 className="font-semibold text-teal-dark mb-2">{title}</h4>
      <p className="text-sm text-gray-600 mb-2">{desc}</p>
      <code className="text-xs bg-white px-2 py-1 rounded block">{code}</code>
    </div>
  );
}

export default UIShowcase;
