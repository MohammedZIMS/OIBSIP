import Button from '../../../components/ui/Button.jsx';
import Icon from '../../../components/ui/Icon.jsx';
import PizzaArt from '../../../components/domain/PizzaArt.jsx';

const FACTS = [
  { icon: 'schedule', text: '48-hour slow-fermented dough' },
  { icon: 'fireplace', text: 'Baked in a beechwood-fired oven' },
  { icon: 'local_shipping', text: 'Baked to order, never reheated' },
];

export default function Hero() {
  return (
    <section className="on-dark relative overflow-hidden bg-onion text-crust">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold leading-tight text-parchment sm:text-5xl lg:text-6xl">
            Wood, flour &amp; time. Pure Neapolitan perfection.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed">
            Naturally leavened dough, San Marzano tomatoes and a wood-fired bake. Order a signature pie or build your
            own in four steps.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/#menu">Explore menu &amp; order</Button>
            <Button to="/builder" variant="outlineLight">
              <Icon name="tune" /> Build custom pizza
            </Button>
          </div>
          <ul className="mt-10 space-y-3">
            {FACTS.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm font-medium text-parchment">
                <Icon name={f.icon} className="text-xl text-cheese" />
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        {/* The one bold element: an oversized pizza that bleeds off the edge, lit by an ember glow. */}
        <div className="relative mx-auto h-[300px] w-full max-w-md md:h-[460px] md:max-w-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_50%,rgba(224,152,62,0.38),transparent_62%)]" />
          <PizzaArt
            variant="diavola"
            className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 -rotate-12 drop-shadow-[0_24px_40px_rgba(0,0,0,0.45)] md:left-[56%] md:h-[520px] md:w-[520px]"
          />
        </div>
      </div>
    </section>
  );
}
