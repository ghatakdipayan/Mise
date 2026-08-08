import React, { useState } from 'react';

interface OnboardingProps {
  onDismiss: (dontShowAgain: boolean) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onDismiss }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const slides = [
    {
      kicker: 'Cook smarter',
      icon: 'skillet',
      title: 'Dinner from what you already have',
      body: 'Mise turns the food in your kitchen into recipes you can actually make tonight.',
      cta: 'Next',
    },
    {
      kicker: 'No more typing',
      icon: 'add_a_photo',
      title: 'Stock your pantry in seconds',
      body: 'Scan a receipt, connect Instamart, Blinkit or Zepto, or just snap your fridge — we add everything for you.',
      cta: 'Next',
    },
    {
      kicker: 'Waste nothing',
      icon: 'eco',
      title: 'Plan the week, use it all up',
      body: 'Smart suggestions nudge you toward what’s about to expire, so good food never goes to waste.',
      cta: 'Get cooking',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onDismiss(dontShowAgain);
    }
  };

  const slide = slides[currentSlide];

  return (
    <div
      onClick={() => onDismiss(dontShowAgain)}
      className="absolute inset-0 z-[60] bg-[rgba(15,20,17,0.45)] flex items-end lg:items-center lg:justify-center animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full lg:max-w-[420px] lg:max-h-[85%] flex flex-col bg-[var(--bg,#fff)] rounded-t-[26px] lg:rounded-[26px] pt-[10px] animate-sheet-up overflow-hidden"
      >
        {/* Handle + Skip header */}
        <div className="w-[38px] h-[5px] rounded-full bg-[var(--line,#eceeea)] mx-auto mb-1 lg:hidden" />
        <div className="px-[22px] pt-2 pb-1 flex justify-end">
          <button
            onClick={() => onDismiss(dontShowAgain)}
            className="bg-none border-none text-[var(--muted,#717c75)] font-semibold text-[15px] cursor-pointer"
          >
            Skip
          </button>
        </div>

        {/* Slide illustration and text */}
        <div className="px-[30px] pt-1 pb-2 overflow-hidden">
          <div className="w-full aspect-[16/10] max-h-[220px] rounded-[24px] bg-[var(--accent-soft,#e6f4ec)] relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 22px, rgba(21,168,91,0.05) 22px 23px)' }} />
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '84px',
                color: 'var(--accent,#15a85b)',
                fontVariationSettings: "'wght' 300, 'opsz' 48",
              }}
            >
              {slide.icon}
            </span>
          </div>

          <div className="pt-6">
            <div className="text-[12.5px] font-bold tracking-[1.5px] uppercase text-[var(--accent,#15a85b)] mb-2.5">
              {slide.kicker}
            </div>
            <h1 className="font-head text-[24px] leading-[1.15] font-bold tracking-[-0.4px] mb-2.5 text-[var(--text,#15201a)]">
              {slide.title}
            </h1>
            <p className="text-[14.5px] leading-[1.5] text-[var(--muted,#717c75)]">
              {slide.body}
            </p>
          </div>
        </div>

        {/* Actions footer */}
        <div className="p-[16px_22px_26px] border-t border-[var(--line,#eceeea)] flex-none">
          {/* Pagination Dots */}
          <div className="flex gap-[7px] justify-center mb-[18px]">
            {slides.map((_, i) => (
              <div
                key={i}
                className="h-[7px] rounded-full transition-all duration-300"
                style={{
                  width: i === currentSlide ? '22px' : '7px',
                  backgroundColor: i === currentSlide ? 'var(--accent,#15a85b)' : 'var(--line,#eceeea)',
                }}
              />
            ))}
          </div>

          {/* Don't show again */}
          <label className="flex items-center gap-[9px] mb-[16px] cursor-pointer select-none">
            <span
              onClick={() => setDontShowAgain((v) => !v)}
              className="w-[19px] h-[19px] flex-none rounded-[6px] border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: dontShowAgain ? 'var(--accent,#15a85b)' : 'var(--line,#cfd6cd)',
                backgroundColor: dontShowAgain ? 'var(--accent,#15a85b)' : 'transparent',
              }}
            >
              {dontShowAgain && (
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#fff', fontVariationSettings: "'wght' 700" }}>
                  check
                </span>
              )}
            </span>
            <span
              onClick={() => setDontShowAgain((v) => !v)}
              className="text-[13.5px] font-semibold text-[var(--muted,#717c75)]"
            >
              Don't show this again
            </span>
          </label>

          {/* CTA Button */}
          <button
            onClick={handleNext}
            className="w-full h-[54px] border-none rounded-full bg-[var(--accent,#15a85b)] text-white font-bold text-[16px] cursor-pointer flex items-center justify-center gap-2 shadow-[0_10px_24px_-8px_var(--accent,#15a85b)] hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {slide.cta}
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
