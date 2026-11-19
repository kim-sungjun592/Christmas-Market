import type { Product } from './components/Shop';

// Requested design mockups, not Shopify catalog records or live prices.
// The view labels these prices as illustrative and disables purchasing.
const image = (name: string) => `/assets/generated/${name}.jpg`;
export const previewProducts: Product[] = [
  { id: 'preview-cap', title: 'Five-Panel Run Cap', description: '', image: image('five-panel'), price: 36, variants: [{ id: 'preview-cap', title: 'One size', available: true }] },
  { id: 'preview-trucker', title: 'Vert Club Trucker Cap', description: '', image: image('trucker'), price: 34, variants: [{ id: 'preview-trucker', title: 'One size', available: true }] },
  { id: 'preview-tee', title: 'Merino Trail Tee', description: '', image: image('tee'), price: 64, variants: ['S', 'M', 'L', 'XL'].map((title) => ({ id: `preview-tee-${title}`, title, available: true })) },
  { id: 'preview-socks', title: 'Crew Socks 2-Pack', description: '', image: image('socks'), price: 22, variants: [{ id: 'preview-socks', title: 'One size', available: true }] },
];
