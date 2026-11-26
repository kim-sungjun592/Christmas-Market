import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gift,
  Heart,
  LogOut,
  Mail,
  Phone,
  ShoppingCart,
  User,
} from "lucide-react";
import Shop from "./shop";
import Tree from "./Tree";

const PRODUCTS = [
  {
    id: 1,
    name: "크리스마스 머그컵",
    desc: "따뜻한 겨울 감성을 담은 특별한 머그컵",
    price: 14900,
    img: "/1.png",
    cat: "리빙",
  },
  {
    id: 2,
    name: "크리스마스 니트 양말 세트",
    desc: "귀여운 디자인과 포근함을 담은 겨울 양말 세트",
    price: 19900,
    img: "/2.png",
    cat: "패션",
  },
  {
    id: 3,
    name: "크리스마스 선물 상자 세트",
    desc: "마음을 전하는 크리스마스 선물 세트",
    price: 39900,
    img: "/3.png",
    cat: "선물",
  },
  {
    id: 4,
    name: "크리스마스 향초",
    desc: "은은한 향으로 포근한 연말 분위기를 더하는 향초",
    price: 24900,
    img: "/4.png",
    cat: "리빙",
  },
];

const TREES = [
  {
    id: 101,
    name: "골드 리본 미니 트리",
    desc: "고급스러운 골드 오너먼트가 돋보이는 트리",
    price: 45000,
    img: "/tree1.png",
    cat: "트리",
  },
  {
    id: 102,
    name: "레드 베리 미니 트리",
    desc: "클래식한 레드 포인트 오너먼트 트리",
    price: 42000,
    img: "/tree2.png",
    cat: "트리",
  },
  {
    id: 103,
    name: "블루 앤 실버 미니 트리",
    desc: "세련된 쿨톤의 블루 실버 미니 트리",
    price: 48000,
    img: "/tree3.png",
    cat: "트리",
  },
  {
    id: 104,
    name: "클래식 레드 빅 트리",
    desc: "풍성한 선물 상자와 화려한 대형 트리",
    price: 159000,
    img: "/tree4.png",
    cat: "트리",
  },
  {
    id: 105,
    name: "화이트 눈꽃 블루 트리",
    desc: "눈 내린 듯한 화이트와 블루의 조화",
    price: 145000,
    img: "/tree5.png",
    cat: "트리",
  },
  {
    id: 106,
    name: "럭셔리 골드 레드 대형 트리",
    desc: "웅장한 로비에 어울리는 럭셔리 트리",
    price: 299000,
    img: "/tree6.png",
    cat: "트리",
  },
  {
    id: 107,
    name: "로열 블루 실버 대형 트리",
    desc: "우아하고 차가운 느낌의 대형 트리",
    price: 310000,
    img: "/tree7.png",
    cat: "트리",
  },
];

const ALL_PRODUCTS = [...PRODUCTS, ...TREES];

const won = (n) => n.toLocaleString("ko-KR") + "원";
const load = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};

function WindowSnow() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current,
      x = c.getContext("2d");
    let w, h, raf;
    const resize = () => {
      w = c.width = c.clientWidth;
      h = c.height = c.clientHeight;
    };
    resize();
    addEventListener("resize", resize);
    const flakes = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.6,
      s: Math.random() * 0.0016 + 0.0008,
      d: Math.random() * 6.28,
    }));
    const tick = () => {
      x.clearRect(0, 0, w, h);
      x.fillStyle = "rgba(255,255,255,.9)";
      flakes.forEach((f) => {
        f.d += 0.012;
        f.y += f.s;
        f.x += Math.sin(f.d) * 0.0006;
        if (f.y > 1) {
          f.y = -0.02;
          f.x = Math.random();
        }
        x.beginPath();
        x.arc(f.x * w, f.y * h, f.r * (w / 240), 0, 7);
        x.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={ref} className="window-snow" />;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose}>
          ✕
        </button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Auth({ onClose, onLogin }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", pw: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    setErr("");
    const users = load("cm_users", []);
    if (!/\S+@\S+\.\S+/.test(f.email))
      return setErr("이메일 형식을 확인해주세요.");
    if (f.pw.length < 6) return setErr("비밀번호는 6자 이상이어야 해요.");
    if (mode === "signup") {
      if (!f.name.trim()) return setErr("이름을 입력해주세요.");
      if (users.some((u) => u.email === f.email))
        return setErr("이미 가입된 이메일이에요.");
      const u = { name: f.name, email: f.email, pw: f.pw };
      localStorage.setItem("cm_users", JSON.stringify([...users, u]));
      onLogin(u);
    } else {
      const u = users.find((u) => u.email === f.email && u.pw === f.pw);
      if (!u) return setErr("이메일 또는 비밀번호가 올바르지 않아요.");
      onLogin(u);
    }
  };
  return (
    <Modal title={mode === "login" ? "로그인" : "회원가입"} onClose={onClose}>
      <form onSubmit={submit}>
        {mode === "signup" && (
          <label className="field">
            이름
            <input value={f.name} onChange={set("name")} />
          </label>
        )}
        <label className="field">
          이메일
          <input type="email" value={f.email} onChange={set("email")} />
        </label>
        <label className="field">
          비밀번호
          <input type="password" value={f.pw} onChange={set("pw")} />
        </label>
        {err && <p className="err">{err}</p>}
        <button className="btn full">
          {mode === "login" ? "로그인" : "가입하기"}
        </button>
      </form>
      <button
        className="link"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setErr("");
        }}
      >
        {mode === "login" ? "처음이신가요? 회원가입" : "이미 계정이 있어요"}
      </button>
    </Modal>
  );
}

