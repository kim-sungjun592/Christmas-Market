import { useMemo, useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gift,
  Heart,
  Plus,
  Search,
  X,
} from "lucide-react";
import "./shop.css";

const priceLabel = (price) => `₩${price.toLocaleString("ko-KR")}`;

// ✏️ Shop 페이지 전용 상품 정보
const SHOP_PRODUCTS = {
  1: {
    name: "크리스마스 머그컵",
    cat: "리빙",
    price: 14900,
    img: "/img/shop/mug.jpg",
    desc: "따뜻한 겨울 감성을 담은 특별한 머그컵",
  },
  2: {
    name: "크리스마스 니트 양말 세트",
    cat: "패션",
    price: 19900,
    img: "/img/shop/socks.jpg",
    desc: "귀여운 디자인과 포근함을 담은 겨울 양말 세트",
  },
  3: {
    name: "크리스마스 선물 상자 세트",
    cat: "선물",
    price: 39900,
    img: "/img/shop/giftbox.jpg",
    desc: "마음을 전하는 크리스마스 선물 세트",
  },
  4: {
    name: "크리스마스 향초",
    cat: "리빙",
    price: 24900,
    img: "/img/shop/candle.jpg",
    desc: "은은한 향으로 포근한 연말 분위기를 더하는 향초",
  },
  101: {
    name: "모던하우스",
    cat: "트리",
    price: 36000,
    img: "/img/shop/shopbody1.png",
    desc: "트윙클트리 6P 티라이트 캔들",
  },
  102: {
    name: "레드 베리 미니 트리",
    cat: "트리",
    price: 42000,
    img: "/img/shop/tree2.jpg",
    desc: "클래식한 레드 포인트 오너먼트 트리",
  },
  103: {
    name: "블루 앤 실버 미니 트리",
    cat: "트리",
    price: 48000,
    img: "/img/shop/tree3.jpg",
    desc: "세련된 쿨톤의 블루 실버 미니 트리",
  },
  104: {
    name: "클래식 레드 빅 트리",
    cat: "트리",
    price: 159000,
    img: "/img/shop/tree4.jpg",
    desc: "풍성한 선물 상자와 화려한 대형 트리",
  },
  105: {
    name: "화이트 눈꽃 블루 트리",
    cat: "트리",
    price: 145000,
    img: "/img/shop/tree5.jpg",
    desc: "눈 내린 듯한 화이트와 블루의 조화",
  },
  106: {
    name: "럭셔리 골드 레드 대형 트리",
    cat: "트리",
    price: 299000,
    img: "/img/shop/tree6.jpg",
    desc: "웅장한 로비에 어울리는 럭셔리 트리",
  },
  107: {
    name: "로열 블루 실버 대형 트리",
    cat: "트리",
    price: 310000,
    img: "/img/shop/tree7.jpg",
    desc: "우아하고 차가운 느낌의 대형 트리",
  },
};

// ✏️ 하단 카테고리 배너 목록 (여기에 객체를 복사해 추가하면 배너가 계속 늘어납니다)
const CATEGORY_BANNERS = [
  {
    id: "kids",
    title: "키즈GIFT",
    subtitle: "아이의 첫 크리스마스를 위한 포근한 선물",
    bgImg: "/img/shop/kids.png",
    targetCategory: "전체 상품",
    products: [
      {
        id: 201,
        name: "산타 아기 니트 모자",
        cat: "유아용",
        price: 18000,
        img: "/img/shop/kids1.jpg",
        desc: "부드러운 순면으로 만든 포근한 유아용 산타 모자",
      },
      {
        id: 202,
        name: "루돌프 애착 인형",
        cat: "유아용",
        price: 26000,
        img: "/img/shop/kids2.jpg",
        desc: "아이 품에 쏙 들어오는 말랑한 루돌프 인형",
      },
      {
        id: 203,
        name: "크리스마스 유아 내복 세트",
        cat: "유아용",
        price: 32000,
        img: "/img/shop/kids3.jpg",
        desc: "피부에 자극 없는 겨울 감성 실내복 세트",
      },
      {
        id: 204,
        name: "눈사람 원목 딸랑이",
        cat: "유아용",
        price: 15000,
        img: "/img/shop/kids4.jpg",
        desc: "안전한 무독성 마감의 크리스마스 원목 장난감",
      },
      {
        id: 205,
        name: "키즈 포근 털 부츠",
        cat: "유아용",
        price: 38000,
        img: "/img/shop/kids5.jpg",
        desc: "미끄럼 방지 바닥이 적용된 따뜻한 겨울 부츠",
      },
    ],
  },
  // 👇 새 배너 예시 (필요 없으면 이 블록을 지우고, 더 필요하면 복사해서 추가하세요)
  {
    id: "home-party",
    title: "홈파티 에디션",
    subtitle: "따뜻한 연말 식탁을 완성하는 테이블웨어",
    bgImg: "/img/shop/party.png",
    targetCategory: "리빙",
    products: [
      {
        id: 301,
        name: "크리스마스 와인잔 세트",
        cat: "리빙",
        price: 29000,
        img: "/img/shop/party1.jpg",
      },
      {
        id: 302,
        name: "홀리데이 테이블 러너",
        cat: "리빙",
        price: 22000,
        img: "/img/shop/party2.jpg",
      },
      {
        id: 303,
        name: "골드 림 디너 플레이트",
        cat: "리빙",
        price: 34000,
        img: "/img/shop/party3.jpg",
      },
      {
        id: 304,
        name: "트리 캔들 홀더",
        cat: "리빙",
        price: 19000,
        img: "/img/shop/party4.jpg",
      },
    ],
  },
];

