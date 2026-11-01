import { CalendarDays, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { CATEGORY_OPTIONS, type EventFilters, type SortOption, type StatusFilter } from '@/lib/eventFilters';

interface EventFiltersBarProps {
  filters: EventFilters;
  onChange: (next: EventFilters) => void;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'soonest', label: 'Soonest first' },
  { value: 'latest', label: 'Latest first' },
  { value: 'availability', label: 'Most seats left' },
  { value: 'title', label: 'Title A-Z' },
];

const fieldClass =
  'h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-slate-100 shadow-sm transition placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20';

export default function EventFiltersBar({ filters, onChange }: EventFiltersBarProps) {
  const update = (patch: Partial<EventFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur-md sm:p-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => update({ search: event.target.value })}
          placeholder="Search events by name or description"
          aria-label="Search events"
          className={`${fieldClass} pl-10`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl label="Status" options={STATUS_OPTIONS} value={filters.status} onChange={(status) => update({ status })} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <SelectField label="Category">
          <select
            value={filters.category}
            onChange={(event) => update({ category: event.target.value as EventFilters['category'] })}
            className={fieldClass}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All categories' : option}
              </option>
            ))}
          </select>
        </SelectField>

        <SelectField label="Sort by">
          <select
            value={filters.sort}
            onChange={(event) => update({ sort: event.target.value as SortOption })}
            className={fieldClass}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SelectField>

        <SelectField label="On a specific date">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="date"
              value={filters.date}
              onChange={(event) => update({ date: event.target.value })}
              className={`${fieldClass} pl-9`}
            />
          </div>
        </SelectField>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => onChange({ ...filters, search: '', category: 'all', date: '' })}
            disabled={!filters.search && filters.category === 'all' && !filters.date}
            className="h-11 w-full rounded-xl px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}
