// Picks an illustration for a pizza until real photos exist.
export const artFor = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('diavola') || n.includes('spicy')) return 'diavola';
  if (n.includes('tartufo') || n.includes('funghi') || n.includes('mushroom')) return 'tartufo';
  if (n.includes('quattro') || n.includes('formaggi')) return 'quattro';
  return 'margherita';
};