// App.jsx 상품 + 위에서 바꾼 값 = Shop에 보여줄 최종 상품
const getShopProduct = (product) => {
  const s = SHOP_PRODUCTS[product.id] || {};
  const mainImg = product.img || product.image;
  return {
    ...product,
    name: s.name ?? product.name,
    cat: s.cat ?? product.cat ?? product.category,
    price: s.price ?? product.price,
    desc: s.desc ?? product.desc ?? "",
    img: s.img || mainImg,
    mainImg,
  };
};

// Shop 전용 이미지 파일이 없으면 메인 이미지로 대신 보여주기 (한 번만 시도)
const fallbackToMainImage = (e, product) => {
  const main = product.mainImg;
  if (!main || e.currentTarget.dataset.fallback) return;
  e.currentTarget.dataset.fallback = "1";
  e.currentTarget.src = main;
};

// 재사용 가능한 하단 배너 컴포넌트 (각 배너가 독립적으로 스크롤됨)
function CategoryBanner({ banner, onSelectCategory, onAddToCart }) {
  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    const track = carouselRef.current;
    if (!track) return;
    const amount = track.clientWidth * 0.75;
    track.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section
      className="shop-category-banner-box"
      aria-labelledby={`banner-title-${banner.id}`}
    >
      {/* 왼쪽: 배경 이미지로 꽉 채운 영역 */}
      <div
        className="banner-left-category"
        style={{ backgroundImage: `url(${banner.bgImg})` }}
      >
        <div className="banner-left-header">
          <h2 id={`banner-title-${banner.id}`}>{banner.title}</h2>
          <p>{banner.subtitle}</p>
        </div>

        <button
          type="button"
          className="banner-left-btn"
          onClick={() => onSelectCategory(banner.targetCategory || "전체 상품")}
        >
          전체보기 <ArrowRight size={14} />
        </button>
      </div>

      {/* 오른쪽: 상품 이미지 캐러셀 */}
      <div className="banner-right-carousel">
        <button
          type="button"
          className="banner-carousel-arrow prev"
          onClick={() => scrollCarousel("left")}
          aria-label={`이전 ${banner.title} 상품`}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="banner-carousel-track" ref={carouselRef}>
          {banner.products.map((item) => (
            <article className="banner-carousel-item" key={item.id}>
              <div className="banner-item-thumb">
                <img src={item.img} alt={item.name} loading="lazy" />
                <button
                  type="button"
                  className="banner-item-add"
                  onClick={(e) => onAddToCart(e, item)}
                  aria-label={`${item.name} 담기`}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="banner-item-meta">
                <p className="banner-item-cat">{item.cat}</p>
                <h3>{item.name}</h3>
                <strong>{priceLabel(item.price)}</strong>
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          className="banner-carousel-arrow next"
          onClick={() => scrollCarousel("right")}
          aria-label={`다음 ${banner.title} 상품`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}

// ✏️ 수정: wishIds(찜한 상품 id 목록)와 onToggleWish는 App.jsx에서 받아요 (헤더 하트와 연결)
export default function Shop({
  products,
  onAdd,
  onClose,
  wishIds = [],
  onToggleWish,
}) {
  const [selectedCategory, setSelectedCategory] = useState("전체 상품");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");

  const shopProducts = useMemo(() => products.map(getShopProduct), [products]);

  useEffect(() => {
    window.history.pushState({ modal: "shop" }, "");
    const handlePopState = () => onClose();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onClose]);

  const categories = useMemo(() => {
    return ["전체 상품", ...new Set(shopProducts.map((p) => p.cat))];
  }, [shopProducts]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = shopProducts.filter((product) => {
      const cat = product.cat;
      const categoryMatch =
        selectedCategory === "전체 상품" || cat === selectedCategory;
      const searchMatch =
        !term || `${product.name} ${cat}`.toLowerCase().includes(term);
      return categoryMatch && searchMatch;
    });
    return sort === "price"
      ? [...filtered].sort((a, b) => a.price - b.price)
      : filtered;
  }, [shopProducts, search, selectedCategory, sort]);

  // ✏️ 수정: 찜하기 → App.jsx의 찜 목록에 (이름/가격/이미지와 함께) 저장
  const toggleFavorite = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWish?.(product.id, {
      name: product.name,
      price: product.price,
      img: product.img,
    });
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    onAdd(product.id, {
      name: product.name,
      price: product.price,
      img: product.img,
    });
  };

  return (
    <div className="market-site shop-page">
      <main>
        {/* 상단 인트로 영역 */}
        <section className="shop-intro" aria-labelledby="shop-title">
          <div className="shop-intro-copy">
            <p className="eyebrow">THE CHRISTMAS MARKET · 2026</p>
            <h1 id="shop-title">
              겨울의 작은 기적을
              <br />
              <em>골라보세요</em>
            </h1>
            <p>마음을 따뜻하게 채워줄 시즌 아이템을 한곳에 모았어요.</p>
            <a
              href="#shop-products"
              className="shop-intro-link"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("shop-products")
                  .scrollIntoView({ behavior: "smooth" });
              }}
            >
              상품 둘러보기 <ArrowRight size={15} />
            </a>
          </div>
          <div className="shop-intro-art" aria-hidden="true">
            <img src="/img/shop/main.png" alt="Holiday Art" />
            <span className="shop-art-seal">
              <Gift size={18} />
              <small>
                GIVE A<br />
                LITTLE JOY
              </small>
            </span>
          </div>
        </section>

        <section
          className="shop-catalog"
          id="shop-products"
          aria-labelledby="catalog-title"
        >
          {/* 검색 및 카테고리 영역 */}
          <div className="shop-catalog-heading">
            <div>
              <p className="eyebrow">FIND YOUR HOLIDAY</p>
              <h2 id="catalog-title">시즌 셀렉션</h2>
              <p className="shop-catalog-subtitle">
                작은 설렘을 더해줄 크리스마스 아이템
              </p>
            </div>
            <label className="shop-search">
              <Search size={17} aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="상품명 또는 카테고리 검색"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}>
                  <X size={15} />
                </button>
              )}
            </label>
          </div>

          <div className="shop-category-row" id="shop-categories">
            <div className="shop-category-pills">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={selectedCategory === category ? "is-selected" : ""}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <button
              className="shop-sort"
              type="button"
              onClick={() =>
                setSort((current) =>
                  current === "featured" ? "price" : "featured",
                )
              }
            >
              {sort === "featured" ? "추천순" : "낮은 가격순"}
              <ChevronDown size={15} />
            </button>
          </div>

          <div className="shop-result-line">
            <span>{selectedCategory}</span>
            <span>{visibleProducts.length}개 상품</span>
          </div>

          {visibleProducts.length ? (
            <div className="shop-product-grid">
              {visibleProducts.map((product) => (
                <article className="shop-product-card" key={product.id}>
                  <div className="shop-product-image">
                    <img
                      src={product.img}
                      alt={product.name}
                      loading="lazy"
                      onError={(e) => fallbackToMainImage(e, product)}
                    />

                    {product.badge && (
                      <span className="shop-product-badge">
                        {product.badge}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`shop-favorite ${wishIds.includes(product.id) ? "is-active" : ""}`}
                      onClick={(e) => toggleFavorite(e, product)}
                      aria-label="찜하기"
                    >
                      <Heart
                        size={18}
                        fill={
                          wishIds.includes(product.id) ? "currentColor" : "none"
                        }
                      />
                    </button>
                    <button
                      type="button"
                      className="shop-quick-add"
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      <Plus size={16} /> 장바구니 담기
                    </button>
                  </div>
                  <p className="shop-product-category">{product.cat}</p>
                  <h3>{product.name}</h3>
                  {product.desc && (
                    <p className="shop-product-desc">{product.desc}</p>
                  )}
                  <div className="shop-product-bottom">
                    <strong>{priceLabel(product.price)}</strong>
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="shop-empty">
              <Search size={22} />
              <p>검색 결과가 없어요.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("전체 상품");
                }}
              >
                전체 상품 보기
              </button>
            </div>
          )}
        </section>

        {/* 하단 카테고리 배너 목록 */}
        {CATEGORY_BANNERS.map((banner) => (
          <CategoryBanner
            key={banner.id}
            banner={banner}
            onAddToCart={handleAddToCart}
            onSelectCategory={(category) => {
              setSelectedCategory(category);
              document
                .getElementById("shop-products")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        ))}
      </main>
    </div>
  );
}
