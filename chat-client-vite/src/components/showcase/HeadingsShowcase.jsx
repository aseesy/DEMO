import React from 'react';
import { Heading, SectionHeader, Button } from '../ui';
import { DemoCard, DemoSubsection } from './layout';

/**
 * HeadingsShowcase - Heading and SectionHeader component demos
 * Each demo is self-contained (state colocation)
 */
export function HeadingsShowcase() {
  return (
    <>
      <HeadingDemo />
      <SectionHeaderDemo />
      <ProfessionalButtonsDemo />
    </>
  );
}

function HeadingDemo() {
  return (
    <DemoCard
      title="Heading Component"
      description="Professional serif headings for impactful statements"
    >
      <DemoSubsection title="Medium & Small Headings">
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
      </DemoSubsection>

      <DemoSubsection title="Color Options">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <Heading variant="medium" color="dark" as="h3">
              Dark Text
            </Heading>
          </div>
          <div className="bg-white p-4 rounded-lg border-2 border-teal-medium">
            <Heading variant="medium" color="teal" as="h3">
              Teal Text
            </Heading>
          </div>
          <div className="bg-white p-4 rounded-lg border-2 border-teal-light">
            <Heading variant="medium" color="teal-medium" as="h3">
              Teal Medium
            </Heading>
          </div>
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <Heading variant="medium" color="light" as="h3">
              Light Text
            </Heading>
          </div>
        </div>
      </DemoSubsection>
    </DemoCard>
  );
}

function SectionHeaderDemo() {
  return (
    <DemoCard
      title="SectionHeader Component"
      description="Small caps section labels and category headers"
    >
      <DemoSubsection title="Basic Usage">
        <div className="bg-gradient-to-br from-teal-lightest to-white p-8 rounded-lg space-y-4">
          <SectionHeader>Section Header Example</SectionHeader>
          <p className="text-gray-700 text-lg mt-2">
            This is an example paragraph demonstrating how section headers work with body text.
          </p>
        </div>
      </DemoSubsection>

      <DemoSubsection title="Size Variants">
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
      </DemoSubsection>

      <DemoSubsection title="Color Variants">
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
      </DemoSubsection>
    </DemoCard>
  );
}

function ProfessionalButtonsDemo() {
  return (
    <DemoCard title="Professional Button Styles" description="Pill-shaped button variants">
      <DemoSubsection title="Call-to-Action Buttons">
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
      </DemoSubsection>

      <DemoSubsection title="Complete Professional Layout">
        <div className="bg-gradient-to-br from-teal-lightest to-white p-12 rounded-lg text-center">
          <SectionHeader className="mb-4">Section Header</SectionHeader>
          <Heading variant="large" className="mb-6">
            Large Heading <em className="italic">Example</em>
          </Heading>
          <p className="text-gray-700 text-lg mb-8 max-w-3xl mx-auto">
            This is an example paragraph demonstrating a complete layout with section header,
            heading, body text, and action buttons.
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
      </DemoSubsection>
    </DemoCard>
  );
}

export default HeadingsShowcase;
