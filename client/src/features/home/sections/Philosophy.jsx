import Icon from '../../../components/ui/Icon.jsx';
import { PHILOSOPHY } from '../homeData.js';

export default function Philosophy() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">Old-world methods, no shortcuts</h2>
      <p className="mt-3 max-w-2xl text-ink-muted">
        We skip chemical conditioners and conveyor ovens. Good pizza starts with patient dough.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {PHILOSOPHY.map((p) => (
          <article key={p.title} className="rounded-lg border border-line bg-white p-6 shadow-card">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-crust text-pan">
              <Icon name={p.icon} className="text-2xl" />
            </span>
            <h3 className="mt-4 text-xl font-bold">{p.title}</h3>
            <p className="mt-2 leading-relaxed text-ink-muted">{p.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
