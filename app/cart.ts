import { createCartComponents } from '@shopify/hydrogen/react';
import type { cartHandlers } from './storefront.server';

export const { CartProvider, useCart, useCartForm } = createCartComponents<typeof cartHandlers>();
