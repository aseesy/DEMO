import React from 'react';

/**
 * PrivacySettings - Privacy controls for profile sections
 * Feature 010: Comprehensive User Profile System
 */

const SECTIONS = [
  {
    id: 'personal',
    key: 'personal_visibility',
    title: 'Personal Information',
    description: 'Name, pronouns, location, timezone',
    icon: 'user',
    defaultValue: 'shared',
  },
  {
    id: 'work',
    key: 'work_visibility',
    title: 'Work & Schedule',
    description: 'Employment, schedule, flexibility',
    icon: 'briefcase',
    defaultValue: 'private',
  },
  {
    id: 'background',
    key: 'background_visibility',
    title: 'Background',
    description: 'Culture, education, military service',
    icon: 'book',
    defaultValue: 'shared',
  },
];

// Icon component
const SectionIcon = ({ type }) => {
  const icons = {
    user: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    briefcase: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    book: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  };
  return icons[type] || icons.user;
};

// Toggle switch component
const Toggle = ({ enabled, onChange, disabled = false }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      disabled ? 'bg-gray-200 cursor-not-allowed' : enabled ? 'bg-[#4DA8B0]' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export default function PrivacySettings({
  settings,
  onChange,
  onPreviewCoParentView,
  isSaving = false,
}) {
  const [showPreviewModal, setShowPreviewModal] = React.useState(false);
  const [previewData, setPreviewData] = React.useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);

  const handleToggle = (sectionKey, currentValue) => {
    const newValue = currentValue === 'shared' ? 'private' : 'shared';
    onChange({
      ...settings,
      [sectionKey]: newValue,
    });
  };

  const handlePreview = async () => {
    if (onPreviewCoParentView) {
      setIsLoadingPreview(true);
      try {
        const data = await onPreviewCoParentView();
        setPreviewData(data);
        setShowPreviewModal(true);
      } catch (err) {
        console.error('Error loading preview:', err);
      } finally {
        setIsLoadingPreview(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-[#275559]">Privacy Settings</h3>
        <p className="text-sm text-gray-500 mt-1">
          Control what information your co-parent can see about you
        </p>
      </div>

      {/* Privacy Legend */}
      <div className="flex flex-wrap gap-3 sm:gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-gray-600">Shared</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
          <span className="text-gray-600">Private</span>
        </div>
      </div>

      {/* Section Controls */}
      <div className="space-y-3">
        {SECTIONS.map(section => {
          const isShared = settings[section.key] === 'shared';

          return (
            <div
              key={section.id}
              className={`p-3 sm:p-4 rounded-lg border transition-colors ${
                isShared ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    isShared ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <SectionIcon type={section.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-800 text-sm sm:text-base">
                      {section.title}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs sm:text-sm font-medium ${isShared ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {isShared ? 'Shared' : 'Private'}
                      </span>
                      <Toggle
                        enabled={isShared}
                        onChange={() => handleToggle(section.key, settings[section.key])}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{section.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Button */}
      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={handlePreview}
          disabled={isLoadingPreview}
          className="w-full px-4 py-3 border-2 border-[#4DA8B0] text-[#275559] rounded-lg font-medium hover:bg-[#4DA8B0]/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoadingPreview ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading preview...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Preview Co-Parent View
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-blue-800">
        <div className="flex gap-2 sm:gap-3">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="min-w-0">
            <p className="font-medium">How privacy works</p>
            <ul className="mt-1.5 sm:mt-2 space-y-1 text-blue-700">
              <li>• <strong>Shared</strong> = visible to co-parent</li>
              <li>• <strong>Private</strong> = AI only</li>
              <li>• Health & financial data is <strong>never shared</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-[#275559]">Co-Parent View</h3>
                <p className="text-sm text-gray-500">This is what your co-parent sees</p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Basic Info */}
                {previewData.first_name && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Name</h4>
                    <p className="text-gray-800">{previewData.first_name}</p>
                  </div>
                )}

                {previewData.pronouns && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Pronouns</h4>
                    <p className="text-gray-800">{previewData.pronouns}</p>
                  </div>
                )}

                {previewData.city && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Location</h4>
                    <p className="text-gray-800">
                      {[previewData.city, previewData.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {previewData.timezone && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Timezone</h4>
                    <p className="text-gray-800">{previewData.timezone}</p>
                  </div>
                )}

                {/* Work Info (if shared) */}
                {previewData.work_schedule && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Work Schedule</h4>
                    <p className="text-gray-800">{previewData.work_schedule}</p>
                  </div>
                )}

                {previewData.schedule_flexibility && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Schedule Flexibility</h4>
                    <p className="text-gray-800 capitalize">{previewData.schedule_flexibility}</p>
                  </div>
                )}

                {/* Background Info (if shared) */}
                {previewData.background_culture && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Cultural Background</h4>
                    <p className="text-gray-800">{previewData.background_culture}</p>
                  </div>
                )}

                {previewData.education_level && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Education</h4>
                    <p className="text-gray-800">
                      {previewData.education_level.replace(/_/g, ' ')}
                      {previewData.education_field && ` in ${previewData.education_field}`}
                    </p>
                  </div>
                )}

                {/* Hidden Fields Notice */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-start gap-2 text-gray-500 text-sm">
                    <svg
                      className="w-4 h-4 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                    <span>
                      Health and financial information is <strong>never</strong> shown to your
                      co-parent.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-full px-4 py-2.5 bg-[#275559] text-white rounded-lg font-medium hover:bg-[#1e4346] transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
