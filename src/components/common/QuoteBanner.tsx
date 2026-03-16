import { useState, useEffect } from 'react';

const QUOTES = [
  "Would I rather be feared or loved? Easy. Both. I want people to be afraid of how much they love me.",
  "I'm not superstitious, but I am a little stitious.",
  "Sometimes I'll start a sentence and I don't even know where it's going.",
  "You miss 100% of the shots you don't take. — Wayne Gretzky — Michael Scott",
  "I am Beyonce, always.",
  "I declare bankruptcy!",
  "That's what she said.",
  "Well, well, well, how the turntables...",
  "I knew exactly what to do. But in a much more real sense, I had no idea what to do.",
  "I'm an early bird and a night owl. So I'm wise and I have worms.",
  "Wikipedia is the best thing ever. Anyone in the world can write anything they want about any subject.",
  "I am running away from my responsibilities. And it feels good.",
  "Bros before hoes. Why? Because your bros are always there for you.",
  "Guess what, I have flaws. What are they? Oh, I don't know. I sing in the shower.",
  "It's a beautiful morning at Dunder Mifflin. Or, as I like to call it, Great Bratton.",
  "I am dead inside.",
];

export default function QuoteBanner() {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIndex(prev => (prev + 1) % QUOTES.length);
        setFade(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-office-navy-dark/95 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-center gap-2 min-h-[28px]">
        <span className="text-office-mustard text-xs flex-shrink-0">📎</span>
        <p
          className={`text-[11px] text-white/60 italic text-center truncate transition-opacity duration-400 ${
            fade ? 'opacity-100' : 'opacity-0'
          }`}
        >
          "{QUOTES[quoteIndex]}"
          <span className="text-white/30 ml-2 not-italic">— Michael Scott</span>
        </p>
      </div>
    </div>
  );
}
