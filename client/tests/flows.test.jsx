import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderApp } from './helpers.jsx';
import { db } from '../src/api/mock/store.js';

const PASS = 'Str0ng#Pass';

async function register(user, email = 'asha@example.com') {
  await user.type(await screen.findByLabelText('Full name'), 'Asha Rao');
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Phone'), '+919800000000');
  await user.type(screen.getByLabelText('Password'), PASS);
  await user.type(screen.getByLabelText('Confirm password'), PASS);
  await user.click(screen.getByLabelText(/I accept the terms/));
  await user.click(screen.getByRole('button', { name: /create account/i }));
}
const verifyWithCode = async (user, email) => {
  await screen.findByRole('heading', { name: /check your email/i });
  await user.type(screen.getByLabelText('Verification code'), db().users.find((u) => u.email === email).code);
  await user.click(screen.getByRole('button', { name: 'Verify email' }));
  await screen.findByRole('heading', { name: /welcome back, asha/i });
};
const addAddress = async (user) => {
  await user.click(await screen.findByRole('button', { name: /add an address/i }));
  await user.type(screen.getByLabelText('Street address'), '12 Park Road');
  await user.type(screen.getByLabelText('City'), 'Dhaka');
  await user.type(screen.getByLabelText('Pincode'), '560001');
  await user.click(screen.getByRole('button', { name: /save and use/i }));
  await screen.findByText(/12 Park Road/);
};

