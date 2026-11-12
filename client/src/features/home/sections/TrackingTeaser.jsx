import Button from '../../../components/ui/Button.jsx';
import OrderStepper from '../../../components/domain/OrderStepper.jsx';

export default function TrackingTeaser() {
  return (
    <section className="on-dark bg-onion text-parchment">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">Watch your order move from kitchen to door</h2>
        <p className="mt-3 max-w-2xl text-crust">
          Once you pay, your order shows up on your dashboard. Each status change appears live, with no refresh.
        </p>
        <div className="mt-8">
          <p className="mb-3 text-sm font-semibold text-crust">Example order</p>
          <OrderStepper current={1} />
        </div>
        <div className="mt-8">
          <Button to="/orders" variant="outlineLight">Track an active order</Button>
        </div>
      </div>
    </section>
  );
}
