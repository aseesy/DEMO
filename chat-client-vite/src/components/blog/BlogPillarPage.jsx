import React from 'react';
import { SectionHeader, Heading } from '../ui';
import { blogStructure } from './blogData';

export function BlogPillarPage({ categoryId }) {
  const category = blogStructure.pillars.find(c => c.id === categoryId);

  if (!category) {
    return <div className="h-dvh flex items-center justify-center">Category not found</div>;
  }

  return (
    <div className="min-h-dvh bg-white pb-nav-mobile pt-nav-mobile overflow-y-auto">
      {/* Pillar Header */}
      <div className="bg-gradient-to-b from-teal-50 to-white pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <SectionHeader color="medium" size="base">
            Resources
          </SectionHeader>
          <h1 className="text-4xl sm:text-5xl font-bold text-teal-dark mb-6 leading-tight mt-4">
            {category.title}
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            {category.description}
          </p>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {category.articles.map(article => (
            <a
              key={article.path}
              href={article.comingSoon ? '#' : article.path}
              onClick={e => article.comingSoon && e.preventDefault()}
              className={`group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 ${article.comingSoon ? 'opacity-70 cursor-default hover:shadow-none hover:border-gray-200' : ''} ${article.featured ? 'md:col-span-2 lg:col-span-3 flex flex-col md:flex-row' : ''}`}
            >
              {/* Placeholder Image Area */}
              <div
                className={`bg-teal-100 ${article.featured ? 'md:w-1/2 min-h-[300px]' : 'h-48'} flex items-center justify-center relative`}
              >
                <svg className="w-16 h-16 text-teal-300" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                {article.comingSoon && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-500 shadow-sm border border-gray-200">
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>

              <div
                className={`p-6 sm:p-8 ${article.featured ? 'md:w-1/2 flex flex-col justify-center' : ''}`}
              >
                {!article.comingSoon && article.date && (
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>{article.date}</span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </div>
                )}
                <h3
                  className={`font-bold text-teal-dark mb-3 ${!article.comingSoon ? 'group-hover:text-teal-medium transition-colors' : ''} ${article.featured ? 'text-2xl sm:text-3xl' : 'text-xl'}`}
                >
                  {article.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{article.excerpt}</p>
                {!article.comingSoon && (
                  <span className="text-teal-medium font-medium group-hover:underline inline-flex items-center gap-1">
                    Read Article
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer / Nav */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <img src="/assets/Logo.svg" alt="LiaiZen" className="h-8 mb-6" />
          <div className="flex gap-6 mb-6">
            <a href="/" className="text-gray-500 hover:text-teal-medium">
              Home
            </a>
            <a href="/liaizen-ai-co-parenting" className="text-gray-500 hover:text-teal-medium">
              LiaiZen AI
            </a>
            <a href="/contact" className="text-gray-500 hover:text-teal-medium">
              Contact
            </a>
          </div>
          <p className="text-gray-500 text-sm">&copy; 2025 LiaiZen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
