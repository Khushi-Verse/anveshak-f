import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  { id: 1, image: "/slider/1.png" },
  { id: 2, image: "/slider/2.png" },
  { id: 3, image: "/slider/3.png" },
  { id: 4, image: "/slider/4.png" },
  { id: 5, image: "/slider/5.png" },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((previous) =>
        previous === slides.length - 1 ? 0 : previous + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrent((previous) =>
      previous === slides.length - 1 ? 0 : previous + 1
    );
  };

  const prevSlide = () => {
    setCurrent((previous) =>
      previous === 0 ? slides.length - 1 : previous - 1
    );
  };

  return (
    <section className="relative w-full overflow-hidden py-8 sm:py-12">

      {/* Background shades and Chakra */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="tricolor-background"></div>

        
      </div>

      {/* Slider */}
      <div className="relative z-10 mx-auto my-2 h-[220px] w-[90%] max-w-6xl overflow-hidden rounded-3xl sm:h-[300px] md:h-[360px] group">

        {/* Slides */}
        <div
          className="flex h-full w-full transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${current * 100}%)`,
          }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="flex h-full min-w-full w-full basis-full flex-shrink-0 items-center justify-center"
            >
              <img
                src={slide.image}
                alt={`Anveshak slide ${slide.id}`}
                className="h-full w-full rounded-2xl object-contain"
              />
            </div>
          ))}
        </div>

        {/* Previous button */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#12345B] shadow-md transition hover:bg-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Next button */}
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#12345B] shadow-md transition hover:bg-white"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-black/40 px-3 py-2 backdrop-blur-md">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.id}
              onClick={() => setCurrent(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                index === current
                  ? "w-7 bg-white"
                  : "w-2.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}