import { useEffect, useRef, useState } from 'react';
import { defineShopifyRouteTemplates, initializeShopifyScripts } from '@shopify/hydrogen';
import type { CartData, CartDataFromHandlers, CartGetData } from '@shopify/hydrogen';
import Campaign from './components/Campaign';
import Shop from './components/Shop';
import type { Cart, Product } from './components/Shop';
import { CartProvider, useCart, useCartForm } from './cart';
import type { cartHandlers } from './storefront.server';

const routeTemplates = defineShopifyRouteTemplates({});
const promoNavigationKey = 'vertclub:promo-navigation';

// The marker is consumed after the POST redirect, so a failed or rejected
// code cannot trigger another automatic POST on the redirected shop page.
function markPromoNavigation(cartOpen: boolean): boolean {
  try {
    window.sessionStorage.setItem(promoNavigationKey, JSON.stringify({ cartOpen }));
    return true;
  } catch {
    return false;
  }
}

export type InitialData = {
  page: '/' | '/shop';
  products: Product[];
  previewOnly: boolean;
  cartData: CartGetData<CartDataFromHandlers<typeof cartHandlers>>;
  salePhase: 'scheduled' | 'active' | 'ended';
  cartOpen: boolean;
  shop: { shopId: string; storefrontId: string; myshopifyDomain: string };
  currency: string;
  error?: string;
};

function toViewCart(data: CartData): Cart | null {
  if (!data.id) return null;
  // Cart subtotal is before cart-level discounts, but may already include
  // line-level discounts. Each line subtotal is before line-level discounts.
  const amount = (money: { amount: string; currencyCode: string }) => {
    const value = Number(money.amount);
    return money.currencyCode === 'USD' && Number.isFinite(value) && value >= 0 ? value : null;
  };
  const subtotal = amount(data.cost.subtotalAmount);
  const total = amount(data.cost.totalAmount);
  if (subtotal === null || total === null) return null;
  const lines = data.lines.nodes.map((line) => {
    const original = amount(line.cost.subtotalAmount);
    const lineTotal = amount(line.cost.totalAmount);
    const unitPrice = amount(line.cost.amountPerQuantity);
    if (original === null || lineTotal === null || unitPrice === null) return null;
    return {
      id: line.id,
      title: line.merchandise?.product?.title ?? '',
      variantTitle: line.merchandise?.title ?? '',
      quantity: line.quantity,
      original,
      lineTotal,
      unitPrice,
      image: line.merchandise?.image?.url ?? '',
    };
  });
  if (lines.some((line) => line === null)) return null;
  const completeLines = lines.filter((line) => line !== null);
  return {
    lines: completeLines,
    // Hydrogen requests at most 250 lines and does not expose pageInfo here.
    // Avoid presenting a possibly truncated sum as the whole-cart original.
    originalSubtotal: completeLines.length < 250
      ? completeLines.reduce((sum, line) => sum + Math.round(line.original * 100), 0) / 100 : null,
    subtotal, total,
    checkoutUrl: data.checkoutUrl ?? null,
    discountApplied: data.discountCodes.some((code) => code.code.toUpperCase() === 'LONGNIGHT20' && code.applicable),
  };
}

