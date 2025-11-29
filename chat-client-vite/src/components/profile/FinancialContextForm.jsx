import React from 'react';

/**
 * FinancialContextForm - Financial context section of profile wizard
 * Feature 010: Comprehensive User Profile System
 *
 * IMPORTANT: This section is ALWAYS PRIVATE. Data is encrypted and never
 * shared with co-parent. Only used by AI to provide context-aware support.
 */

const INCOME_LEVEL_OPTIONS = [
  { value: '', label: 'Select income range' },
  { value: 'under_25k', label: 'Under $25,000' },
  { value: '25_50k', label: '$25,000 - $50,000' },
  { value: '50_75k', label: '$50,000 - $75,000' },
  { value: '75_100k', label: '$75,000 - $100,000' },
  { value: '100_150k', label: '$100,000 - $150,000' },
  { value: 'over_150k', label: 'Over $150,000' },
  { value: 'prefer_not_say', label: 'Prefer not to say' }
];

const INCOME_STABILITY_OPTIONS = [
  { value: '', label: 'Select stability' },
  { value: 'very_stable', label: 'Very stable - steady income' },
  { value: 'mostly_stable', label: 'Mostly stable - occasional variations' },
  { value: 'variable', label: 'Variable - income fluctuates' },
  { value: 'unstable', label: 'Currently unstable' },
  { value: 'prefer_not_say', label: 'Prefer not to say' }
];

