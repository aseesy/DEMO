import React from 'react';
import { Link } from 'react-router-dom';

const quizzes = [
  {
    id: 'co-parenting-stance',
    title: 'What is Your Co-Parenting Stance?',
    description: 'Discover your natural approach to co-parenting through 10 real-world scenarios. Are you child-centered, collaborative, boundary-focused, or guarded?',
    duration: '5-7 minutes',
    questions: 10,
    path: '/quizzes/co-parenting-stance',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
];

export function QuizzesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/Logo.svg" alt="LiaiZen" className="h-8 w-8" />
            <span className="text-xl font-semibold text-[#275559]">
              Li<span className="bg-gradient-to-r from-[#4DA8B0] to-[#46BD92] bg-clip-text text-transparent">ai</span>Zen
            </span>
          </Link>
          <Link to="/" className="text-teal-600 hover:text-teal-800 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Co-Parenting Quizzes</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gain insights into your co-parenting style and discover ways to improve communication with your co-parent.
          </p>
        </div>

        {/* Quiz Cards */}
        <div className="grid gap-6">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              to={quiz.path}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 border-2 border-transparent hover:border-teal-300"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-200 transition-colors">
                  {quiz.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors mb-2">
                    {quiz.title}
                  </h2>
                  <p className="text-gray-600 mb-4">{quiz.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {quiz.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {quiz.questions} questions
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 self-center">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg font-medium group-hover:bg-teal-100 transition-colors">
                    Take Quiz
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">More quizzes coming soon!</p>
        </div>
      </div>
    </div>
  );
}

export default QuizzesPage;