function View({ initial }: { initial: InitialData }) {
  const data = useCart((state) => state.data);
  const pending = useCart((state) => state.pending);
  const revalidating = useCart((state) => state.revalidating);
  const errors = useCart((state) => state.errors);
  const { formProps, register } = useCartForm();
  const addForm = useRef<HTMLFormElement>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const campaignRef = useRef<HTMLDivElement>(null);
  const autoPromoAttempted = useRef(false);
  const promoSubmitting = useRef(false);
  const [cartOpen, setCartOpen] = useState(initial.cartOpen);
  const [actionError, setActionError] = useState('');
  const [promoUnavailable, setPromoUnavailable] = useState(false);
  const [promoPending, setPromoPending] = useState(false);
  const [phase, setPhase] = useState(initial.salePhase);
  const requestPromotion = async (open: boolean) => {
    if (initial.previewOnly || promoSubmitting.current) return;
    promoSubmitting.current = true;
    setPromoPending(true);
    setActionError('');
    const marked = markPromoNavigation(open);
    try {
      // Following the server's redirect preserves the Shopify cart cookie.
      const response = await fetch('/api/promo', { method: 'POST', credentials: 'same-origin' });
      const destination = new URL(response.url, window.location.href);
      if (!response.ok || !response.redirected || destination.origin !== window.location.origin || destination.pathname !== '/shop') throw new Error('Promotion request failed');
      window.location.assign(`${destination.pathname}${destination.search}${destination.hash}`);
    } catch {
      if (marked) {
        try { window.sessionStorage.removeItem(promoNavigationKey); } catch { /* Storage is optional. */ }
      }
      setPromoUnavailable(true);
      if (initial.page === '/') setActionError('할인 코드 요청에 실패했습니다. 세일 상품 보기 버튼으로 다시 시도해 주세요.');
      setPromoPending(false);
      promoSubmitting.current = false;
    }
  };
  useEffect(() => { void initializeShopifyScripts({ routes: routeTemplates }); }, []);
  useEffect(() => {
    // Campaign owns its markup; keep its cart button truly disabled in preview
    // without changing that component or allowing a preview cart request.
    const button = campaignRef.current?.querySelector<HTMLButtonElement>('.vc-hero-cart');
    if (!button || !initial.previewOnly) return;
    button.disabled = true;
    button.style.opacity = '0.5';
    button.style.cursor = 'not-allowed';
    button.setAttribute('aria-label', '미리보기에서는 장바구니를 이용할 수 없습니다');
    button.title = '미리보기에서는 장바구니를 이용할 수 없습니다';
  }, [initial.page, initial.previewOnly]);
  useEffect(() => {
    if (initial.page !== '/shop') return;
    const unavailable = new URLSearchParams(window.location.search).get('promotion') === 'unavailable';
    setPromoUnavailable(unavailable);
    if (autoPromoAttempted.current) return;
    autoPromoAttempted.current = true;
    let returnedFromPost = false;
    try {
      const marker = window.sessionStorage.getItem(promoNavigationKey);
      window.sessionStorage.removeItem(promoNavigationKey);
      if (marker !== null) {
        returnedFromPost = true;
        try { if (!initial.previewOnly && JSON.parse(marker).cartOpen) setCartOpen(true); } catch { /* Still suppress another POST. */ }
      }
    } catch {
      // Without a redirect marker an automatic retry could loop. Offer manual retry instead.
      if (!initial.previewOnly && !unavailable) setPromoUnavailable(true);
      return;
    }
    if (initial.previewOnly) return;
    // Mark both the source and destination history entries. Refreshing or
    // navigating back through them must not start a second automatic request.
    let alreadyAttempted = false;
    try {
      alreadyAttempted = !!window.history.state?.vertPromoAttempted;
      window.history.replaceState({ ...window.history.state, vertPromoAttempted: true }, '');
    } catch {
      if (!unavailable && !returnedFromPost) setPromoUnavailable(true);
      return;
    }
    if (unavailable || returnedFromPost || alreadyAttempted) return;
    if (!markPromoNavigation(initial.cartOpen)) { setPromoUnavailable(true); return; }
    void requestPromotion(initial.cartOpen);
  }, [initial.page, initial.previewOnly, initial.cartData, initial.cartOpen]);
  useEffect(() => {
    const refresh = () => {
      const now = Date.now();
      setPhase(now < Date.parse('2026-12-01T00:00:00-05:00') ? 'scheduled' : now < Date.parse('2026-12-25T00:00:00-05:00') ? 'active' : 'ended');
    };
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => window.clearInterval(timer);
  }, []);
  const cart = initial.previewOnly ? null : toViewCart(data);
  const busy = !!(pending.cost || pending.lines.size || pending.discountCodes.size || revalidating || promoPending);
  const discountStatus = busy ? 'checking' : cart?.discountApplied && phase === 'active'
    ? 'applied' : phase === 'scheduled' ? 'scheduled' : phase === 'ended' ? 'ended' : 'unavailable';
  const errorMessage = actionError || errors.network.at(-1)?.message || errors.cart.userErrors.at(-1)?.message ||
    Array.from(errors.lines.values()).flatMap((e) => e.userErrors).at(-1)?.message || '';

  const openShop = () => {
    if (initial.previewOnly) { window.location.assign('/shop'); return; }
    void requestPromotion(false);
  };
  const openCart = () => {
    if (initial.previewOnly) return;
    if (initial.page === '/') window.location.assign('/shop?cart=open');
    else setCartOpen(true);
  };
  const onAdd = (variantId: string) => {
    if (initial.previewOnly || !addForm.current || !addInput.current || !addButton.current) return;
    setActionError('');
    addInput.current.value = variantId;
    setCartOpen(true);
    addForm.current.requestSubmit(addButton.current);
  };
  const onQuantity = (lineId: string, quantity: number) => {
    if (initial.previewOnly || !Number.isInteger(quantity) || quantity < 0) return;
    const update = window.Shopify?.actions?.updateCart;
    if (!update || update.isDefault() || !data.id) { setActionError('장바구니가 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.'); return; }
    setActionError('');
    void update({ lines: [{ id: lineId, quantity }] }).catch(() => setActionError('장바구니를 변경하지 못했습니다. 다시 시도해 주세요.'));
  };
  const onCheckout = () => {
    if (!initial.previewOnly && cart?.checkoutUrl && cart.lines.length) window.location.assign(cart.checkoutUrl);
  };

  return <>
    {initial.page === '/' ?
      <div ref={campaignRef}>
        {initial.previewOnly && <div className="runtime-notice" role="status">미리보기 · 장바구니 및 결제를 이용할 수 없습니다</div>}
        <Campaign onShop={openShop} heroImage="/assets/generated/hero.jpg" cartCount={initial.previewOnly ? 0 : data.totalQuantity} onCartOpen={openCart} />
      </div> : <>
        {initial.previewOnly && <div className="runtime-notice" role="status">미리보기 · Shopify USD 설정 및 상품 활성화 후 구매 가능<small>아래 가격은 디자인 예시이며 실제 Shopify 판매 가격이 아닙니다. 장바구니, 결제 및 할인 적용은 비활성화되어 있습니다.</small></div>}
        <Shop products={initial.products} cart={cart} cartOpen={cartOpen} busy={busy} discountStatus={discountStatus} previewOnly={initial.previewOnly} promoUnavailable={promoUnavailable} onPromoRetry={() => { void requestPromotion(cartOpen); }}
          onHome={() => window.location.assign('/')} onCartOpen={openCart} onCartClose={() => setCartOpen(false)} onAdd={onAdd} onQuantity={onQuantity} onCheckout={onCheckout} />
      </>}
    {errorMessage && <div role="alert" className="runtime-error">{errorMessage}</div>}
    <form {...formProps()} ref={addForm} hidden>
      <input type="hidden" ref={addInput} name={register('merchandiseId', { value: '' }).name} />
      <input type="hidden" name={register('quantity', { value: 1 }).name} value="1" readOnly />
      <button ref={addButton} type="submit" {...register('add')}>Add</button>
    </form>
  </>;
}

export function App({ initial }: { initial: InitialData }) {
  return <CartProvider initialData={initial.cartData}><View initial={initial} /></CartProvider>;
}
