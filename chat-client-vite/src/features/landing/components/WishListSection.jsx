import React from 'react';
import { Heading } from '../../../components/ui';
import { wishListIcons } from './icons.jsx';

/**
 * WishListSection - User testimonial wishes/needs section
 */
export function WishListSection() {
  const wishes = [
    { icon: 'edit', text: '"I wish someone could rewrite the message before I send it."' },
    { icon: 'chart', text: '"I want communication that doesn\'t escalate every week."' },
    {
      icon: 'dollar',
      text: '"I\'m tired of paying thousands for things that don\'t actually change anything."',
    },
    { icon: 'shield', text: '"I want a tool that protects my sanity AND my reputation."' },
    { icon: 'heart', text: '"I need help staying calm when they trigger me."' },
    { icon: 'scale', text: '"I want conversations that don\'t end up in court."' },
  ];

  return (
    <div
      className="mt-16 sm:mt-24 md:mt-32 mb-16 sm:mb-24 md:mb-32 bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 text-gray-900 border border-gray-200 shadow-sm opacity-0 translate-y-4 transition-all duration-700 ease-out"
      data-animate="fade-in"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 50%, rgba(197, 232, 228, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(197, 232, 228, 0.15) 0%, transparent 50%)',
      }}
    >
      <div className="max-w-5xl mx-auto">
        <Heading
          variant="medium"
          color="dark"
          as="h2"
          className="mb-6 sm:mb-8 text-center text-xl sm:text-2xl md:text-3xl"
        >
          After talking to real co-parents, their needs couldn't be clearer:
        </Heading>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mt-6 sm:mt-8 md:mt-10 mb-6 sm:mb-8 md:mb-10">
          {wishes.map((wish, i) => (
            <WishCard key={i} icon={wish.icon} text={wish.text} />
          ))}
        </div>

        <div className="text-center mt-6 sm:mt-8 md:mt-10">
          <p className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 px-4">
            <span className="bg-gradient-to-r from-teal-medium via-teal-dark to-teal-medium bg-clip-text text-transparent">
              And that's exactly what LiaiZen was built for.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function WishCard({ icon, text }) {
  return (
    <div className="group bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-light transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-light to-teal-medium rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            {wishListIcons[icon]}
          </svg>
        </div>
        <p className="text-sm sm:text-base italic text-gray-700 flex-1 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export default WishListSection;
