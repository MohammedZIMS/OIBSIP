import { useLocation } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';

// Placeholder for pages that are not built yet (see docs/plan.md for the build order).
export default function ComingSoon({ title = 'This page' }) {
  const { pathname } = useLocation();
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">{title} is coming soon</h1>
      <p className="mt-3 text-ink-muted">
        <code>{pathname}</code> is not built yet. Head back to the home page.
      </p>
      <Button to="/" className="mt-6">Back to home</Button>
    </section>
  );
}
