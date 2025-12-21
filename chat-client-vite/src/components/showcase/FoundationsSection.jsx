import React from 'react';
import { DocSection, DemoCard, DemoSubsection } from './layout';

/**
 * FoundationsSection - Color System, Spacing, and Brand Assets
 * Each subsection is self-contained (state colocation)
 */
export function FoundationsSection() {
  return (
    <DocSection
      id="foundations"
      title="Foundations"
      description="Core design tokens and principles"
    >
      <ColorSystemCard />
      <SpacingCard />
      <BrandAssetsCard />
    </DocSection>
  );
}

function ColorSystemCard() {
  return (
    <DemoCard
      title="Color System"
      description="A monochromatic teal palette designed for harmony and accessibility"
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <ColorSwatch
          name="Darkest"
          hex="#1f4447"
          rgb="rgb(31, 68, 71)"
          bgClass="bg-teal-darkest"
          desc="Darkest teal – for text on dark backgrounds"
        />
        <ColorSwatch
          name="Dark"
          hex="#275559"
          rgb="rgb(39, 85, 89)"
          bgClass="bg-teal-dark"
          desc="Dark teal – for headings on light backgrounds"
        />
        <ColorSwatch
          name="Medium"
          hex="#00908B"
          rgb="rgb(0, 144, 139)"
          bgClass="bg-teal-medium"
          primary
        />
        <ColorSwatch
          name="Light"
          hex="#C5E8E4"
          rgb="rgb(197, 232, 228)"
          bgClass="bg-teal-light"
          border
          desc="Light teal – subtle UI backgrounds"
        />
        <ColorSwatch
          name="Lightest"
          hex="#E6F7F5"
          rgb="rgb(230, 247, 245)"
          bgClass="bg-teal-lightest"
          border
          desc="Lightest teal – background fills"
        />
      </div>
      <UsageGuidelines />
      <AccessibilityTable />
      <ColorCombinations />
    </DemoCard>
  );
}

function ColorSwatch({ name, hex, rgb, bgClass, desc, primary, border }) {
  return (
    <div className="space-y-3">
      <div
        className={`h-24 ${bgClass} rounded-lg relative ${border ? 'border-2 border-teal-medium' : ''}`}
      >
        {primary && (
          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-bold text-teal-dark">
            PRIMARY
          </div>
        )}
      </div>
      <div>
        <div className="font-semibold text-sm text-gray-900">{name}</div>
        <code className="text-xs text-gray-600">{hex}</code>
        <div className="text-xs text-gray-500 mt-1">{rgb}</div>
        {desc && <p className="text-xs text-gray-500 mt-1">{desc}</p>}
      </div>
    </div>
  );
}

function UsageGuidelines() {
  return (
    <DemoSubsection title="Usage Guidelines">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-2 border-teal-light rounded-lg p-4 bg-teal-lightest">
          <div className="text-sm font-semibold text-teal-dark mb-2">Do</div>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>Use teal-medium for primary actions</li>
            <li>Use teal-dark for headings on light backgrounds</li>
            <li>Use teal-lightest for subtle backgrounds</li>
          </ul>
        </div>
        <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
          <div className="text-sm font-semibold text-red-700 mb-2">Don't</div>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>Don't use teal-light for body text</li>
            <li>Don't use teal-lightest on white (low contrast)</li>
            <li>Don't mix with other color families</li>
          </ul>
        </div>
      </div>
    </DemoSubsection>
  );
}

function AccessibilityTable() {
  const rows = [
    { combo: 'teal-dark on white', ratio: '7.2:1', rating: 'AAA', pass: true },
    { combo: 'teal-medium on white', ratio: '3.1:1', rating: 'AA (Large)', pass: 'warn' },
    { combo: 'white on teal-dark', ratio: '8.5:1', rating: 'AAA', pass: true },
    { combo: 'white on teal-medium', ratio: '2.8:1', rating: 'Fail', pass: false },
  ];

  return (
    <DemoSubsection title="Accessibility (WCAG 2.1)">
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
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="py-2">{row.combo}</td>
                <td className="py-2 font-mono">{row.ratio}</td>
                <td className="py-2">
                  <span
                    className={`font-semibold ${row.pass === true ? 'text-green-600' : row.pass === 'warn' ? 'text-yellow-600' : 'text-red-600'}`}
                  >
                    {row.rating} {row.pass === true ? '✓' : row.pass === false ? '✗' : ''}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoSubsection>
  );
}

