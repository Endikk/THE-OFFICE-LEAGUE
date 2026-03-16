interface StickyNoteProps {
  children: React.ReactNode;
  rotate?: number;
  color?: 'yellow' | 'pink' | 'blue' | 'green';
  className?: string;
}

const COLORS = {
  yellow: 'bg-[#fff9a8]',
  pink: 'bg-[#ffb8c6]',
  blue: 'bg-[#b8d4ff]',
  green: 'bg-[#b8f0c8]',
};

export default function StickyNote({
  children,
  rotate = -2,
  color = 'yellow',
  className = '',
}: StickyNoteProps) {
  return (
    <div
      className={`sticky-note ${COLORS[color]} ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </div>
  );
}
