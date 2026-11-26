import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Plus,
} from "lucide-react";
import "./Tree.css";

const priceLabel = (price) => `₩${price.toLocaleString("ko-KR")}`;

// ✏️ 상단 슬라이더 정보 (public 폴더 기준 이미지 경로로 바꿔주세요)
// - theme: "white" (어두운 배경 + 흰 글씨) / "black" (밝은 배경 + 검정 글씨)
// - filterSize: 버튼 클릭 시 아래 목록에서 자동 선택할 크기 ("전체", "미니", "대형")
// - title을 비워두면 텍스트 없는 이미지 전용 슬라이드로 표시됩니다.
const HERO_SLIDES = [
  {
    id: 1,
    img: "/tree4.png",
    theme: "white",
    title: "크리스마스 쇼핑몰\n대형트리제작 부터 작은소품까지",
    desc: "대형트리 제작\n이제 직접 확인하고 준비하세요",
    cta: "바로가기",
    filterSize: "전체",
  },
  {
    id: 2,
    img: "/tree4.png", // 👈 두 번째 슬라이드 이미지 경로로 변경하세요 (예: "/tree2.png")
    theme: "black",
    title: "크리스마스 쇼핑몰\n크리스마스 대형조형물 제작",
    desc: "대형조형물\n이제 직접 확인하고 준비하세요",
    cta: "바로가기",
    filterSize: "대형",
  },
  {
    id: 3,
    img: "/tree4.png", // 👈 세 번째 슬라이드 이미지 경로로 변경하세요
    theme: "white",
    title: "작은 공간에도 따뜻한 겨울\n테이블 미니 트리 컬렉션",
    desc: "원룸·책상·선물용으로 딱 좋은\n감성 미니 트리를 만나보세요",
    cta: "미니 트리 보기",
    filterSize: "미니",
  },
];

// ✏️ 트리 페이지 전용 정보 (상품 id → 크기 / 이미지 / 설명)
const TREE_INFO = {
  101: { size: "미니" },
  102: { size: "미니" },
  103: { size: "미니" },
  104: { size: "대형" },
  105: { size: "대형" },
  106: { size: "대형" },
  107: { size: "대형" },
};

const SORTS = [
  { key: "featured", label: "추천순" },
  { key: "low", label: "낮은 가격순" },
  { key: "high", label: "높은 가격순" },
];

const getTree = (product) => {
  const t = TREE_INFO[product.id] || {};
  return {
    ...product,
    size: t.size ?? "기타",
    img: t.img || product.img,
    desc: t.desc ?? product.desc ?? "",
  };
};

