import { useEffect, useRef, useState } from 'react';
import './shop.css';

export type Product = {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  variants: { id: string; title: string; available: boolean }[];
};

export type CartLine = {
  id: string;
  title: string;
  variantTitle: string;
  quantity: number;
  unitPrice: number;
  original: number;
  lineTotal: number;
  image: string;
};

export type Cart = {
  lines: CartLine[];
  originalSubtotal: number | null;
  subtotal: number;
  total: number;
  checkoutUrl: string | null;
  discountApplied: boolean;
};

export type ShopProps = {
  products: Product[];
  cart: Cart | null;
  cartOpen: boolean;
  busy: boolean;
  discountStatus: 'applied' | 'scheduled' | 'ended' | 'checking' | 'unavailable';
  previewOnly?: boolean;
  promoUnavailable: boolean;
  onPromoRetry: () => void;
  onHome: () => void;
  onCartOpen: () => void;
  onCartClose: () => void;
  onAdd: (variantId: string) => void;
  onQuantity: (lineId: string, qty: number) => void;
  onCheckout: () => void;
};

const money = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      {diagonal ? (
        <path d="M5 19 19 5M7 5h12v12" />
      ) : (
        <path d="M4 12h15m-6-6 6 6-6 6" />
      )}
    </svg>
  );
}

function Star({ className = '' }: { className?: string }) {
  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 32 32" fill="none">
      <path d="M16 1v30M1 16h30M5.4 5.4l21.2 21.2M26.6 5.4 5.4 26.6" />
      <circle cx="16" cy="16" r="4.2" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M4.5 8.5h15l-1 12h-13l-1-12ZM8.5 9V6a3.5 3.5 0 0 1 7 0v3" />
    </svg>
  );
}

function Holly() {
  return (
    <svg className="vc-shop__holly" aria-hidden="true" viewBox="0 0 96 55" fill="none">
      <path d="M46 25C31 7 19 5 3 7c8 6 8 10 8 10l-8 4c8 1 11 5 12 9 11-3 20-3 31-5ZM51 26C64 8 77 6 92 7c-8 6-8 10-8 10l8 4c-8 1-11 5-12 9-11-3-20-3-29-4ZM47 26c-8 8-11 17-10 25 5-4 9-4 9-4l3 6 3-6s4 0 9 4c1-8-2-17-10-25" />
      <circle cx="44" cy="25" r="4" />
      <circle cx="52" cy="25" r="4" />
      <circle cx="48" cy="31" r="4" />
    </svg>
  );
}

function PromotionError({ previewOnly, busy, onRetry }: { previewOnly: boolean; busy: boolean; onRetry: () => void }) {
  return (
    <div role="alert" style={{ padding: '1rem', background: '#fff', border: '2px solid #b3262e', color: '#741820', fontSize: '14px' }}>
      <p style={{ margin: '0 0 0.5rem' }}>할인 코드 요청을 확인하지 못했습니다. Shopify에서 적용 가능 여부를 확인해 주세요.</p>
      {previewOnly ? <span>미리보기에서는 다시 시도할 수 없습니다.</span> : (
        <form method="post" action="/api/promo" onSubmit={(event) => { event.preventDefault(); onRetry(); }}>
          <button type="submit" disabled={busy} style={{ padding: '0.45rem 0.8rem', border: '1px solid currentColor', background: 'white', color: 'inherit', cursor: 'pointer' }}>{busy ? '확인 중...' : '할인 코드 다시 시도'}</button>
        </form>
      )}
    </div>
  );
}

