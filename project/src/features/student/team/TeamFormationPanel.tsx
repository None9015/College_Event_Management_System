import { useCallback, useEffect, useState } from 'react';
import { LogIn, Users } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StatusStates';
import { useAuth } from '@/context/AuthContext';
import TeamListingCard from '@/features/student/team/TeamListingCard';
import TeamListingForm from '@/features/student/team/TeamListingForm';
import {
  getMyRegistrationForEvent,
  listTeamJoinRequests,
  listTeamListings,
} from '@/lib/eventService';
import type { TeamJoinRequest, TeamListing } from '@/types/event';

interface TeamFormationPanelProps {
  eventId: string;
}

interface TeamBoard {
  registered: boolean;
  listings: TeamListing[];
  requests: TeamJoinRequest[];
}

export default function TeamFormationPanel({ eventId }: TeamFormationPanelProps) {
  const { user, openAuthModal } = useAuth();
  const userId = user?.id ?? null;
  const [board, setBoard] = useState<TeamBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [registration, listings, requests] = await Promise.all([
        getMyRegistrationForEvent(eventId, userId),
        listTeamListings(eventId),
        listTeamJoinRequests(),
      ]);
      setBoard({ registered: registration !== null, listings, requests });
    } catch (err) {
      console.error('load team board failed', err);
      setError('We could not load team formation right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [eventId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!userId) {
    return (
      <EmptyState
        title="Sign in to form a team"
        description="Team formation is linked to your student account, so sign in to post a listing or request to join a team."
        icon={<LogIn className="h-7 w-7" aria-hidden="true" />}
        action={
          <button
            type="button"
            onClick={openAuthModal}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
          >
            Sign in
          </button>
        }
      />
    );
  }

  if (loading && !board) return <LoadingState label="Loading teams..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!board) return null;

  if (!board.registered) {
    return (
      <EmptyState
        title="Register to form a team"
        description="Only students registered for this hackathon can post or join team listings. Reserve your seat first."
        icon={<Users className="h-7 w-7" aria-hidden="true" />}
      />
    );
  }

  const ownListing = board.listings.find((listing) => listing.owner_id === userId) ?? null;
  const otherListings = board.listings.filter((listing) => listing.owner_id !== userId);

  return (
    <div className="space-y-6">
      <section aria-labelledby="team-own-heading" className="space-y-3">
        <h3 id="team-own-heading" className="text-sm font-bold uppercase tracking-wide text-slate-400">
          Your team post
        </h3>
        {ownListing ? (
          <TeamListingCard
            listing={ownListing}
            requests={board.requests.filter((request) => request.listing_id === ownListing.id)}
            isOwner
            onChanged={() => void load()}
          />
        ) : (
          <TeamListingForm eventId={eventId} onPosted={() => void load()} />
        )}
      </section>

      <section aria-labelledby="team-open-heading" className="space-y-3">
        <h3 id="team-open-heading" className="text-sm font-bold uppercase tracking-wide text-slate-400">
          Looking for teammates
        </h3>
        {otherListings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-700 px-5 py-8 text-center text-sm text-slate-400">
            No open teams yet. Students who post a listing will appear here.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {otherListings.map((listing) => (
              <li key={listing.id}>
                <TeamListingCard
                  listing={listing}
                  requests={board.requests.filter((request) => request.listing_id === listing.id)}
                  isOwner={false}
                  myRequest={board.requests.find((request) => request.listing_id === listing.id && request.requester_id === userId) ?? null}
                  onChanged={() => void load()}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
