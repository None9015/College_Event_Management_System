import type { LucideIcon } from 'lucide-react';
import { BellRing, CalendarSearch, ClipboardCheck, GraduationCap, QrCode, Users } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: CalendarSearch,
    title: 'Discover every event',
    description: 'Search talks, workshops, sports, cultural nights and hackathons, then filter by category or date.',
  },
  {
    icon: QrCode,
    title: 'Digital pass',
    description: 'Register once and get a QR pass in My registrations that staff can scan or verify at the door.',
  },
  {
    icon: Users,
    title: 'Find your team',
    description: 'Hackathon events have a team hub where you can post what you are looking for or request to join a team.',
  },
  {
    icon: BellRing,
    title: 'Never miss a start',
    description: 'Events starting within 24 hours are flagged, and you get a reminder when you open the app.',
  },
];

const STEPS = [
  { title: 'Create your account', description: 'Sign up with your email and add your name and roll number once.' },
  { title: 'Pick an event', description: 'Open any event to read the details, seats left and schedule.' },
  { title: 'Show your pass', description: 'Your pass is saved under My registrations, ready on the day.' },
];

const ORGANIZER_POINTS = [
  'Create, edit and remove events with capacity and schedule details.',
  'See every participant, search the list and export it to a spreadsheet.',
  'Check students in at the venue by scanning their pass or entering the ticket code.',
];

interface AboutPageProps {
  onExplore: () => void;
}

export default function AboutPage({ onExplore }: AboutPageProps) {
  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative max-w-2xl space-y-5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-4xl">
            EventHive is where campus life comes together.
          </h2>
          <p className="text-base leading-relaxed text-slate-300">
            One place to discover what is happening on campus, register in seconds, carry your digital pass and
            build a team for the next hackathon. Built for students and the organizers who run the events.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-50">What you can do</h3>
          <p className="mt-1 text-sm text-slate-400">Everything you need from registration to check-in.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-400/30 transition group-hover:bg-indigo-500/25">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h4 className="mt-4 text-lg font-semibold text-slate-100">{title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md sm:p-8">
          <h3 className="text-xl font-bold text-slate-50">How it works</h3>
          <ol className="mt-6 space-y-6">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-bold text-cyan-300 ring-1 ring-inset ring-cyan-400/30">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-100">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md sm:p-8">
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className="h-5 w-5 text-cyan-300" aria-hidden="true" />
            <h3 className="text-xl font-bold text-slate-50">For organizers</h3>
          </div>
          <ul className="mt-6 space-y-4">
            {ORGANIZER_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/15 via-slate-900/60 to-cyan-500/10 p-8 text-center backdrop-blur-md sm:p-10">
        <h3 className="text-2xl font-bold text-slate-50">Ready for your next event?</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">
          Browse what is on this week and save your spot before seats run out.
        </p>
        <button
          type="button"
          onClick={onExplore}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-indigo-400"
        >
          <CalendarSearch className="h-4 w-4" aria-hidden="true" />
          Explore events
        </button>
      </section>
    </div>
  );
}
