// Static sample data. Replace with GET /pizzas (Phase 3). Prices are integer paise.
export const FILTERS = ['All', 'Rosso', 'Bianca', 'Truffle', 'Spicy'];

export const PIZZAS = [
  {
    id: 'diavola',
    name: 'Diavola Calabrese',
    price: 62900,
    art: 'diavola',
    stock: 'ok',
    tags: ['Rosso', 'Spicy'],
    description: 'San Marzano tomato, spicy salami, smoked provolone, wild oregano and chili hot honey.',
  },
  {
    id: 'tartufo',
    name: 'Tartufo & Funghi',
    price: 68900,
    art: 'tartufo',
    stock: 'ok',
    tags: ['Bianca', 'Truffle'],
    description: 'Cremini and oyster mushrooms, aged fontina, roasted garlic crema, thyme and truffle glaze.',
  },
  {
    id: 'margherita',
    name: 'Margherita Verace',
    price: 56900,
    art: 'margherita',
    stock: 'ok',
    tags: ['Rosso'],
    description: 'Crushed San Marzano tomatoes, buffalo mozzarella, sweet basil and cold-pressed olive oil.',
  },
  {
    id: 'quattro',
    name: 'Quattro Formaggi',
    price: 64900,
    art: 'quattro',
    stock: 'low',
    tags: ['Bianca'],
    description: 'Fior di latte, gorgonzola, aged parmigiano, smoked provola, wildflower honey and walnuts.',
  },
];

export const PHILOSOPHY = [
  {
    icon: 'grain',
    title: 'Heritage grains',
    text: 'Stone-milled ancient wheat gives the crust its nutty flavor and keeps it gentle on digestion.',
  },
  {
    icon: 'schedule',
    title: '48-hour fermentation',
    text: 'A wild sourdough starter and a slow cold rise make a light, open crumb with a crisp, blistered edge.',
  },
  {
    icon: 'fireplace',
    title: 'Beechwood hearth',
    text: 'Every pie is flash-baked in a wood-fired oven, then boxed hot so it arrives crisp.',
  },
];

export const BUILDER_STEPS = [
  { icon: 'bakery_dining', title: 'Choose a base', text: 'Five dough styles, from classic hand-tossed to multigrain.' },
  { icon: 'soup_kitchen', title: 'Choose a sauce', text: 'Tomato, pesto, barbecue, garlic white or spicy arrabbiata.' },
  { icon: 'lunch_dining', title: 'Choose a cheese', text: 'Mozzarella, cheddar, parmesan blend or a plant-based option.' },
  { icon: 'potted_plant', title: 'Add vegetables', text: 'Pick as many as you like. Each one is priced by the topping.' },
];
