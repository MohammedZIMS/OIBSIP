import Button from './Button.jsx';
import Icon from './Icon.jsx';

export const Spinner = ({ label = 'Loading' }) => (
  <div role="status" className="flex items-center justify-center gap-2 py-12 text-ink-muted dark:text-ink-dark">
    <Icon name="progress_activity" className="animate-spin text-2xl" /> <span>{label}…</span>
  </div>
);
export const Skeleton = ({ className = '' }) => <div aria-hidden="true" className={`animate-pulse rounded-md bg-crust/50 dark:bg-white/10 ${className}`} />;

export function EmptyState({ icon = 'inbox', title, children, action }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <Icon name={icon} className="text-4xl text-toast dark:text-cheese" />
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <p className="muted max-w-md">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <Icon name="error" className="text-4xl text-tomato dark:text-tomato-soft" />
      <h3 className="text-lg font-bold">Something went wrong</h3>
      <p className="muted max-w-md">{error?.message ?? 'Please try again.'}</p>
      {onRetry && <Button variant="outline" onClick={() => onRetry()}>Try again</Button>}
    </div>
  );
}
