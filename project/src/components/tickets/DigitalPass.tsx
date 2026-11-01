import type { ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CalendarDays, CheckCircle2, Clock, MapPin } from 'lucide-react';
import CategoryBadge from '@/components/events/CategoryBadge';
import { formatEventDate, formatRegistrationDate, formatTimeRange } from '@/lib/dates';
import { getTicketCode } from '@/lib/tickets';
import type { EventRecord, Registration } from '@/types/event';

interface DigitalPassProps {
  registration: Registration;
  event: EventRecord;
}

export default function DigitalPass({ registration, event }: DigitalPassProps) {
  const checkedIn = registration.checked_in_at !== null;

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/60">
        <div className="flex items-center justify-between gap-3 border-b border-dashed border-slate-700 p-5">
          <div className="min-w-0 space-y-2">
            <CategoryBadge category={event.category} />
            <h3 className="text-lg font-bold leading-snug text-slate-50">{event.title}</h3>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-center">
          <div className="shrink-0 rounded-2xl bg-white p-3 shadow-lg shadow-indigo-500/10">
            <QRCodeSVG value={registration.id} size={156} level="M" fgColor="#0f172a" bgColor="#ffffff" />
          </div>

          <div className="w-full min-w-0 flex-1 space-y-3 text-sm">
            <PassRow icon={<CalendarDays className="h-4 w-4" />} value={formatEventDate(event.event_date)} />
            <PassRow icon={<Clock className="h-4 w-4" />} value={formatTimeRange(event.start_time, event.end_time)} />
            <PassRow icon={<MapPin className="h-4 w-4" />} value={event.venue} />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attendee</p>
                <p className="mt-1 truncate font-semibold text-slate-100">{registration.student_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Roll no</p>
                <p className="mt-1 truncate font-semibold text-slate-100">{registration.roll_no}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-dashed border-slate-700 bg-slate-900/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ticket code</p>
            <p className="font-mono text-lg font-bold tracking-[0.2em] text-indigo-300">{getTicketCode(registration.id)}</p>
          </div>
          {checkedIn ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Checked in
            </span>
          ) : (
            <p className="text-xs text-slate-400">Show this pass at the venue door. Registered {formatRegistrationDate(registration.created_at)}.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PassRow({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex items-start gap-2.5 text-slate-300">
      <span className="mt-0.5 text-indigo-400">{icon}</span>
      <span className="min-w-0 font-medium">{value}</span>
    </div>
  );
}