export default function Shop({
  products,
  cart,
  cartOpen,
  busy,
  discountStatus,
  previewOnly = false,
  promoUnavailable,
  onPromoRetry,
  onHome,
  onCartOpen,
  onCartClose,
  onAdd,
  onQuantity,
  onCheckout,
}: ShopProps) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onCartClose);
  onCloseRef.current = onCartClose;

  const itemCount = previewOnly ? 0 : (cart?.lines.reduce((count, line) => count + line.quantity, 0) ?? 0);
  // An applicable code is cart-wide status, not proof that every product is eligible.
  const discountApplied = !previewOnly && discountStatus === 'applied' && cart?.discountApplied === true;
  const promotionText = discountApplied
    ? 'LONGNIGHT20 · Shopify 적용 가능 확인'
    : previewOnly
      ? 'LONGNIGHT20 · 2026년 12월 1–24일 ET · 미리보기'
      : discountStatus === 'scheduled'
        ? 'LONGNIGHT20 · 2026년 12월 1–24일 ET 예정'
        : discountStatus === 'ended'
          ? 'LONGNIGHT20 · 2026년 12월 1–24일 ET 종료'
          : discountStatus === 'checking'
            ? 'LONGNIGHT20 적용 여부 확인 중'
            : 'LONGNIGHT20 · 적용 여부를 확인할 수 없음';

  useEffect(() => {
    if (!cartOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) {
        event.preventDefault();
        drawerRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !drawerRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawerRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [cartOpen]);

  return (
    <>
      <div className="vc-shop">
        <div className="vc-shop__announcement">
          <Star />
          <span>THE LONG NIGHT SALE</span>
          <span className="vc-shop__announcement-divider" aria-hidden="true">/</span>
          <span>FOR THE LONG WAY HOME</span>
          <Star />
        </div>

        <header className="vc-shop__header">
          <button className="vc-shop__wordmark" type="button" onClick={onHome} aria-label="Vert Club 홈으로">
            <span>VERT<span className="vc-shop__wordmark-star">✳</span>CLUB</span>
            <small>RUN FAR. STAY CLOSE.</small>
          </button>
          <div className="vc-shop__header-right">
            <button className="vc-shop__home-link" type="button" onClick={onHome}>
              <span aria-hidden="true">←</span> 캠페인으로
            </button>
            <span className="vc-shop__header-line" aria-hidden="true" />
            <button
              className="vc-shop__cart-button"
              type="button"
              onClick={onCartOpen}
              disabled={previewOnly}
              aria-label={previewOnly ? '미리보기에서는 장바구니를 이용할 수 없습니다' : `장바구니 열기, 상품 ${itemCount}개`}
              aria-expanded={cartOpen}
              aria-controls="vc-cart-drawer"
            >
              <BagIcon />
              <span className="vc-shop__cart-label">CART</span>
              <span className="vc-shop__cart-count">{itemCount}</span>
            </button>
          </div>
        </header>

        <main>
          <section className="vc-shop__intro" aria-labelledby="vc-shop-title">
            <div className="vc-shop__intro-copy">
              <div className="vc-shop__eyebrow"><span className="vc-shop__eyebrow-dot" /> VERT CLUB HOLIDAY GOODS <span>/</span> 2026</div>
              <h1 id="vc-shop-title">THE LONG<br /><em>NIGHT</em> SHOP<span className="vc-shop__title-period">.</span></h1>
              <div className="vc-shop__intro-bottom">
                <p>가장 긴 밤을 위한 작은 준비.<br />트레일에서 연말까지, 함께 달릴 것들.</p>
                <span className="vc-shop__intro-coordinate">THE SEASON<br />TO GO FURTHER ↗</span>
              </div>
            </div>
            <div className="vc-shop__map" aria-hidden="true">
              <div className="vc-shop__map-top"><span>TRAIL NOTES</span><span>NO. 12 / 24</span></div>
              <div className="vc-shop__map-center"><Star /><span>TAKE<br />THE LONG<br />WAY HOME.</span></div>
              <div className="vc-shop__map-bottom"><span>VERT CLUB</span><span>WINTER EDITION ↗</span></div>
              <span className="vc-shop__map-pin vc-shop__map-pin--one">✳</span>
              <span className="vc-shop__map-pin vc-shop__map-pin--two">+</span>
            </div>
          </section>

          {previewOnly && (
            <div className="vc-shop__preview" role="status">
              <span className="vc-shop__preview-label">PREVIEW ONLY</span>
              <span><strong>상품 미리보기</strong> · 표시된 가격은 USD 미리보기이며, 현재 장바구니와 결제를 이용할 수 없습니다.</span>
            </div>
          )}

          {promoUnavailable && !cartOpen && <PromotionError previewOnly={previewOnly} busy={busy} onRetry={onPromoRetry} />}

          <div className={`vc-shop__promo ${discountApplied ? 'vc-shop__promo--applied' : ''}`} role="status">
            <div className="vc-shop__promo-main">
              <Holly />
              <div>
                <span className="vc-shop__promo-kicker">A LITTLE SOMETHING FOR THE TRAIL</span>
                <strong>{promotionText}</strong>
              </div>
            </div>
            <span className="vc-shop__promo-note">
              {previewOnly ? '미리보기에서는 할인이 적용되지 않습니다.' : discountApplied ? '상품별 실제 할인 금액은 장바구니에서 확인하세요.' : '행사 기간: 2026년 12월 1–24일 미국 동부 시간 · 적용 여부는 Shopify에서 확인'}
            </span>
            <span className="vc-shop__promo-stamp" aria-hidden="true">✳</span>
          </div>

          <section className="vc-shop__collection" aria-labelledby="vc-shop-collection-title">
            <div className="vc-shop__collection-heading">
              <div>
                <div className="vc-shop__section-kicker"><span>01</span> / THE WINTER COLLECTION</div>
                <h2 id="vc-shop-collection-title">GOOD THINGS<br className="vc-shop__mobile-break" /> FOR THE LONG RUN<span>.</span></h2>
              </div>
              <p>긴 밤에도 계속되는 여정을 위해.<br /><strong>{String(products.length).padStart(2, '0')} GOODS</strong></p>
            </div>

            {products.length === 0 ? (
              <div className="vc-shop__empty" role="status">
                <Star />
                <p>상품을 불러오는 중이거나 아직 등록된 상품이 없습니다.</p>
                <span>THE COLLECTION IS NOT AVAILABLE JUST YET.</span>
              </div>
            ) : (
              <div className="vc-shop__grid">
                {products.map((product, index) => {
                  const requestedId = selectedVariants[product.id];
                  const selectedVariant = product.variants.find((variant) => variant.id === requestedId)
                    ?? product.variants.find((variant) => variant.available)
                    ?? product.variants[0];
                  const isSize = /tee|shirt/i.test(product.title)
                    || (product.variants.length > 1 && product.variants.every((variant) => /^(xs|s|m|l|xl|xxl)$/i.test(variant.title.trim())));
                  const selectId = `vc-shop-option-${index}`;
                  return (
                    <article className="vc-shop__product" key={product.id}>
                      <div className="vc-shop__product-image-wrap">
                        {product.image ? (
                          <img src={product.image} alt={product.title} loading="lazy" />
                        ) : (
                          <span className="vc-shop__image-empty">이미지 준비 중</span>
                        )}
                        <span className="vc-shop__product-index">VC / {String(index + 1).padStart(2, '0')}</span>
                        <span className="vc-shop__product-cross" aria-hidden="true">✳</span>
                      </div>
                      <div className="vc-shop__product-topline"><span>VERT CLUB / GOODS</span><span>0{index + 1} — {String(products.length).padStart(2, '0')}</span></div>
                      <div className="vc-shop__product-title-row">
                        <h3>{product.title}</h3>
                        <span className="vc-shop__product-price">
                          {discountApplied ? <>
                            <s aria-label={`정가 ${money(product.price)}`}>{money(product.price)}</s>{' '}
                            <strong>{money(Math.round(Math.round(product.price * 100) * 0.8) / 100)}</strong>
                            <small>20% 예상가 · 장바구니 확인</small>
                          </> : <>{money(product.price)}{previewOnly && <small> USD 미리보기</small>}</>}
                        </span>
                      </div>
                      {product.description && <p className="vc-shop__product-description">{product.description}</p>}
                      <div className="vc-shop__product-actions">
                        {product.variants.length > 1 && (
                          <div className="vc-shop__select-wrap">
                            <label htmlFor={selectId}>{isSize ? '사이즈' : '옵션'}</label>
                            <select
                              id={selectId}
                              value={selectedVariant?.id ?? ''}
                              disabled={busy || product.variants.every((variant) => !variant.available)}
                              onChange={(event) => setSelectedVariants((current) => ({ ...current, [product.id]: event.target.value }))}
                            >
                              {product.variants.map((variant) => (
                                <option key={variant.id} value={variant.id} disabled={!variant.available}>
                                  {variant.title}{variant.available ? '' : ' (품절)'}
                                </option>
                              ))}
                            </select>
                            <span aria-hidden="true">⌄</span>
                          </div>
                        )}
                        <button
                          className="vc-shop__add"
                          type="button"
                          disabled={previewOnly || busy || !selectedVariant?.available}
                          onClick={() => selectedVariant && onAdd(selectedVariant.id)}
                          aria-label={previewOnly ? `${product.title}, 미리보기 전용으로 구매할 수 없습니다` : `${product.title} 장바구니에 담기`}
                        >
                          <span>{previewOnly ? '미리보기 전용' : selectedVariant?.available ? '장바구니에 담기' : '일시 품절'}</span>
                          <Arrow />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <div className="vc-shop__closing">
            <div className="vc-shop__closing-mark"><Star /><span>VC</span></div>
            <p>THE BEST DAYS<br /><em>ARE STILL AHEAD.</em></p>
            <div className="vc-shop__closing-side"><span>MADE FOR THE LONG WAY</span><button type="button" onClick={onHome}>캠페인으로 돌아가기 <Arrow diagonal /></button></div>
          </div>
        </main>
        <footer className="vc-shop__footer"><span>VERT CLUB © 2026</span><span>SEE YOU OUT THERE. ✳</span></footer>
      </div>

      {cartOpen && (
        <div className="vc-cart">
          <button className="vc-cart__backdrop" type="button" aria-label="장바구니 닫기" onClick={onCartClose} tabIndex={-1} />
          <div className="vc-cart__drawer" id="vc-cart-drawer" ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="vc-cart-title" tabIndex={-1}>
            <div className="vc-cart__header">
              <div><span className="vc-cart__eyebrow">YOUR KIT FOR THE LONG RUN</span><h2 id="vc-cart-title">YOUR CART<span>.</span> <small>({itemCount})</small></h2></div>
              <button ref={closeRef} type="button" className="vc-cart__close" onClick={onCartClose} aria-label="장바구니 닫기">×</button>
            </div>
            <div className={`vc-cart__notice ${discountApplied ? 'vc-cart__notice--applied' : ''}`} role="status"><Star /><span>{previewOnly ? '미리보기 전용 · 장바구니와 결제를 이용할 수 없습니다' : promotionText}</span></div>
            {promoUnavailable && <PromotionError previewOnly={previewOnly} busy={busy} onRetry={onPromoRetry} />}
            <div className="vc-cart__content">
              {previewOnly ? (
                <div className="vc-cart__empty"><Star /><strong>PREVIEW ONLY.</strong><p>현재 상품을 미리 보는 중입니다.<br />실제 주문은 이용할 수 없어요.</p><button type="button" onClick={onCartClose}>상품 둘러보기 <Arrow /></button></div>
              ) : !cart ? (
                <div className="vc-cart__empty"><Star /><strong>YOUR CART IS QUIET.</strong><p>장바구니가 비어 있거나 아직 준비 중이에요.</p><button type="button" onClick={onCartClose}>상품 둘러보기 <Arrow /></button></div>
              ) : cart.lines.length === 0 ? (
                <div className="vc-cart__empty"><Star /><strong>YOUR CART IS QUIET.</strong><p>아직 담은 상품이 없어요.<br />마음에 드는 아이템을 찾아보세요.</p><button type="button" onClick={onCartClose}>상품 둘러보기 <Arrow /></button></div>
              ) : (
                <div className="vc-cart__lines">
                  {cart.lines.map((line) => (
                    <article className="vc-cart__line" key={line.id}>
                      <div className="vc-cart__line-image">{line.image ? <img src={line.image} alt="" /> : <span>이미지 준비 중</span>}</div>
                      <div className="vc-cart__line-info">
                        <div className="vc-cart__line-top"><h3>{line.title}</h3><strong>{money(line.lineTotal)}</strong></div>
                        {line.variantTitle && line.variantTitle !== 'Default Title' && <p>{line.variantTitle}</p>}
                        <span className="vc-cart__unit-price">기준 단가 {money(line.unitPrice)} / 개 · 상품 금액 {money(line.original)}</span>
                        <div className="vc-cart__line-actions">
                          <div className="vc-cart__quantity" aria-label={`${line.title} 수량`}>
                            <button type="button" disabled={previewOnly || busy || line.quantity <= 1} onClick={() => onQuantity(line.id, line.quantity - 1)} aria-label={`${line.title} 수량 줄이기`}>−</button>
                            <span aria-live="polite">{line.quantity}</span>
                            <button type="button" disabled={previewOnly || busy} onClick={() => onQuantity(line.id, line.quantity + 1)} aria-label={`${line.title} 수량 늘리기`}>+</button>
                          </div>
                          <button className="vc-cart__remove" type="button" disabled={previewOnly || busy} onClick={() => onQuantity(line.id, 0)} aria-label={`${line.title} 삭제`}>삭제</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
            <div className="vc-cart__summary">
              {previewOnly ? (
                <p>미리보기 가격은 실제 주문 금액이 아닙니다.</p>
              ) : (
                <>
                  <div><span>상품 금액 · 상품 할인 전</span><span>{cart?.originalSubtotal != null ? money(cart.originalSubtotal) : '—'}</span></div>
                  <div><span>상품 소계 · 주문 할인 전</span><span>{cart ? money(cart.subtotal) : '—'}</span></div>
                  <div className="vc-cart__total"><span>예상 총액 <small>USD</small></span><strong>{cart ? money(cart.total) : '—'}</strong></div>
                  <p>상품 소계에는 상품별 할인이 반영될 수 있습니다. 배송비·세금 및 최종 금액은 Shopify 결제 단계에서 확인해 주세요.</p>
                </>
              )}
              <button className="vc-cart__checkout" type="button" disabled={previewOnly || busy || !cart?.checkoutUrl || !cart.lines.length} onClick={onCheckout}>
                <span>{previewOnly ? '미리보기 전용 · 결제 불가' : busy ? '처리 중...' : '결제하기'}</span><Arrow />
              </button>
              <div className="vc-cart__secure"><span>SECURE CHECKOUT WITH SHOPIFY</span><span>✳</span></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
