import { Link } from "react-router-dom";

const VARIANTS = {
  primary: "bg-tomato text-white hover:bg-brick",
  secondary: "bg-rust text-white hover:bg-brick",
  outline: "border-2 border-toast text-pan hover:bg-crust/40",
  outlineLight: "border-2 border-crust text-crust hover:bg-white/10",
};

export default function Button({ to, variant = "primary", className = "", children, ...rest }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-base font-semibold transition-colors ${VARIANTS[variant]} ${className}`;
  return to ? (
    <Link to={to} className={cls} {...rest}>{children}</Link>
  ) : (
    <button type="button" className={cls} {...rest}>{children}</button>
  );
}
