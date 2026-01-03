import React from 'react';
import { Heading } from '../../../components/ui';

/**
 * ResourcesSection - Blog category links
 */
export function ResourcesSection() {
  const resources = [
    { title: 'Co-Parenting Communication', path: '/co-parenting-communication/' },
    { title: 'High-Conflict Co-Parenting', path: '/high-conflict-co-parenting/' },
    { title: 'Child-Centered Co-Parenting', path: '/child-centered-co-parenting/' },
    { title: 'AI + Co-Parenting Tools', path: '/liaizen-ai-co-parenting/' },
    { title: 'Quizzes', path: '/quizzes' },
  ];

  return (
    <div className="mt-16 mb-24 px-4 sm:px-6 lg:px-8" data-section="resources">
      <div className="max-w-7xl mx-auto">
        <Heading variant="medium" color="dark" as="h2" className="mb-10 text-center">
          Resources
        </Heading>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {resources.map(item => (
            <a
              key={item.path}
              href={item.path}
              className="group block p-6 bg-white border border-teal-light rounded-xl hover:border-teal-medium hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800 group-hover:text-teal-dark transition-colors">
                  {item.title}
                </h3>
                <svg
                  className="w-5 h-5 text-teal-medium opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ResourcesSection;
