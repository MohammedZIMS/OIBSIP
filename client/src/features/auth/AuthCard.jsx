export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      {subtitle && <p className="muted mt-2">{subtitle}</p>}
      <div className="mt-6">{children}</div>
      {footer && <p className="muted mt-6 text-center text-sm">{footer}</p>}
    </div>
  );
}
export const FormAlert = ({ children }) => children ? <p role="alert" className="mb-4 rounded-md border-2 border-tomato bg-tomato/10 px-3 py-2 text-sm font-medium text-brick">{children}</p> : null;
export const DemoHint = ({ children }) => (
  <div className="mb-4 rounded-md border-2 border-dashed border-cheese bg-cheese/20 px-3 py-2 text-sm"><strong>Demo mode:</strong> {children}</div>
);
