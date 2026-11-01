import { useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { isStartingWithin24Hours } from '@/lib/reminders';
import { listMyRegistrations } from '@/lib/eventService';

export function useStartingSoonReminders(userId: string | null): void {
  const { showToast } = useToast();

  useEffect(() => {
    if (!userId) return;
    let active = true;

    listMyRegistrations(userId)
      .then((rows) => {
        if (!active) return;
        for (const row of rows) {
          if (!row.events || !isStartingWithin24Hours(row.events)) continue;
          const storageKey = `reminder-shown:${row.id}`;
          if (sessionStorage.getItem(storageKey)) continue;
          sessionStorage.setItem(storageKey, '1');
          showToast(`Reminder: ${row.events.title} starts within 24 hours. Your pass is under My registrations.`);
        }
      })
      .catch((err: unknown) => {
        console.error('load reminders failed', err);
      });

    return () => {
      active = false;
    };
  }, [userId, showToast]);
}