describe('public pages and guards', () => {
  it('home lists pizzas from the API and the filter works', async () => {
    const { user } = renderApp('/');
    expect(await screen.findByRole('heading', { name: /wood, flour/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Diavola Calabrese' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Truffle' }));
    expect(screen.queryByRole('heading', { name: 'Diavola Calabrese' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tartufo & Funghi' })).toBeInTheDocument();
  });

  it('guests are sent to login from protected pages, and admin pages go to the admin login', async () => {
    const a = renderApp('/dashboard');
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(a.router.state.location.pathname).toBe('/login');
    expect(a.router.state.location.search).toContain('returnTo=%2Fdashboard');
    a.unmount();
    const b = renderApp('/admin/inventory');
    await screen.findByRole('heading', { name: /staff sign in/i });
    expect(b.router.state.location.pathname).toBe('/admin/login');
  });

  it('register validates every field before calling the server', async () => {
    const { user } = renderApp('/register');
    await user.click(await screen.findByRole('button', { name: /create account/i }));
    for (const msg of [/enter your name/i, /valid email/i, /valid phone/i, /does not meet all the rules/i, /you must accept the terms/i]) expect(await screen.findByText(msg)).toBeInTheDocument();
    expect(db().users).toHaveLength(0);
  });

  it('login shows one generic error for bad credentials', async () => {
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'ghost@example.com');
    await user.type(screen.getByLabelText('Password'), 'Wrong#Pass1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('forgot password then reset: new password works, the link works once', async () => {
    const { user, router } = renderApp('/register');
    await register(user);
    await verifyWithCode(user, 'asha@example.com');
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await router.navigate('/forgot-password');
    await user.type(await screen.findByLabelText('Email'), 'asha@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    const open = await screen.findByRole('link', { name: /open the reset page/i });
    await user.click(open);
    await user.type(await screen.findByLabelText('New password'), 'Br4nd#New!x');
    await user.type(screen.getByLabelText('Confirm new password'), 'Br4nd#New!x');
    await user.click(screen.getByRole('button', { name: /update password/i }));
    await screen.findByRole('heading', { name: /welcome back/i });
    await user.type(screen.getByLabelText('Email'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), 'Br4nd#New!x');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByRole('heading', { name: /welcome back, asha/i });
    await router.navigate(open.getAttribute('href')); // reuse the link
    expect(await screen.findByRole('heading', { name: /link has expired/i })).toBeInTheDocument();
  });
});

describe('customer journey', () => {
  it('register, verify, order a pizza, pay, and see it tracked', async () => {
    const { user, router } = renderApp('/register');
    await register(user);
    await verifyWithCode(user, 'asha@example.com');

    const card = (await screen.findByRole('heading', { name: 'Margherita Verace' })).closest('article');
    await user.click(within(card).getByRole('button', { name: /add to order/i }));
    expect(screen.getByRole('link', { name: /cart \(1\)/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /cart/i }));
    await screen.findByRole('heading', { name: /review your order/i });
    await user.click(screen.getByRole('button', { name: /pay/i })); // no address yet
    expect(await screen.findByText(/choose or add a delivery address/i)).toBeInTheDocument();
    await addAddress(user);

    await user.click(screen.getByRole('button', { name: /pay/i }));
    await user.click(await screen.findByRole('button', { name: 'Failure' })); // payment fails first
    expect(await screen.findByText(/payment failed/i)).toBeInTheDocument();
    expect(db().orders.filter((o) => o.status !== 'pending_payment')).toHaveLength(0);
    const stockBefore = db().ingredients.map((i) => i.quantity);

    await user.click(screen.getByRole('button', { name: /pay/i }));
    await user.click(await screen.findByRole('button', { name: 'Success' }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/orders\/ord_/));
    expect(await screen.findByRole('heading', { name: /#ff-/i })).toBeInTheDocument();
    expect((await screen.findAllByText('Order received')).length).toBeGreaterThanOrEqual(2); // badge + tracker step
    expect(screen.getByRole('link', { name: /cart \(0\)/i })).toBeInTheDocument(); // cart cleared
    expect(db().ingredients.map((i) => i.quantity)).not.toEqual(stockBefore); // stock used after payment only
  });

  it('builder: four steps, running price, out-of-stock option disabled, custom pizza saved to the cart (guest is sent to sign in)', async () => {
    const { user, router } = renderApp('/builder');
    expect(await screen.findByRole('heading', { name: /choose your base/i })).toBeInTheDocument();
    const next = screen.getByRole('button', { name: /next/i });
    expect(next).toBeDisabled();
    await user.click(await screen.findByRole('button', { name: /Thin Crust/ }));
    expect(next).toBeEnabled();
    await user.click(next);
    await user.click(await screen.findByRole('button', { name: /Tomato Marinara/ }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findByRole('button', { name: /Vegan Cheese/ })).toBeDisabled(); // seeded out of stock
    await user.click(screen.getByRole('button', { name: /Mozzarella/ }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(await screen.findByRole('button', { name: /^Onion/ }));
    await user.click(screen.getByRole('button', { name: /^Mushroom/ }));
    const panel = screen.getByRole('complementary', { name: /your pizza/i });
    expect(within(panel).getByText('Per pizza')).toBeInTheDocument();
    expect(within(panel).getByText('Mushroom')).toBeInTheDocument();
    expect(within(panel).getByText('Onion')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add to order/i }));
    await screen.findByRole('heading', { name: /welcome back/i }); // guest: checkout needs an account
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toContain('returnTo=%2Fcheckout');
    const saved = JSON.parse(localStorage.getItem('ff_cart'));
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ kind: 'custom', name: 'Custom pizza', qty: 1 });
    expect(saved[0].veggieIds).toHaveLength(2); // the cart survives sign-in
  });
});

describe('admin', () => {
  async function placeOrderAsCustomer() { // uses the same mock API the pages use
    const { mock } = await import('../src/api/mock/index.js');
    const { setToken } = await import('../src/api/client.js');
    const r = await mock.auth.register({ name: 'Rita Das', email: 'rita@example.com', phone: '+919811111111', password: PASS, acceptTerms: true });
    const { token } = await mock.auth.verifyCode({ email: 'rita@example.com', code: r.demo.code });
    setToken('user', token);
    const [p] = await mock.catalogue.pizzas({ search: 'Diavola' });
    const o = await mock.orders.create({ items: [{ kind: 'preset', pizzaId: p.id, qty: 1 }], address: { line1: '5 Lake Rd', city: 'Dhaka', pincode: '560002' }, phone: '+919811111111', notes: 'No onions please' });
    await mock.orders.verifyPayment({ orderId: o.orderId });
    setToken('user', null);
  }
  const adminLogin = async (user) => {
    await user.type(await screen.findByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'Admin#12345');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByRole('heading', { name: /operations dashboard/i });
  };

  it('rejects wrong admin credentials generically', async () => {
    const { user } = renderApp('/admin/login');
    await user.type(await screen.findByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'nope');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('dashboard: new order shows, status advances forward only, customer sees it', async () => {
    await placeOrderAsCustomer();
    const { user, router } = renderApp('/admin/login');
    await adminLogin(user);
    expect(await screen.findByText(/No onions please/)).toBeInTheDocument();
    expect(screen.getByText(/Revenue today/i)).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: /move to kitchen/i }));
    expect(await screen.findByRole('button', { name: /mark sent to delivery/i })).toBeInTheDocument();
    expect(db().orders[0].status).toBe('in_kitchen');

    await router.navigate('/admin/orders');
    expect(await screen.findByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    const row = (await screen.findByText(/Rita Das/)).closest('tr');
    await user.click(within(row).getByRole('link', { name: /#FF-/ }));
    expect(await screen.findByRole('heading', { name: /order #ff-/i })).toBeInTheDocument();
    expect(screen.getByText(/5 Lake Rd/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /mark sent to delivery/i }));
    await waitFor(() => expect(db().orders[0].status).toBe('sent_to_delivery'));
    await waitFor(() => expect(screen.queryByRole('button', { name: /mark sent to delivery/i })).not.toBeInTheDocument());
  });

  it('inventory: low and out states, adjust stock with a ledger entry, add an ingredient, run audit', async () => {
    const { user, router } = renderApp('/admin/login');
    await adminLogin(user);
    await router.navigate('/admin/inventory');
    const jal = (await screen.findByText('Jalapeño')).closest('tr');
    expect(within(jal).getByText('Low stock')).toBeInTheDocument();
    expect(within(screen.getByText('Vegan Cheese').closest('tr')).getByText('Out of stock')).toBeInTheDocument();

    await user.click(within(jal).getByRole('button', { name: 'Adjust' }));
    const dlg = await screen.findByRole('dialog');
    await user.type(within(dlg).getByLabelText(/Change/), '50');
    await user.click(within(dlg).getByRole('button', { name: /confirm and save/i }));
    await waitFor(() => expect(db().ingredients.find((i) => i.name === 'Jalapeño').quantity).toBe(58));
    expect(db().transactions[0]).toMatchObject({ ingredientName: 'Jalapeño', type: 'manual_restock', quantityChange: 50, quantityAfter: 58 });
    await waitFor(() => expect(within(screen.getByText('Jalapeño').closest('tr')).getByText('In stock')).toBeInTheDocument());

    await user.click(screen.getByRole('link', { name: /add ingredient/i }));
    await user.type(await screen.findByLabelText('Name'), 'Basil');
    await user.selectOptions(screen.getByLabelText('Category'), 'veggie');
    await user.type(screen.getByLabelText('Price added (₹)'), '15');
    await user.clear(screen.getByLabelText('Opening stock'));
    await user.type(screen.getByLabelText('Opening stock'), '40');
    await user.click(screen.getByRole('button', { name: /add ingredient/i }));
    await screen.findByText('Basil');
    expect(db().ingredients.find((i) => i.name === 'Basil')).toMatchObject({ price: 1500, quantity: 40, category: 'veggie' });

    await user.click(screen.getByRole('button', { name: /run stock audit/i }));
    expect(await screen.findByText(/stock audit done/i)).toBeInTheDocument();
  });

  it('ledger page lists alerts and transactions; below-zero adjustments are blocked', async () => {
    const { user, router } = renderApp('/admin/login');
    await adminLogin(user);
    await router.navigate('/admin/ledger');
    expect(await screen.findByRole('heading', { name: /stock ledger and low-stock alerts/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /emergency restock/i })).toBeInTheDocument(); // Vegan Cheese is out
    await user.click(screen.getByRole('button', { name: /emergency restock/i }));
    const dlg = await screen.findByRole('dialog');
    await user.click(within(dlg).getByRole('button', { name: /set exact count/i }));
    await user.type(within(dlg).getByLabelText('New quantity'), '-5');
    expect(within(dlg).getByRole('button', { name: /confirm and save/i })).toBeDisabled();
    await user.click(within(dlg).getByRole('button', { name: 'Cancel' }));
    expect((await screen.findAllByText('Initial stock')).length).toBeGreaterThan(0);
  });
});