function Checkout({ items, total, user, onClose, onPaid }) {
  const [f, setF] = useState({
    name: user.name,
    addr: "",
    card: "",
    exp: "",
    cvc: "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set =
    (k, fn = (v) => v) =>
    (e) =>
      setF({ ...f, [k]: fn(e.target.value) });
  const fmtCard = (v) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const fmtExp = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };
  const pay = (e) => {
    e.preventDefault();
    setErr("");
    if (!f.name.trim() || !f.addr.trim())
      return setErr("받는 분과 배송지를 입력해주세요.");
    if (f.card.replace(/\s/g, "").length !== 16)
      return setErr("카드번호 16자리를 입력해주세요.");
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.exp))
      return setErr("유효기간은 MM/YY 형식이에요.");
    if (!/^\d{3}$/.test(f.cvc)) return setErr("CVC 3자리를 입력해주세요.");
    setBusy(true);
    setTimeout(
      () => onPaid({ no: "NM" + Date.now().toString().slice(-8), total }),
      1300,
    );
  };
  return (
    <Modal title="결제하기" onClose={onClose}>
      <div className="sum">
        {items.map((i) => (
          <div key={i.id}>
            {i.name} × {i.qty}
          </div>
        ))}
        <div className="total">
          <span>총 결제금액</span>
          <span className="price">{won(total)}</span>
        </div>
      </div>
      <form onSubmit={pay}>
        <label className="field">
          받는 분<input value={f.name} onChange={set("name")} />
        </label>
        <label className="field">
          배송지
          <input
            value={f.addr}
            onChange={set("addr")}
            placeholder="주소를 입력하세요"
          />
        </label>
        <label className="field">
          카드번호
          <input
            inputMode="numeric"
            value={f.card}
            onChange={set("card", fmtCard)}
            placeholder="0000 0000 0000 0000"
          />
        </label>
        <div className="two">
          <label className="field">
            유효기간
            <input
              value={f.exp}
              onChange={set("exp", fmtExp)}
              placeholder="MM/YY"
            />
          </label>
          <label className="field">
            CVC
            <input
              inputMode="numeric"
              maxLength={3}
              value={f.cvc}
              onChange={set("cvc", (v) => v.replace(/\D/g, ""))}
            />
          </label>
        </div>
        {err && <p className="err">{err}</p>}
        <button className="btn full" disabled={busy}>
          {busy ? "결제 처리 중…" : `${won(total)} 결제`}
        </button>
      </form>
    </Modal>
  );
}

