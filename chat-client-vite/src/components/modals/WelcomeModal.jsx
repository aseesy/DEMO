import React from 'react';

export function WelcomeModal({ editingTask, onClose, onComplete }) {
  if (!editingTask) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200">
        <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <h3 className="text-2xl font-bold text-gray-900">
            {editingTask.title}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="prose prose-slate max-w-none">
            <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
              {editingTask.description || 'Welcome to LiaiZen! We\'re here to help make co-parenting easier.'}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
          <button
            onClick={onComplete}
            className="px-8 py-2.5 bg-[#275559] text-white rounded-xl font-semibold hover:bg-[#1f4447] transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