function ColorCombinations() {
  return (
    <DemoSubsection title="Recommended Combinations">
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
    </DemoSubsection>
  );
}

function SpacingCard() {
  const spacings = [
    { name: 'xs / 4px', width: 4, desc: 'Tight spacing' },
    { name: 'sm / 8px', width: 8, desc: 'Internal padding' },
    { name: 'md / 16px', width: 16, desc: 'Default unit' },
    { name: 'lg / 24px', width: 24, desc: 'Between elements' },
    { name: 'xl / 32px', width: 32, desc: 'Between sections' },
    { name: '2xl / 48px', width: 48, desc: 'Major breaks' },
  ];

  return (
    <DemoCard title="Spacing System" description="Consistent spacing creates rhythm and hierarchy">
      <DemoSubsection title="Spacing Scale">
        <div className="space-y-4">
          {spacings.map(s => (
            <div key={s.name} className="flex items-center gap-4">
              <div className="w-24 text-right">
                <code className="text-sm font-mono text-gray-700">{s.name}</code>
              </div>
              <div className="flex-1 bg-gray-100 p-2 rounded">
                <div
                  className="bg-teal-medium rounded"
                  style={{ width: `${s.width}px`, height: '24px' }}
                ></div>
              </div>
              <div className="w-48 text-sm text-gray-600">{s.desc}</div>
            </div>
          ))}
        </div>
      </DemoSubsection>

      <DemoSubsection title="Usage Guidelines">
        <div className="bg-gray-50 p-6 rounded-lg">
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              <strong>xs (4px):</strong> Icon-to-text spacing, badge padding
            </li>
            <li>
              <strong>sm (8px):</strong> Button padding, form field internal spacing
            </li>
            <li>
              <strong>md (16px):</strong> Card padding, default element spacing
            </li>
            <li>
              <strong>lg (24px):</strong> Section spacing, related content groups
            </li>
            <li>
              <strong>xl (32px):</strong> Major section breaks, page margins
            </li>
            <li>
              <strong>2xl (48px):</strong> Page-level spacing, hero sections
            </li>
          </ul>
        </div>
      </DemoSubsection>
    </DemoCard>
  );
}

function BrandAssetsCard() {
  return (
    <DemoCard
      title="Brand Assets & Logo"
      description="Official LiaiZen brand marks and usage guidelines"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border-2 border-gray-200">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-4 font-semibold">
            Primary Logo
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-center justify-center mb-4">
            <img src="/assets/LZlogo.svg" alt="LiaiZen Logo" className="h-16" />
          </div>
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>Usage:</strong> Headers, marketing materials
            </p>
            <p>
              <strong>Path:</strong>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">/assets/LZlogo.svg</code>
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-lightest to-white p-8 rounded-xl border-2 border-teal-light">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-4 font-semibold">
            Icon Mark
          </div>
          <div className="bg-white p-6 rounded-lg border border-teal-light flex items-center justify-center mb-4">
            <img src="/assets/TransB.svg" alt="LiaiZen Icon" className="h-16" />
          </div>
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>Usage:</strong> Favicon, app icon
            </p>
            <p>
              <strong>Path:</strong>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">/assets/TransB.svg</code>
            </p>
          </div>
        </div>
      </div>

      <DemoSubsection title="Logo Usage Guidelines">
        <div className="bg-teal-lightest p-6 rounded-xl border-2 border-teal-light">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-semibold text-teal-dark mb-2">Do:</h5>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Use adequate clear space around the logo</li>
                <li>Maintain aspect ratio when scaling</li>
                <li>Use on white or light teal backgrounds</li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-red-600 mb-2">Don't:</h5>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Stretch, skew, or distort the logo</li>
                <li>Change the color of the "ai" gradient</li>
                <li>Add drop shadows or effects</li>
              </ul>
            </div>
          </div>
        </div>
      </DemoSubsection>
    </DemoCard>
  );
}

export default FoundationsSection;