const HOUSING_STATUS_OPTIONS = [
  { value: '', label: 'Select housing status' },
  { value: 'own', label: 'Own my home' },
  { value: 'rent', label: 'Renting' },
  { value: 'family', label: 'Living with family' },
  { value: 'transitional', label: 'Transitional housing' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_say', label: 'Prefer not to say' }
];

const HOUSING_TYPE_OPTIONS = [
  { value: '', label: 'Select housing type' },
  { value: 'house', label: 'Single-family house' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo/Townhouse' },
  { value: 'mobile', label: 'Mobile home' },
  { value: 'other', label: 'Other' }
];

const DEBT_STRESS_OPTIONS = [
  { value: '', label: 'Select level' },
  { value: 'none', label: 'No debt concerns' },
  { value: 'manageable', label: 'Manageable - payments on track' },
  { value: 'moderate', label: 'Moderate stress' },
  { value: 'significant', label: 'Significant stress' },
  { value: 'overwhelming', label: 'Overwhelming' },
  { value: 'prefer_not_say', label: 'Prefer not to say' }
];

// Form field component
const FormField = ({ label, children, optional = false }) => (
  <div className="space-y-1.5">
    <label className="flex items-center text-sm font-medium text-gray-700">
      {label}
      {optional && <span className="ml-1 text-gray-400 font-normal">(optional)</span>}
    </label>
    {children}
  </div>
);

// Stress level visual indicator
const StressIndicator = ({ value }) => {
  const levels = {
    none: { color: 'bg-green-500', width: '20%', label: 'No stress' },
    manageable: { color: 'bg-green-400', width: '40%', label: 'Manageable' },
    moderate: { color: 'bg-yellow-400', width: '60%', label: 'Moderate' },
    significant: { color: 'bg-orange-400', width: '80%', label: 'Significant' },
    overwhelming: { color: 'bg-red-500', width: '100%', label: 'Overwhelming' }
  };

  const level = levels[value];
  if (!level) return null;

  return (
    <div className="mt-2">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${level.color} transition-all duration-300`}
          style={{ width: level.width }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{level.label}</p>
    </div>
  );
};

export default function FinancialContextForm({ profileData, updateField }) {
  const selectClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 bg-white";
  const inputClasses = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4DA8B0] focus:border-transparent transition-all text-gray-800 placeholder-gray-400";

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-green-800">Completely Private & Encrypted</h4>
            <p className="text-sm text-green-700 mt-1">
              Your financial information is <strong>never shared</strong> with your co-parent.
              It's encrypted and only used by LiaiZen to provide more understanding support
              around expense discussions.
            </p>
          </div>
        </div>
      </div>

      {/* Income Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4DA8B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Income
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Annual Income Range" optional>
            <select
              value={profileData.finance_income_level || ''}
              onChange={(e) => updateField('finance_income_level', e.target.value)}
              className={selectClasses}
            >
              {INCOME_LEVEL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Income Stability" optional>
            <select
              value={profileData.finance_income_stability || ''}
              onChange={(e) => updateField('finance_income_stability', e.target.value)}
              className={selectClasses}
            >
              {INCOME_STABILITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Employment Benefits" optional>
          <div className="flex flex-wrap gap-3">
            {['Health Insurance', 'Dental', 'Vision', '401k/Retirement', 'Life Insurance', 'None'].map(benefit => (
              <label
                key={benefit}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                  (profileData.finance_employment_benefits || '').includes(benefit)
                    ? 'border-[#4DA8B0] bg-[#4DA8B0]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={(profileData.finance_employment_benefits || '').includes(benefit)}
                  onChange={(e) => {
                    const current = profileData.finance_employment_benefits || '';
                    const benefits = current.split(',').map(b => b.trim()).filter(Boolean);
                    if (e.target.checked) {
                      benefits.push(benefit);
                    } else {
                      const idx = benefits.indexOf(benefit);
                      if (idx > -1) benefits.splice(idx, 1);
                    }
                    updateField('finance_employment_benefits', benefits.join(', '));
                  }}
                  className="w-4 h-4 text-[#4DA8B0] border-gray-300 rounded focus:ring-[#4DA8B0]"
                />
                <span className="text-sm text-gray-700">{benefit}</span>
              </label>
            ))}
          </div>
        </FormField>
      </div>

      {/* Housing Section */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4DA8B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Housing
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Housing Status" optional>
            <select
              value={profileData.finance_housing_status || ''}
              onChange={(e) => updateField('finance_housing_status', e.target.value)}
              className={selectClasses}
            >
              {HOUSING_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Housing Type" optional>
            <select
              value={profileData.finance_housing_type || ''}
              onChange={(e) => updateField('finance_housing_type', e.target.value)}
              className={selectClasses}
            >
              {HOUSING_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Vehicles" optional>
          <input
            type="text"
            value={profileData.finance_vehicles || ''}
            onChange={(e) => updateField('finance_vehicles', e.target.value)}
            placeholder="e.g., 2018 Honda Civic, or 'No vehicle - use public transit'"
            className={inputClasses}
          />
        </FormField>
      </div>

      {/* Financial Stress Section */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4DA8B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Financial Stress
        </h4>

        <FormField label="Current debt/financial stress level" optional>
          <select
            value={profileData.finance_debt_stress || ''}
            onChange={(e) => updateField('finance_debt_stress', e.target.value)}
            className={selectClasses}
          >
            {DEBT_STRESS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <StressIndicator value={profileData.finance_debt_stress} />
        </FormField>
      </div>

      {/* Child Support Section */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4DA8B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Child Support
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Paying child support?" optional>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="support_paying"
                  checked={profileData.finance_support_paying === 'yes'}
                  onChange={() => updateField('finance_support_paying', 'yes')}
                  className="w-4 h-4 text-[#4DA8B0] border-gray-300 focus:ring-[#4DA8B0]"
                />
                <span className="text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="support_paying"
                  checked={profileData.finance_support_paying === 'no'}
                  onChange={() => updateField('finance_support_paying', 'no')}
                  className="w-4 h-4 text-[#4DA8B0] border-gray-300 focus:ring-[#4DA8B0]"
                />
                <span className="text-sm text-gray-700">No</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="support_paying"
                  checked={profileData.finance_support_paying === 'pending'}
                  onChange={() => updateField('finance_support_paying', 'pending')}
                  className="w-4 h-4 text-[#4DA8B0] border-gray-300 focus:ring-[#4DA8B0]"
                />
                <span className="text-sm text-gray-700">Pending</span>
              </label>
            </div>
          </FormField>

          <FormField label="Receiving child support?" optional>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="support_receiving"
                  checked={profileData.finance_support_receiving === 'yes'}
                  onChange={() => updateField('finance_support_receiving', 'yes')}
                  className="w-4 h-4 text-[#4DA8B0] border-gray-300 focus:ring-[#4DA8B0]"
                />
                <span className="text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="support_receiving"
                  checked={profileData.finance_support_receiving === 'no'}
                  onChange={() => updateField('finance_support_receiving', 'no')}
                  className="w-4 h-4 text-[#4DA8B0] border-gray-300 focus:ring-[#4DA8B0]"
                />
                <span className="text-sm text-gray-700">No</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="support_receiving"
                  checked={profileData.finance_support_receiving === 'pending'}
                  onChange={() => updateField('finance_support_receiving', 'pending')}
                  className="w-4 h-4 text-[#4DA8B0] border-gray-300 focus:ring-[#4DA8B0]"
                />
                <span className="text-sm text-gray-700">Pending</span>
              </label>
            </div>
          </FormField>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">Why we ask</p>
            <p className="mt-1 text-amber-700">
              Financial stress can make expense discussions more challenging. When LiaiZen
              understands your situation, it can suggest more sensitive language and realistic
              compromises during expense-related conversations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
