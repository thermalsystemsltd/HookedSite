import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

const screenshots = [
  {
    src: '/screenshots/screenshot1.jpg',
    alt: 'Screenshot 1',
    title: 'Find Your Perfect Fly',
    description: 'Recommeneded Flies based on your location and conditions'
  },
  {
    src: '/screenshots/screenshot2.jpg',
    alt: 'Screenshot 2',
    title: 'Detailed Information',
    description: 'Information about each fly pattern'
  },
  {
    src: '/screenshots/screenshot3.jpg',
    alt: 'Screenshot 3',
    title: 'Large Fly Database',
    description: 'Search, Filter, and Find the perfect fly'
  },
  {
    src: '/screenshots/screenshot4.jpg',
    alt: 'Screenshot 4',
    title: 'Target Species',
    description: 'Pick the perfect fly for the species you want to catch'
  },
  {
    src: '/screenshots/screenshot5.jpg',
    alt: 'Screenshot 5',
    title: 'Log Your Catch',
    description: 'Keep detailed records of your catches'
  },
  {
    src: '/screenshots/screenshot6.jpg',
    alt: 'Screenshot 6',
    title: 'Your Personal Fishing Catch History',
    description: 'Plots where you have caught fish and what flies you used'
  },
  {
    src: '/screenshots/screenshot7.jpg',
    alt: 'Screenshot 7',
    title: 'Personal Fly Box',
    description: 'Keep a record of your confidence flies'
  }
];

export function AppShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
    trackEvent(
      'showcase_navigation',
      'engagement',
      'Next Screenshot'
    );
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
    trackEvent(
      'showcase_navigation',
      'engagement',
      'Previous Screenshot'
    );
  };

  return (
    <section className="py-16 bg-black/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          App Features
        </h2>
        
        <div className="relative max-w-4xl mx-auto">
          {/* Updated Screenshot Display */}
          <div className="relative h-[600px] md:h-[400px] rounded-xl overflow-hidden shadow-2xl">
            <img
              src={screenshots[currentIndex].src}
              alt={screenshots[currentIndex].alt}
              className="w-full h-full object-contain bg-black/40"
            />
            
            {/* Caption */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <h3 className="text-xl font-semibold text-white">
                {screenshots[currentIndex].title}
              </h3>
              <p className="text-white/80">
                {screenshots[currentIndex].description}
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm"
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm"
            aria-label="Next screenshot"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-2 mt-4">
            {screenshots.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                }`}
                aria-label={`Go to screenshot ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 