import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

const VARIANTS = {
  primary: 'bg-tomato text-white hover:bg-brick',
  secondary: 'bg-rust text-white hover:bg-brick',
  outline: 'border-2 border-toast text-pan hover:bg-crust/40 dark:border-white/40 dark:text-parchment dark:hover:bg-white/10',
  outlineLight: 'border-2 border-crust text-crust hover:bg-white/10',
  ghost: 'text-pan hover:bg-crust/50 dark:text-parchment dark:hover:bg-white/10',
  danger: 'bg-brick text-white hover:bg-tomato',
};
const SIZES = { md: 'px-5 py-3 text-base', sm: 'px-3 py-1.5 text-sm' };

export default function Button({ to, variant = 'primary', size = 'md', loading = false, disabled, className = '', children, type = 'button', ...rest }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`;
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>;
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Icon name="progress_activity" className="animate-spin" />}
      {children}
    </button>
  );
}
