import Icon from "../ui/Icon.jsx";
import { ORDER_STEPS } from "../../utils/status.js";

// current: index of the active step. Steps before it are done.
export default function OrderStepper({ current = 1, tone = "light" }) {
  const muted = tone === "dark" ? "text-ink-dark" : "text-ink-muted";
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {ORDER_STEPS.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "next";
        return (
          <li
            key={s.key}
            aria-current={state === "current" ? "step" : undefined}
            className={`flex items-center gap-3 rounded-md border-2 p-4 ${
              state === "current" ? "border-cheese bg-pan-raised" : "border-white/15"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                state === "done" ? "bg-basil text-white" : state === "current" ? "bg-cheese text-pan" : "border border-ink-dark text-ink-dark"
              }`}
            >
              <Icon name={state === "done" ? "check" : s.icon} />
            </span>
            <span>
              <span className="block font-semibold text-parchment">{s.label}</span>
              <span className={`block text-sm ${muted}`}>
                {state === "done" ? "Completed" : state === "current" ? "Happening now" : "Up next"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