// ✏️ 공통 푸터 컴포넌트
function Footer({ onGoPage, onOpenView, user, wishCount, cartCount }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goSection = (sectionId) => {
    onGoPage("main");
    setTimeout(() => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth" });
    }, 60);
  };

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="sf-inner">
        <div className="sf-top">
          {/* 1. 브랜드 소개 */}
          <div className="sf-brand">
            <p className="sf-eyebrow">WINTER CURATION · 2026</p>
            <h2 className="sf-logo">christmas-market</h2>
            <p className="sf-desc">
              작은 테이블 트리부터 거실을 채우는 대형 트리, 마음을 전하는 연말
              선물까지 따뜻한 겨울을 준비하는 크리스마스 셀렉트 숍입니다.
            </p>
            <p className="sf-notice">
              대형 트리 제작 및 매장·공간 연출 문의는 고객센터로 연락해 주세요.
            </p>
          </div>

          {/* 2. 쇼핑 카테고리 */}
          <div className="sf-col">
            <h3>SHOP</h3>
            <ul>
              <li>
                <button type="button" onClick={() => onGoPage("main")}>
                  홈으로
                </button>
              </li>
              <li>
                <button type="button" onClick={() => goSection("shop")}>
                  베스트 선물 (리빙 · 패션 · 선물)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onGoPage("tree")}>
                  트리 컬렉션 (미니 · 대형)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onGoPage("shop")}>
                  전체 상품 둘러보기
                </button>
              </li>
            </ul>
          </div>

          {/* 3. 마이 메뉴 */}
          <div className="sf-col">
            <h3>MY MARKET</h3>
            <ul>
              <li>
                <button type="button" onClick={() => onOpenView("wish")}>
                  찜한 상품 {wishCount > 0 ? `(${wishCount})` : ""}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onOpenView("cart")}>
                  장바구니 {cartCount > 0 ? `(${cartCount})` : ""}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onOpenView("auth")}>
                  {user ? `${user.name}님 계정` : "로그인 / 회원가입"}
                </button>
              </li>
            </ul>
          </div>

          {/* 4. 고객센터 */}
          <div className="sf-col sf-cs">
            <h3>CUSTOMER CARE</h3>
            <a className="sf-tel" href="tel:02-1234-5678">
              <Phone size={15} />
              <span>02-1234-5678</span>
            </a>
            <p className="sf-meta">
              <Clock size={13} />
              <span>평일 10:00 – 17:00 (점심 12:30 – 13:30 · 주말 휴무)</span>
            </p>
            <p className="sf-meta">
              <Mail size={13} />
              <span>rlatjdwns@icloud.com</span>
            </p>
          </div>
        </div>

        <div className="sf-bottom">
          <div className="sf-legal">
            <p className="sf-address">
              <span>상호명: 크리스마스마켓</span>
              <span>대표자: 홍길동</span>
              <span>사업자등록번호: 123-45-67890</span>
              <span>통신판매업신고: 제 2026-서울강남-0000호</span>
              <br />
              <span>주소: 서울특별시 강남구 테헤란로 123, 윈터빌딩 4층</span>
              <span>개인정보관리책임자: 홍길동</span>
            </p>
            <p className="sf-copy">© 2026 christmas-market · Merry Christmas</p>
          </div>

          <button
            type="button"
            className="sf-topbtn"
            onClick={scrollToTop}
            aria-label="맨 위로 이동"
          >
            <span>TOP</span>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [cart, setCart] = useState(() => load("cm_cart", []));
  const [user, setUser] = useState(() => load("cm_user", null));
  const [page, setPage] = useState("main");
  const [view, setView] = useState(null);
  const [order, setOrder] = useState(null);
  const [wish, setWish] = useState(() =>
    load("cm_wish", []).filter((w) => w && typeof w === "object"),
  );

  const treeScrollRef = useRef(null);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = useCallback((msg, target = "cart") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, key: Date.now(), target });
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const closeShop = useCallback(() => setPage("main"), []);
  const closeTree = useCallback(() => setPage("main"), []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  useEffect(
    () => localStorage.setItem("cm_wish", JSON.stringify(wish)),
    [wish],
  );
  const toggleWish = (id, info) => {
    const exists = wish.some((x) => x.id === id);
    setWish((w) =>
      exists ? w.filter((x) => x.id !== id) : [...w, { id, ...info }],
    );
    showToast(
      exists
        ? `${info.name}을(를) 찜에서 뺐어요`
        : `${info.name}을(를) 찜했어요`,
      "wish",
    );
  };

  useEffect(
    () => localStorage.setItem("cm_cart", JSON.stringify(cart)),
    [cart],
  );
  useEffect(
    () => localStorage.setItem("cm_user", JSON.stringify(user)),
    [user],
  );

  const items = cart
    .map((c) => ({
      ...ALL_PRODUCTS.find((p) => p.id === (c.pid ?? c.id)),
      ...(c.info || {}),
      id: c.id,
      qty: c.qty,
    }))
    .filter((i) => i.name);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  const add = (id, info) => {
    const base = ALL_PRODUCTS.find((x) => x.id === id);
    const changed =
      info && (!base || info.name !== base.name || info.price !== base.price);
    const key = changed ? `shop-${id}` : id;
    const line = changed
      ? { id: key, pid: id, info, qty: 1 }
      : { id: key, qty: 1 };
    setCart((c) =>
      c.some((x) => x.id === key)
        ? c.map((x) => (x.id === key ? { ...x, qty: x.qty + 1 } : x))
        : [...c, line],
    );
    const name = changed ? info.name : base?.name;
    showToast(name ? `${name}을(를) 담았어요` : "장바구니에 담았어요");
  };
  const chg = (id, d) =>
    setCart((c) =>
      c
        .map((x) => (x.id === id ? { ...x, qty: x.qty + d } : x))
        .filter((x) => x.qty > 0),
    );
  const goCheckout = () => (user ? setView("checkout") : setView("auth"));

  const wishIds = wish.map((w) => w.id);

  const goHome = () => {
    setPage("main");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollTrees = (direction) => {
    if (treeScrollRef.current) {
      const { scrollLeft, clientWidth } = treeScrollRef.current;
      const scrollAmount = clientWidth * 0.7;
      treeScrollRef.current.scrollTo({
        left:
          scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount),
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <nav className="nav">
        <button type="button" className="logo" onClick={goHome}>
          christmas-market
        </button>
        <div className="nav-r">
          {user ? (
            <>
              <span className="nav-user">{user.name}님</span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setUser(null)}
                aria-label="로그아웃"
                title="로그아웃"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="icon-btn"
              onClick={() => setView("auth")}
              aria-label="로그인"
              title="로그인"
            >
              <User size={20} />
            </button>
          )}
          <button
            type="button"
            className="icon-btn"
            onClick={() => setView("wish")}
            aria-label="찜한 상품"
            title="찜한 상품"
          >
            <Heart size={20} />
            {wish.length > 0 && (
              <span className="icon-badge">{wish.length}</span>
            )}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setView("cart")}
            aria-label="장바구니"
            title="장바구니"
          >
            <ShoppingCart size={20} />
            {count > 0 && <span className="icon-badge">{count}</span>}
          </button>
        </div>
      </nav>

      {page === "shop" ? (
        <Shop
          products={ALL_PRODUCTS}
          onAdd={add}
          onClose={closeShop}
          wishIds={wishIds}
          onToggleWish={toggleWish}
        />
      ) : page === "tree" ? (
        <Tree
          products={TREES}
          onAdd={add}
          onClose={closeTree}
          wishIds={wishIds}
          onToggleWish={toggleWish}
        />
      ) : (
        <>
          <header className="hero">
            <div className="scene">
              <img src="/hero.png" alt="크리스마스 거실" />
              <WindowSnow />
              <div className="scene-title">
                <h2 className="st-main">
                  <i>❄</i>Christmas
                  <br />
                  Market<i>❄</i>
                </h2>
                <button className="st-cta" onClick={() => setPage("shop")}>
                  SHOP THE MARKET <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </header>

          <main className="wrap" id="shop">
            <h2 className="section-title">BEST PRESENT</h2>
            <div className="grid">
              {PRODUCTS.map((p) => (
                <div className="product" key={p.id}>
                  <figure className="pick">
                    <img src={p.img} alt={p.name} loading="lazy" />
                    <button
                      type="button"
                      className={
                        "wish-btn" +
                        (wishIds.includes(p.id) ? " is-active" : "")
                      }
                      onClick={() =>
                        toggleWish(p.id, {
                          name: p.name,
                          price: p.price,
                          img: p.img,
                        })
                      }
                      aria-label="찜하기"
                      aria-pressed={wishIds.includes(p.id)}
                    >
                      <Heart
                        size={18}
                        fill={wishIds.includes(p.id) ? "currentColor" : "none"}
                      />
                    </button>
                  </figure>
                  <h3 className="p-name">{p.name}</h3>
                  <p className="p-desc">{p.desc}</p>
                  <div className="p-row">
                    <span className="p-price">{won(p.price)}</span>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => add(p.id)}
                    >
                      담기
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <section className="tree-section" id="trees">
              <h2 className="section-title">CHRISTMAS TREES</h2>

              <div className="tree-hero">
                <img
                  src="/figma.png"
                  alt="크리스마스 트리 사이즈 가이드"
                  loading="lazy"
                />
              </div>

              <div className="tree-split">
                <div className="tree-panel">
                  <h3 className="panel-title">이번 크리스마스 트리 컬렉션</h3>
                  <p className="panel-sub">
                    우리 집 거실을 따뜻하게 밝혀줄 트리를 만나보세요.
                  </p>

                  <div className="tree-banner">
                    <button
                      type="button"
                      className="tree-arrow left"
                      onClick={() => scrollTrees("left")}
                      aria-label="이전 트리"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div ref={treeScrollRef} className="tree-track">
                      {TREES.map((t) => (
                        <div className="product tree-item" key={t.id}>
                          <figure className="pick">
                            <img src={t.img} alt={t.name} loading="lazy" />
                          </figure>
                          <h3 className="p-name">{t.name}</h3>
                          <p className="p-desc">{t.desc}</p>
                          <div className="p-row">
                            <span className="p-price">{won(t.price)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="tree-arrow right"
                      onClick={() => scrollTrees("right")}
                      aria-label="다음 트리"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="tree-promo">
                  <img className="promo-img" src="/tree4.png" alt="" />
                  <div className="promo-text">
                    <h3>나만의 크리스마스 트리 만들기</h3>
                    <p>
                      작은 장식 하나부터 완성된 트리까지, 올해의 겨울을
                      꾸며보세요.
                    </p>
                    <button
                      type="button"
                      className="promo-btn"
                      onClick={() => setPage("tree")}
                    >
                      트리 상품 둘러보기
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </>
      )}

      <Footer
        onGoPage={setPage}
        onOpenView={setView}
        user={user}
        wishCount={wish.length}
        cartCount={count}
      />

      {toast && (
        <div className="cart-toast" key={toast.key} role="status">
          <span className="cart-toast-icon">✓</span>
          <span>{toast.msg}</span>
          <button
            type="button"
            onClick={() => {
              setToast(null);
              setView(toast.target || "cart");
            }}
          >
            보기
          </button>
        </div>
      )}

      {view === "auth" && (
        <Auth
          onClose={() => setView(null)}
          onLogin={(u) => {
            setUser(u);
            setView(cart.length ? "checkout" : null);
          }}
        />
      )}
      {view === "cart" && (
        <>
          <div className="overlay" onClick={() => setView(null)} />
          <aside className="drawer">
            <h2 className="drawer-title">
              <ShoppingCart size={22} /> 장바구니
            </h2>
            <div className="list">
              {!items.length && (
                <p className="empty-note">장바구니가 비어 있어요.</p>
              )}
              {items.map((i) => (
                <div className="item" key={i.id}>
                  <img className="thumb" src={i.img} alt={i.name} />
                  <div className="info">
                    <b>{i.name}</b>
                    <br />
                    {won(i.price)}
                  </div>
                  <div className="qty">
                    <button onClick={() => chg(i.id, -1)}>−</button>
                    {i.qty}
                    <button onClick={() => chg(i.id, 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="total">
              <span>합계</span>
              <span className="price">{won(total)}</span>
            </div>
            <button
              className="btn full"
              disabled={!items.length}
              onClick={goCheckout}
            >
              {user ? "결제하기" : "로그인하고 결제하기"}
            </button>
            <button className="link" onClick={() => setView(null)}>
              쇼핑 계속하기
            </button>
          </aside>
        </>
      )}
      {view === "wish" && (
        <>
          <div className="overlay" onClick={() => setView(null)} />
          <aside className="drawer">
            <h2 className="drawer-title">
              <Heart size={22} /> 찜한 상품
            </h2>
            <div className="list">
              {!wish.length && (
                <p className="wish-empty">
                  찜한 상품이 없어요.
                  <br />
                  Shop에서 ♡를 눌러 담아보세요.
                </p>
              )}
              {wish.map((w) => (
                <div className="item" key={w.id}>
                  <img className="thumb" src={w.img} alt={w.name} />
                  <div className="info">
                    <b>{w.name}</b>
                    <br />
                    {won(w.price)}
                  </div>
                  <div className="wish-actions">
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() =>
                        add(w.id, { name: w.name, price: w.price, img: w.img })
                      }
                    >
                      담기
                    </button>
                    <button
                      type="button"
                      className="wish-remove"
                      onClick={() => toggleWish(w.id, w)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="link" onClick={() => setView(null)}>
              닫기
            </button>
          </aside>
        </>
      )}
      {view === "checkout" && user && (
        <Checkout
          items={items}
          total={total}
          user={user}
          onClose={() => setView("cart")}
          onPaid={(o) => {
            setOrder(o);
            setCart([]);
            setView("done");
          }}
        />
      )}
      {view === "done" && order && (
        <Modal title="" onClose={() => setView(null)}>
          <div className="done">
            <div className="done-icon">
              <Gift size={28} />
            </div>
            <h2>결제가 완료됐어요!</h2>
            <p>
              주문번호 <b>{order.no}</b>
              <br />
              결제금액 {won(order.total)}
            </p>
            <button className="btn full" onClick={() => setView(null)}>
              계속 쇼핑하기
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
