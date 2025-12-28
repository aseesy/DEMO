import React from 'react';
import { useProfile } from '../model/useProfile.js';
import PersonalInfoForm from './PersonalInfoForm';
import BackgroundForm from './BackgroundForm';
import MotivationsForm from './MotivationsForm';

/**
 * ProfileWizard - Multi-step profile completion wizard
 * Feature 010: Comprehensive User Profile System
 */

const STEPS = [
  { id: 'personal', title: 'Personal', icon: 'user', description: 'Basic info about you' },
  {
    id: 'motivations',
    title: 'Motivations',
    icon: 'sparkles',
    description: 'Your values and goals',
  },
  { id: 'background', title: 'Background', icon: 'book', description: 'Your story' },
];

// Section field mappings
const SECTION_FIELDS = {
  personal: [
    'first_name',
    'pronouns',
    'birthdate',
    'language',
    'timezone',
    'phone',
    'city',
    'state',
    'zip',
    'work_schedule',
    'schedule_flexibility',
  ],
  motivations: [
    'motivation_values',
    'motivation_goals',
    'motivation_strengths',
    'motivation_improvements',
  ],
  background: [
    'background_birthplace',
    'background_raised',
    'background_family_origin',
    'background_culture',
    'background_religion',
    'background_military',
    'background_military_branch',
    'background_military_status',
    'education_level',
    'education_field',
  ],
};

// Step icons as simple SVG components
const StepIcon = ({ type, isActive, isComplete }) => {
  const baseClass = `w-6 h-6 ${isComplete ? 'text-green-500' : isActive ? 'text-[#4DA8B0]' : 'text-gray-400'}`;

  if (isComplete) {
    return (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  const icons = {
    user: (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    sparkles: (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
    briefcase: (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    heart: (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
    dollar: (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    book: (
      <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

export default function ProfileWizard({ username, onComplete, onClose, initialStep = 0 }) {
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  const [completedSteps, setCompletedSteps] = React.useState(new Set());

  const { profileData, updateField, saveSection, isSavingProfile, profileCompletion, error } =
    useProfile(username);

  // Calculate section completion
  const getSectionCompletion = sectionId => {
    const fields = SECTION_FIELDS[sectionId];
    if (!fields) return 0;

    const filledCount = fields.filter(field => {
      const value = profileData[field];
      return value && value.toString().trim().length > 0;
    }).length;

    return Math.round((filledCount / fields.length) * 100);
  };

  // Handle continue/save
  const handleNext = async () => {
    const currentSection = STEPS[currentStep].id;

    // Save the current section
    const result = await saveSection(SECTION_FIELDS[currentSection]);

    if (result?.success) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));

      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final step complete
        onComplete?.();
      }
    }
  };

  // Handle skip
  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  // Handle back
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render step content
  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'personal':
        return <PersonalInfoForm profileData={profileData} updateField={updateField} />;
      case 'motivations':
        return <MotivationsForm profileData={profileData} updateField={updateField} />;
      case 'background':
        return <BackgroundForm profileData={profileData} updateField={updateField} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] overflow-x-hidden"
      style={{
        paddingTop: 'max(0px, env(safe-area-inset-top))',
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0px, env(safe-area-inset-left))',
        paddingRight: 'max(0px, env(safe-area-inset-right))',
      }}
    >
      <div
        className="bg-white sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{
          maxHeight:
            'calc(100dvh - max(0px, env(safe-area-inset-top)) - max(0px, env(safe-area-inset-bottom)))',
          maxWidth:
            'calc(100vw - max(0px, env(safe-area-inset-left)) - max(0px, env(safe-area-inset-right)))',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center pt-safe">
          <div>
            <h2 className="text-xl font-semibold text-teal-medium">Complete Your Profile</h2>
            <p className="text-sm text-gray-500 mt-0.5">Help LiaiZen understand you better</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`flex flex-col items-center cursor-pointer ${index <= currentStep ? 'opacity-100' : 'opacity-50'}`}
                  onClick={() => index < currentStep && setCurrentStep(index)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                      index === currentStep
                        ? 'bg-[#4DA8B0] text-white'
                        : completedSteps.has(index) || getSectionCompletion(step.id) === 100
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <StepIcon
                      type={step.icon}
                      isActive={index === currentStep}
                      isComplete={
                        completedSteps.has(index) || getSectionCompletion(step.id) === 100
                      }
                    />
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      index === currentStep ? 'text-teal-medium' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      index < currentStep ? 'bg-[#4DA8B0]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Overall progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#4DA8B0] to-[#6dd4b0] transition-all duration-300"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <span className="text-sm font-medium text-teal-medium w-12 text-right">
              {profileCompletion}%
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step Header */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-teal-medium">
              Step {currentStep + 1}: {STEPS[currentStep].title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{STEPS[currentStep].description}</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form Content */}
          {renderStepContent()}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
              currentStep === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Back
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2.5 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Skip for now
            </button>

            <button
              onClick={handleNext}
              disabled={isSavingProfile}
              className="px-6 py-2.5 bg-teal-medium text-white rounded-lg font-medium hover:bg-teal-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSavingProfile ? (
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
                  Saving...
                </>
              ) : currentStep === STEPS.length - 1 ? (
                'Complete'
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