export default function Tree({
  products = [],
  onAdd,
  onClose,
  wishIds = [],
  onToggleWish,
}) {
  const [size, setSize] = useState("전체");
  const [sortIndex, setSortIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const trees = useMemo(() => products.map(getTree), [products]);
  const sizes = useMemo(
    () => ["전체", ...new Set(trees.map((t) => t.size))],
    [trees],
  );

  const visibleTrees = useMemo(() => {
    const filtered = trees.filter((t) => size === "전체" || t.size === size);
    const key = SORTS[sortIndex].key;
    if (key === "low") return [...filtered].sort((a, b) => a.price - b.price);
    if (key === "high") return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [trees, size, sortIndex]);

  // 슬라이더 자동 재생 (4.5초 간격)
  useEffect(() => {
    if (isPaused || HERO_SLIDES.length <= 1) return;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  // 뒤로가기 버튼으로 메인에 돌아오게
  useEffect(() => {
    window.history.pushState({ modal: "tree" }, "");
    const handlePopState = () => onClose?.();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onClose]);

  const prevSlide = () => {
    setSlideIndex(
      (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
    );
  };

  const nextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const handleSlideAction = (slide) => {
    if (slide.href) {
      window.open(slide.href, "_blank", "noopener,noreferrer");
      return;
    }
    if (slide.filterSize) {
      setSize(slide.filterSize);
    }
    document
      .getElementById("tp-catalog")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const info = (tree) => ({
    name: tree.name,
    price: tree.price,
    img: tree.img,
  });

  const handleAdd = (e, tree) => {
    e.preventDefault();
    e.stopPropagation();
    onAdd?.(tree.id, info(tree));
  };

  const handleWish = (e, tree) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWish?.(tree.id, info(tree));
  };

  return (
    <div className="tp-page">
      <main>
        {/* 상단 풀와이드 히어로 슬라이더 */}
        <section
          className="tp-hero-slider"
          aria-label="크리스마스 트리 프로모션"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="tp-hero-track"
            style={{ transform: `translate3d(-${slideIndex * 100}%, 0, 0)` }}
          >
            {HERO_SLIDES.map((slide) => (
              <div
                key={slide.id}
                className={`tp-hero-slide is-${slide.theme || "white"}`}
                style={{ backgroundImage: `url("${slide.img}")` }}
              >
                {slide.title && (
                  <div className="tp-hero-inner">
                    <div className="tp-hero-caption">
                      <h2>{slide.title}</h2>
                      {slide.desc && <p>{slide.desc}</p>}
                      {slide.cta && (
                        <button
                          type="button"
                          className="tp-hero-btn"
                          onClick={() => handleSlideAction(slide)}
                        >
                          <ArrowRight size={16} />
                          <span>{slide.cta}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {HERO_SLIDES.length > 1 && (
            <>
              <button
                type="button"
                className="tp-hero-arrow is-prev"
                onClick={prevSlide}
                aria-label="이전 슬라이드"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                className="tp-hero-arrow is-next"
                onClick={nextSlide}
                aria-label="다음 슬라이드"
              >
                <ChevronRight size={24} />
              </button>

              <div
                className="tp-hero-dots"
                role="tablist"
                aria-label="슬라이드 선택"
              >
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={slideIndex === idx}
                    aria-label={`${idx + 1}번 슬라이드`}
                    className={slideIndex === idx ? "is-active" : ""}
                    onClick={() => setSlideIndex(idx)}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* 트리 목록 */}
        <section
          className="tp-catalog"
          id="tp-catalog"
          aria-labelledby="tp-catalog-title"
        >
          <div className="tp-heading">
            <p className="tp-eyebrow">FIND YOUR TREE</p>
            <h2 id="tp-catalog-title">트리 컬렉션</h2>
            <p className="tp-sub">우리 집 공간에 어울리는 크기를 골라보세요</p>
          </div>

          <div className="tp-filter-row">
            <div className="tp-pills">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={size === s ? "is-selected" : ""}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="tp-sort"
              onClick={() => setSortIndex((i) => (i + 1) % SORTS.length)}
            >
              {SORTS[sortIndex].label}
              <ChevronDown size={15} />
            </button>
          </div>

          <div className="tp-result-line">
            <span>{size === "전체" ? "전체 트리" : `${size} 트리`}</span>
            <span>{visibleTrees.length}개 상품</span>
          </div>

          <div className="tp-grid">
            {visibleTrees.map((tree) => {
              const wished = wishIds.includes(tree.id);
              return (
                <article className="tp-card" key={tree.id}>
                  <div className="tp-card-image">
                    <img src={tree.img} alt={tree.name} loading="lazy" />
                    <button
                      type="button"
                      className={"tp-fav" + (wished ? " is-active" : "")}
                      onClick={(e) => handleWish(e, tree)}
                      aria-label="찜하기"
                      aria-pressed={wished}
                    >
                      <Heart
                        size={18}
                        fill={wished ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      type="button"
                      className="tp-quick"
                      onClick={(e) => handleAdd(e, tree)}
                    >
                      <Plus size={16} /> 장바구니 담기
                    </button>
                  </div>
                  <p className="tp-size">{tree.size} 트리</p>
                  <h3>{tree.name}</h3>
                  {tree.desc && <p className="tp-desc">{tree.desc}</p>}
                  <div className="tp-bottom">
                    <strong>{priceLabel(tree.price)}</strong>
                    <button
                      type="button"
                      onClick={(e) => handleAdd(e, tree)}
                      aria-label={`${tree.name} 담기`}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
