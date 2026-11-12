export default function FounderStory() {
  return (
    <section id="story" className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-5">
      <blockquote className="rounded-lg bg-onion p-8 text-parchment md:col-span-3 md:p-10">
        <p className="font-display text-2xl font-bold leading-snug sm:text-3xl">
          &ldquo;Real Neapolitan pizza cannot be rushed. It takes two days of patience and a very hot fire.&rdquo;
        </p>
        <footer className="mt-6 text-crust">Matteo Rossi, founder and master pizzaiolo</footer>
      </blockquote>
      <div className="md:col-span-2">
        <h2 className="text-3xl font-bold">Great dough is a promise to time</h2>
        <p className="mt-4 leading-relaxed text-ink-muted">
          Every morning our bakers mill organic wheat and stretch each dough ball by hand. We keep the list short: flour,
          water, salt and a living starter. No preservatives, no shortcuts.
        </p>
      </div>
    </section>
  );
}
