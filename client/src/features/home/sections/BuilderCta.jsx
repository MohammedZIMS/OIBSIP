import Button from '../../../components/ui/Button.jsx';
import Icon from '../../../components/ui/Icon.jsx';
import { BUILDER_STEPS } from '../homeData.js';

export default function BuilderCta() {
  return (
    <section className="on-dark bg-pan text-parchment">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="max-w-xl text-3xl font-bold sm:text-4xl">Build your own pie in four steps</h2>
            <p className="mt-3 max-w-xl text-ink-dark">You see the price update as you choose.</p>
          </div>
          <Button to="/builder">
            Launch pizza builder <Icon name="arrow_forward" />
          </Button>
        </div>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BUILDER_STEPS.map((s, i) => (
            <li key={s.title} className="rounded-lg bg-pan-raised p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cheese text-pan">
                  <Icon name={s.icon} className="text-2xl" />
                </span>
                <span className="font-display text-3xl font-extrabold text-crust">{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-crust">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-dark">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
