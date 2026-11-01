import type { EventCategory } from '@/types/event';

const CATEGORY_STYLES: Record<EventCategory, string> = {
  Technical: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
  Cultural: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  Sports: 'bg-orange-500/15 text-orange-300 ring-orange-400/30',
  Workshops: 'bg-teal-500/15 text-teal-300 ring-teal-400/30',
  Hackathons: 'bg-rose-500/15 text-rose-300 ring-rose-400/30',
  Seminars: 'bg-lime-500/15 text-lime-300 ring-lime-400/30',
};

export default function CategoryBadge({ category }: { category: EventCategory }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${CATEGORY_STYLES[category]}`}
    >
      {category}
    </span>
  );
}
