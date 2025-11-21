import React from 'react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function AddActivityModal({ isOpen, onClose, onSave, activity = null, isSaving = false }) {
  const [formData, setFormData] = React.useState({
    activityName: '',
    description: '',
    location: '',
    instructorContact: '',
    daysOfWeek: [],
    startTime: '',
    endTime: '',
    recurrence: 'weekly',
    startDate: '',
    endDate: '',
    cost: '',
    costFrequency: 'monthly',
    splitType: 'equal',
    splitPercentage: '',
    paidBy: '',
    notes: ''
  });

  // Initialize form when editing
  React.useEffect(() => {
    if (activity) {
      setFormData({
        activityName: activity.activity_name || '',
        description: activity.description || '',
        location: activity.location || '',
        instructorContact: activity.instructor_contact || '',
        daysOfWeek: activity.days_of_week || [],
        startTime: activity.start_time || '',
        endTime: activity.end_time || '',
        recurrence: activity.recurrence || 'weekly',
        startDate: activity.start_date || '',
        endDate: activity.end_date || '',
        cost: activity.cost || '',
        costFrequency: activity.cost_frequency || 'monthly',
        splitType: activity.split_type || 'equal',
        splitPercentage: activity.split_percentage || '',
        paidBy: activity.paid_by || '',
        notes: activity.notes || ''
      });
    } else {
      // Reset form for new activity
      setFormData({
        activityName: '',
        description: '',
        location: '',
        instructorContact: '',
        daysOfWeek: [],
        startTime: '',
        endTime: '',
        recurrence: 'weekly',
        startDate: '',
        endDate: '',
        cost: '',
        costFrequency: 'monthly',
        splitType: 'equal',
        splitPercentage: '',
        paidBy: '',
        notes: ''
      });
    }
  }, [activity, isOpen]);

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-full flex flex-col border-2 border-gray-200 my-auto">
        {/* Header */}
        <div className="border-b-2 border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-[#4DA8B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#4DA8B0]">
              {activity ? 'Edit Activity' : 'Add Activity'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-[#4DA8B0] hover:text-[#4DA8B0] transition-colors p-1 min-w-[36px] min-h-[36px]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 space-y-4 flex-1">
            {/* Activity Name */}
            <div>
              <label className="block text-sm font-semibold text-[#4DA8B0] mb-1.5">
                Activity Name *
              </label>
              <input
                type="text"
                value={formData.activityName}
                onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                placeholder="e.g., Soccer Practice"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[#4DA8B0] mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm resize-none"
                rows={2}
                placeholder="Brief description of the activity"
              />
            </div>

            {/* Schedule Section */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-3">
              <h4 className="font-semibold text-[#4DA8B0] text-sm">Schedule</h4>

              {/* Days of Week */}
              <div>
                <label className="block text-sm font-medium text-[#4DA8B0] mb-2">
                  Days of Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        formData.daysOfWeek.includes(day)
                          ? 'bg-[#4DA8B0] text-white'
                          : 'bg-white text-[#4DA8B0] border border-gray-200 hover:border-[#4DA8B0]'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#4DA8B0] mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4DA8B0] mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm"
                  />
                </div>
              </div>

              {/* Recurrence and Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#4DA8B0] mb-1">
                    Recurrence *
                  </label>
                  <select
                    value={formData.recurrence}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm"
                    required
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4DA8B0] mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4DA8B0] mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#4DA8B0] mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                  placeholder="e.g., Community Center"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4DA8B0] mb-1.5">
                  Instructor Contact
                </label>
                <input
                  type="text"
                  value={formData.instructorContact}
                  onChange={(e) => setFormData({ ...formData, instructorContact: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm"
                  placeholder="e.g., Coach Name: (555) 123-4567"
                />
              </div>
            </div>

            {/* Cost Section */}
            <div className="bg-[#F0F9F8] rounded-lg p-3 space-y-3">
              <h4 className="font-semibold text-[#4DA8B0] text-sm">Cost & Split</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#4DA8B0] mb-1">
                    Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4DA8B0] mb-1">
                    Frequency
                  </label>
                  <select
                    value={formData.costFrequency}
                    onChange={(e) => setFormData({ ...formData, costFrequency: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm"
                  >
                    <option value="one-time">One-time</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi-annually">Semi-Annually</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#4DA8B0] mb-1">
                    Split Type
                  </label>
                  <select
                    value={formData.splitType}
                    onChange={(e) => setFormData({ ...formData, splitType: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm"
                  >
                    <option value="equal">Equal Split (50/50)</option>
                    <option value="custom">Custom Split</option>
                    <option value="full">Full Cost (One Parent)</option>
                  </select>
                </div>
                {formData.splitType === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-[#4DA8B0] mb-1">
                      Your Percentage
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.splitPercentage}
                      onChange={(e) => setFormData({ ...formData, splitPercentage: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm"
                      placeholder="50"
                    />
                  </div>
                )}
                {formData.splitType === 'full' && (
                  <div>
                    <label className="block text-sm font-medium text-[#4DA8B0] mb-1">
                      Paid By
                    </label>
                    <input
                      type="text"
                      value={formData.paidBy}
                      onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] bg-white text-sm"
                      placeholder="e.g., Mom"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-[#4DA8B0] mb-1.5">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#4DA8B0] text-sm resize-none"
                rows={2}
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t-2 border-gray-200 px-4 py-3 flex gap-2 justify-end flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-gray-200 text-[#4DA8B0] rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-[#4DA8B0] text-white rounded-lg hover:bg-[#1f4447] transition-all shadow-sm hover:shadow-md text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : activity ? 'Update' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
