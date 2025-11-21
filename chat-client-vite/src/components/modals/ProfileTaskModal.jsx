import React from 'react';

export function ProfileTaskModal({ editingTask, onClose, onNavigateToProfile }) {
  if (!editingTask) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 pb-24 md:pb-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-full flex flex-col border border-gray-200 my-auto">
        <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <h3 className="text-2xl font-bold text-gray-900">
            {editingTask.title}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-gray-500 hover:text-[#4DA8B0]"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="prose prose-slate max-w-none">
            <p className="text-base text-[#4DA8B0] whitespace-pre-wrap leading-relaxed">
              {editingTask.description || 'Complete your profile to help us personalize your LiaiZen experience.'}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
          <button
            onClick={onNavigateToProfile}
            className="px-8 py-2.5 bg-[#4DA8B0] text-white rounded-xl font-semibold hover:bg-[#1f4447] transition-colors"
          >
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
}

