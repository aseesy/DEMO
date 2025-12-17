import React from 'react';
import { useProfile } from '../hooks/useProfile.js';
import { useGooglePlaces } from '../hooks/useGooglePlaces.js';
import { Button } from './ui';

export function ProfilePanel({ username }) {
  const {
    profileData,
    isLoadingProfile,
    isSavingProfile,
    error,
    setProfileData,
    updateField,
    saveProfile,
  } = useProfile(username);

  const [showSuccessToast, setShowSuccessToast] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('personal');
  const fileInputRef = React.useRef(null);
  const addressInputRef = React.useRef(null);

  const handlePlaceSelected = React.useCallback((addressComponents) => {
    setProfileData({
      ...profileData,
      address: addressComponents.fullAddress,
      city: addressComponents.city || profileData.city,
      state: addressComponents.state || profileData.state,
      zip: addressComponents.zip || profileData.zip,
    });
  }, [profileData, setProfileData]);

  const { isLoaded: isGoogleMapsLoaded, error: googleMapsError } = useGooglePlaces(
    addressInputRef,
    handlePlaceSelected
  );

  const handlePictureSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profile_picture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    const result = await saveProfile();
    if (result?.success) {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    updateField(name, value);
  };

  const TABS = [
    { id: 'personal', label: 'Personal' },
    { id: 'motivations', label: 'Motivations' },
    { id: 'background', label: 'Background' },
  ];

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-teal-medium" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-80 bg-white border border-teal-medium rounded-lg shadow-lg p-3 z-50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-teal-dark">Profile saved!</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="relative w-14 h-14 rounded-full bg-teal-medium flex items-center justify-center cursor-pointer group overflow-hidden"
          onClick={() => fileInputRef.current?.click()}
        >
          {profileData.profile_picture ? (
            <img src={profileData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-xl font-medium">
              {(profileData.first_name || profileData.username || '?').charAt(0).toUpperCase()}
            </span>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureSelect} className="hidden" />

        <h1 className="flex-1 text-xl font-semibold text-teal-medium">Your Profile</h1>

        <Button
          onClick={handleSaveProfile}
          disabled={isSavingProfile}
          loading={isSavingProfile}
          variant="primary"
          className="bg-teal-medium hover:bg-teal-medium/90 text-white px-6"
        >
          {isSavingProfile ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-teal-medium text-teal-medium'
                : 'border-transparent text-gray-500 hover:text-teal-medium'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'personal' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-teal-medium mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={profileData.first_name || ''}
                  onChange={handleFieldChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-teal-medium mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={profileData.last_name || ''}
                  onChange={handleFieldChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Preferred Name</label>
              <input
                type="text"
                name="preferred_name"
                value={profileData.preferred_name || ''}
                onChange={handleFieldChange}
                placeholder="What you'd like to be called"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone || ''}
                onChange={handleFieldChange}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Address</label>
              <div className="relative">
                <input
                  ref={addressInputRef}
                  type="text"
                  name="address"
                  value={profileData.address || ''}
                  onChange={handleFieldChange}
                  placeholder="Start typing your address..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
                />
                {!isGoogleMapsLoaded && !googleMapsError && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-teal-medium" />
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Section */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Your schedule helps LiaiZen coordinate better.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Work Schedule</label>
              <textarea
                name="work_schedule"
                value={profileData.work_schedule || ''}
                onChange={handleFieldChange}
                placeholder="e.g., Mon-Fri 9-5, rotating shifts, work from home..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Schedule Flexibility</label>
              <select
                name="schedule_flexibility"
                value={profileData.schedule_flexibility || ''}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              >
                <option value="">Select...</option>
                <option value="high">High - I can adjust easily</option>
                <option value="medium">Medium - Some flexibility</option>
                <option value="low">Low - Fixed schedule</option>
              </select>
            </div>
          </>
        )}

        {activeTab === 'motivations' && (
          <>
            {/* Core Values - Multi-select */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-teal-medium mb-2">
                What values are most important to you?
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'honesty', label: 'Honesty' },
                  { value: 'integrity', label: 'Integrity' },
                  { value: 'fairness', label: 'Fairness' },
                  { value: 'responsibility', label: 'Responsibility' },
                  { value: 'respect', label: 'Respect' },
                  { value: 'compassion', label: 'Compassion' },
                  { value: 'justice', label: 'Justice' },
                  { value: 'kindness', label: 'Kindness' },
                  { value: 'empathy', label: 'Empathy' },
                  { value: 'loyalty', label: 'Loyalty' },
                  { value: 'cooperation', label: 'Cooperation' },
                  { value: 'tolerance', label: 'Tolerance' },
                  { value: 'gratitude', label: 'Gratitude' },
                  { value: 'self_discipline', label: 'Self-discipline' },
                  { value: 'humility', label: 'Humility' },
                  { value: 'courage', label: 'Courage' },
                  { value: 'patience', label: 'Patience' },
                  { value: 'perseverance', label: 'Perseverance' },
                  { value: 'authenticity', label: 'Authenticity' },
                  { value: 'reliability', label: 'Reliability' },
                  { value: 'professionalism', label: 'Professionalism' },
                  { value: 'accountability', label: 'Accountability' },
                  { value: 'innovation', label: 'Innovation' },
                  { value: 'teamwork', label: 'Teamwork' }
                ].map(option => {
                  const selectedValues = (profileData.motivation_values || '').split(',').filter(Boolean);
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        const newValues = isSelected
                          ? selectedValues.filter(v => v !== option.value)
                          : [...selectedValues, option.value];
                        updateField('motivation_values', newValues.join(','));
                      }}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-teal-medium text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">
                What are your main goals as a parent?
              </label>
              <textarea
                name="motivation_goals"
                value={profileData.motivation_goals || ''}
                onChange={handleFieldChange}
                placeholder="e.g., Raise a confident, kind child. Maintain a stable routine..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">
                What are your strengths as a parent?
              </label>
              <textarea
                name="motivation_strengths"
                value={profileData.motivation_strengths || ''}
                onChange={handleFieldChange}
                placeholder="e.g., I'm patient, I'm good at explaining things..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">
                What would you like to improve?
              </label>
              <textarea
                name="motivation_improvements"
                value={profileData.motivation_improvements || ''}
                onChange={handleFieldChange}
                placeholder="e.g., Being more patient during stressful moments, better time management..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              />
            </div>

            {/* Info Box */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-800">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <div>
                  <p className="font-medium">Why we ask</p>
                  <p className="mt-1 text-purple-700">
                    Understanding your values and motivations helps LiaiZen provide more personalized support.
                    This information is <strong>completely private</strong> and never shared with your co-parent.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'background' && (
          <>
            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Cultural Background</label>
              <input
                type="text"
                name="background_culture"
                value={profileData.background_culture || ''}
                onChange={handleFieldChange}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Religion</label>
              <input
                type="text"
                name="background_religion"
                value={profileData.background_religion || ''}
                onChange={handleFieldChange}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Education</label>
              <select
                name="education_level"
                value={profileData.education_level || ''}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              >
                <option value="">Select...</option>
                <option value="high_school">High School</option>
                <option value="some_college">Some College</option>
                <option value="associates">Associate's Degree</option>
                <option value="bachelors">Bachelor's Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="doctorate">Doctorate</option>
                <option value="trade_school">Trade/Vocational School</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Field of Study</label>
              <input
                type="text"
                name="education_field"
                value={profileData.education_field || ''}
                onChange={handleFieldChange}
                placeholder="e.g., Business, Engineering, Education"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              />
            </div>

            {/* Health Section */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                Health information is private and only used by LiaiZen to provide better support.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Physical Health Conditions</label>
              <textarea
                name="health_physical_conditions"
                value={profileData.health_physical_conditions || ''}
                onChange={handleFieldChange}
                placeholder="Any conditions that may affect scheduling or availability"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Physical Limitations</label>
              <textarea
                name="health_physical_limitations"
                value={profileData.health_physical_limitations || ''}
                onChange={handleFieldChange}
                placeholder="Any limitations that affect daily activities"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Mental Health</label>
              <textarea
                name="health_mental_conditions"
                value={profileData.health_mental_conditions || ''}
                onChange={handleFieldChange}
                placeholder="Any conditions LiaiZen should be aware of"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Currently in Treatment?</label>
              <select
                name="health_mental_treatment"
                value={profileData.health_mental_treatment || ''}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              >
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-teal-medium mb-1">Substance History</label>
              <select
                name="health_substance_history"
                value={profileData.health_substance_history || ''}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              >
                <option value="">Select...</option>
                <option value="none">None</option>
                <option value="past">Past history</option>
                <option value="current">Currently dealing with</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            {(profileData.health_substance_history === 'past' || profileData.health_substance_history === 'current') && (
              <div>
                <label className="block text-sm font-medium text-teal-medium mb-1">In Recovery?</label>
                <select
                  name="health_in_recovery"
                  value={profileData.health_in_recovery || ''}
                  onChange={handleFieldChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            )}

            {profileData.health_in_recovery === 'yes' && (
              <div>
                <label className="block text-sm font-medium text-teal-medium mb-1">Recovery Duration</label>
                <input
                  type="text"
                  name="health_recovery_duration"
                  value={profileData.health_recovery_duration || ''}
                  onChange={handleFieldChange}
                  placeholder="e.g., 2 years"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
                />
              </div>
            )}

            {/* Additional Context */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-teal-medium mb-1">
                Anything else LiaiZen should know?
              </label>
              <textarea
                name="additional_context"
                value={profileData.additional_context || ''}
                onChange={handleFieldChange}
                placeholder="Share anything else you'd like LiaiZen to know about you..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-medium focus:ring-1 focus:ring-teal-medium"
              />
              <p className="text-xs text-gray-400 mt-1">
                {(profileData.additional_context || '').length}/1000
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
