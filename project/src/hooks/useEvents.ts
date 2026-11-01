import { useCallback, useEffect, useState } from 'react';
import { listEvents } from '@/lib/eventService';
import type { EventWithCount } from '@/types/event';

export function useEvents() {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await listEvents());
    } catch (err) {
      console.error('load events failed', err);
      setError('Could not load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { events, loading, error, reload };
}
