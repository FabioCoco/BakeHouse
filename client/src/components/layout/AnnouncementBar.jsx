import useFetch from '../../hooks/useFetch.js';
import { settingsService } from '../../services/settingsService.js';

// One-line store announcement above the navbar. Renders nothing when the admin has not set one.
export default function AnnouncementBar() {
  const { body } = useFetch(() => settingsService.getPublic(), []);
  const text = body?.announcement;

  if (!text) return null;

  return (
    <div role="region" aria-label="Announcement" className="bg-crust px-4 py-2 text-center text-sm font-medium text-surface">
      {text}
    </div>
  );
}
