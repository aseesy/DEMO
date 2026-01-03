import React from 'react';
import { Heading } from '../../../components/ui';

/**
 * TestimonialsSection - Professional testimonials
 */
export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        '"This is an effective tool that family lawyers would welcome. As a family mediator for over 17 years, I think it is a great idea."',
      author: '— Family Mediator',
    },
    {
      quote:
        '"For our family, I could see this helping us adapt better to change. I think it\'s a great idea not only for my family, but for situations at work."',
      author: '— Divorced Mom',
    },
    {
      quote:
        '"I regularly see the impact of divorce on children who go to my school. An app like this would be extremely helpful for the parents and children."',
      author: '— Minister & School Director',
    },
    {
      quote:
        '"Our biggest challenge is being on the same page about how our children should be raised. I could see this being helpful to find a middle ground."',
      author: '— Divorced Mom',
    },
  ];

  return (
    <div
      className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24 bg-gradient-to-br from-teal-lightest to-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-teal-light"
      data-section="testimonials"
    >
      <Heading
        variant="medium"
        color="teal-medium"
        as="h2"
        className="mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl px-4"
      >
        What Professionals Are Saying
      </Heading>
      <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 md:mb-12 text-center max-w-2xl mx-auto px-4">
        Early feedback from family professionals and co-parents
      </p>
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto px-4">
        {testimonials.map((testimonial, i) => (
          <TestimonialCard key={i} {...testimonial} />
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({ quote, author }) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 border-teal-light">
      <StarRating />
      <p className="text-sm sm:text-base text-teal-medium leading-relaxed mb-3 sm:mb-4 italic">
        {quote}
      </p>
      <p className="text-xs sm:text-sm font-semibold text-teal-medium">{author}</p>
    </div>
  );
}

function StarRating() {
  return (
    <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default TestimonialsSection;
