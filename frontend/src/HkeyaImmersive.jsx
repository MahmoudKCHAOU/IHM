import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  p900: "#060b18", p800: "#0a1022", p700: "#0f1830",
  p600: "#162040", p500: "#1e3268", p400: "#2a4fa8",
  p300: "#4F8EF7", p200: "#93bffb", p100: "#d0e7ff",
  gold: "#F5C842", goldGlow: "#d4a017",
};

const BG_SOLID = "#060b18";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const AUTH_TOKEN_KEY = "whisper_api_token_v1";
const AUTH_USER_KEY = "whisper_api_user_v1";

const posts = [
  { id: 1, topic: "Études", topicColor: C.p300, user: "AnonStu22", avatar: "A",
    time: "il y a 1h", text: "يخي فما شركة تقبل stagiaire مغير اكتاف ؟",
    reactions: 87, shares: 6, comments: 31 },
  { id: 2, topic: "Technologie", topicColor: C.p400, user: "TechDev99", avatar: "T",
    time: "il y a 3h", text: "كيفاه تتعلم بيراتاج… لينك في أول كومنتار 👇",
    reactions: 204, shares: 44, comments: 78 },
  { id: 3, topic: "Santé", topicColor: C.p200, user: "AnonymeSanté", avatar: "S",
    time: "il y a 5h",
    text: "ماعاش نحب الخروج مالدار و نحس عندي رهاب اجتماعي… نحب نعدي عند طبيب و دارنا مازالو مش مقتنعين بالطب النفسي. شنعمل؟",
    reactions: 312, shares: 29, comments: 95 },
  { id: 4, topic: "Loi et droit", topicColor: C.gold, user: "LegalAnon", avatar: "L",
    time: "il y a 2h", text: "السلام عليكم بالله أنا مخطوبة من 2009 لتو لاعرسنا نحب نشكي بيه...",
    reactions: 156, shares: 18, comments: 62 },
];

/* ── PARTICLES ── */
function ParticleCanvas({ density = 45 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr);
    };
    resize();
    const ps = Array.from({ length: density }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.2,
      vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.35 + 0.05, ph: Math.random() * Math.PI * 2,
    }));
    let raf; let t = 0;
    const draw = () => {
      t += 0.01; ctx.clearRect(0, 0, W, H);
      ps.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const a = p.alpha * (0.7 + Math.sin(t + p.ph) * 0.3);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,160,250,${a})`; ctx.fill();
      });
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 8000) {
            ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y);
            ctx.strokeStyle = `rgba(59,130,246,${0.04 * (1 - d2 / 8000)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [density]);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.6 }} />;
}

/* ── LOGO ── */
function Logo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <defs>
        <linearGradient id="lg2" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={C.p100} />
          <stop offset="60%" stopColor={C.p300} />
          <stop offset="100%" stopColor={C.gold} />
        </linearGradient>
      </defs>
      <path d="M6 7C6 4.8 7.8 3 10 3H34C36.2 3 38 4.8 38 7V26C38 28.2 36.2 30 34 30H24L17 40V30H10C7.8 30 6 28.2 6 26V7Z" fill={`${C.p500}40`} stroke="url(#lg2)" strokeWidth="1.2" />
      <text x="22" y="22" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="900" fontSize="16" fill="url(#lg2)" dy="0.35em">ح</text>
      <circle cx="34" cy="8" r="3.5" fill={C.gold} opacity="0.9" />
      <circle cx="34" cy="8" r="5.5" fill={C.gold} opacity="0.2" />
    </svg>
  );
}

/* ── MIC ORB ── */
function MicOrb({ size = 38, label = "" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `radial-gradient(circle at 32% 28%, #fff5d6 0%, ${C.gold} 18%, ${C.p400} 55%, ${C.p800} 85%)`,
      boxShadow: `0 4px 18px ${C.p300}55, inset 0 1px 2px ${C.p100}66`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.28, fontWeight: 800, color: "#fff", position: "relative",
    }}>
      <div style={{ position: "absolute", inset: -2, borderRadius: "50%", border: `1px solid ${C.gold}55`, opacity: 0.6, animation: "haloPulse 3.5s ease-in-out infinite" }} />
      <span style={{ fontFamily: "monospace", opacity: 0.92 }}>{label}</span>
    </div>
  );
}

/* ── INPUT BAR ── */
function InputBar({ glow = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: `linear-gradient(135deg, ${C.p700}55, ${C.p800}88)`,
      border: `1px solid ${glow ? C.gold + "55" : C.p400 + "33"}`,
      borderRadius: 99, padding: "7px 7px 7px 18px",
      backdropFilter: "blur(20px)", boxShadow: glow ? `0 0 24px ${C.gold}22` : "none",
    }}>
      <span style={{ fontSize: 11, color: C.p200, opacity: 0.55, flex: 1, fontFamily: "Georgia, serif", fontStyle: "italic" }}>Écris ce que tu ressens…</span>
      <div style={{
        width: 26, height: 26, borderRadius: "50%",
        background: `radial-gradient(circle at 32% 28%, ${C.p100}, ${C.p400} 50%, ${C.p900})`,
        border: `1px solid ${C.gold}66`, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, boxShadow: `0 0 10px ${C.p300}66`,
      }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M9.5 1.5L11.5 3.5L4.5 10.5L1.5 11.5L2.5 8.5L9.5 1.5Z" stroke={C.p100} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
          <path d="M8 3L10 5" stroke={C.p100} strokeWidth="1.2" />
        </svg>
      </div>
    </div>
  );
}

function FooterSignature() {
  return (
    <div style={{
      position: "absolute", bottom: 14, left: 28, zIndex: 80,
      fontSize: 10, color: C.p500, opacity: 0.62, whiteSpace: "nowrap",
      letterSpacing: 0.6, textAlign: "left", fontFamily: "Georgia, serif", pointerEvents: "none",
    }}>© 2026 Hkeya · Fait avec ❤️ en Tunisie</div>
  );
}

/* ── GLASS INPUT (pour AuthPanel) ── */
function GlassInput({ label, placeholder, type = "text", value, onChange, rightAction = null }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.p300, opacity: 0.72, marginBottom: 8, fontFamily: "monospace" }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input
          type={type} value={value} onChange={onChange}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          placeholder={placeholder}
          style={{
            width: "100%", height: 46, borderRadius: 12, outline: "none",
            padding: rightAction ? "0 84px 0 14px" : "0 14px",
            color: "#fff", fontSize: 14,
            background: `linear-gradient(135deg, ${C.p800}aa, ${C.p900}dd)`,
            border: `1px solid ${focus ? C.gold + "66" : C.p400 + "38"}`,
            backdropFilter: "blur(20px)",
            boxShadow: focus ? `0 0 24px ${C.gold}18` : "none",
            transition: "all 0.25s ease",
          }}
        />
        {rightAction && (
          <div style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)" }}>{rightAction}</div>
        )}
      </div>
    </label>
  );
}

/* ── AUTH PANEL (design immersif) ── */
function AuthPanel({ mode = "signin", isActive, onGoSignIn, onGoSignUp, onBackLanding }) {
  const isSignUp = mode === "signup";
  const [rev, setRev] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });

  useEffect(() => {
    if (isActive) { const t = setTimeout(() => setRev(true), 120); return () => clearTimeout(t); }
    setRev(false);
  }, [isActive]);

  const setField = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div style={{
      width: "100vw", height: "100vh", position: "relative", flexShrink: 0,
      overflow: "hidden", background: BG_SOLID,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <ParticleCanvas density={34} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${C.p400}0c 1px, transparent 1px), linear-gradient(90deg, ${C.p400}0c 1px, transparent 1px)`,
        backgroundSize: "56px 56px", opacity: 0.45, pointerEvents: "none",
      }} />

      {/* Grand orb lumineux */}
      <div style={{
        position: "absolute", top: "-10%", right: "-6%",
        width: 520, height: 520, borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${C.p200} 10%, ${C.p300} 28%, ${C.p500} 52%, ${C.p800} 72%, transparent 76%)`,
        opacity: 0.92, pointerEvents: "none",
        transform: rev ? "scale(1)" : "scale(0.92)",
        transition: "transform 1.1s cubic-bezier(0.16,1,0.3,1)",
      }} />
      <div style={{
        position: "absolute", top: "5%", right: "14%",
        width: 240, height: 240, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.gold}16 0%, transparent 70%)`,
        filter: "blur(16px)", pointerEvents: "none",
      }} />

      <div style={{
        position: "relative", zIndex: 10, width: "min(390px, 92vw)",
        opacity: rev ? 1 : 0,
        transform: rev ? "translateY(0) scale(1)" : "translateY(28px) scale(0.97)",
        transition: "all 0.9s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{
          position: "relative", padding: "28px 24px 22px", borderRadius: 24, overflow: "hidden",
          background: `linear-gradient(145deg, rgba(15,24,48,0.50), rgba(6,11,24,0.82))`,
          border: `1px solid ${C.p400}35`, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          boxShadow: `0 24px 80px ${C.p900}, 0 0 0 1px ${C.p300}10 inset`,
        }}>
          {/* flare haut-droite */}
          <div style={{
            position: "absolute", top: -30, right: -24, width: 200, height: 200,
            background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, ${C.p200}55 12%, ${C.p300}44 24%, ${C.gold}22 40%, transparent 68%)`,
            filter: "blur(6px)", pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <Logo size={42} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: C.p200, textTransform: "uppercase", fontFamily: "monospace" }}>HKEYA</div>
              <div style={{ fontSize: 10, color: C.p300, opacity: 0.72, fontFamily: "Georgia, serif" }}>
                {isSignUp ? "Créer ton espace" : "Retrouve ton espace"}
              </div>
            </div>
          </div>

          <h2 style={{ margin: "0 0 8px 0", color: "#fff", fontSize: 34, lineHeight: 1, fontFamily: "Georgia, serif", fontWeight: 800 }}>
            {isSignUp ? "Inscription" : "Connexion"}
          </h2>
          <p style={{ margin: "0 0 18px 0", color: C.p200, opacity: 0.7, fontSize: 13, lineHeight: 1.6 }}>
            {isSignUp ? "Crée ton compte dans une interface fidèle à l'univers Hkeya." : "Interface sobre, transparente et immersive, dans le même thème que l'app."}
          </p>

          <form onSubmit={e => e.preventDefault()}>
            {isSignUp && <GlassInput label="Pseudo" placeholder="Ton pseudo" value={form.name} onChange={setField("name")} />}
            <GlassInput label="Email" placeholder="email@exemple.com" value={form.email} onChange={setField("email")} />
            {isSignUp && <GlassInput label="Téléphone" placeholder="Optionnel" value={form.phone} onChange={setField("phone")} />}
            <GlassInput
              label="Mot de passe" placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              value={form.password} onChange={setField("password")}
              rightAction={
                <button type="button" onClick={() => setShowPassword(s => !s)} style={{
                  border: "none", background: "none", color: C.p200, fontSize: 11,
                  cursor: "pointer", opacity: 0.85, padding: 0,
                }}>{showPassword ? "Masquer" : "Afficher"}</button>
              }
            />
            {isSignUp && (
              <GlassInput label="Confirmer" placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={form.confirm} onChange={setField("confirm")} />
            )}
            {!isSignUp && (
              <button type="button" style={{
                background: "none", border: "none", color: C.p200, opacity: 0.72,
                fontSize: 12, padding: "2px 0 0", marginBottom: 14, cursor: "pointer",
              }}>Mot de passe oublié</button>
            )}
            <button type="submit" style={{
              width: "100%", height: 46, borderRadius: 12, border: "none", cursor: "pointer",
              color: "#fff", fontSize: 14, fontWeight: 800, letterSpacing: 1.2, marginTop: 6,
              background: `linear-gradient(90deg, ${C.p300}, ${C.p400} 55%, ${C.goldGlow})`,
              boxShadow: `0 0 26px ${C.p300}44`, transition: "all 0.25s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 0 44px ${C.p300}77`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 0 26px ${C.p300}44`; }}
            >{isSignUp ? "Créer mon compte" : "Se connecter"}</button>
          </form>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.p400}20` }}>
            <p style={{ margin: "0 0 12px 0", color: C.p300, opacity: 0.7, fontSize: 12 }}>
              {isSignUp ? "Tu as déjà un compte ?" : "Tu n'as pas encore de compte ?"}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={isSignUp ? onGoSignIn : onGoSignUp} style={{
                height: 40, padding: "0 18px", borderRadius: 12, cursor: "pointer",
                color: "#fff", border: `1px solid ${C.p300}35`,
                background: `linear-gradient(135deg, ${C.p700}aa, ${C.p800}dd)`,
              }}>{isSignUp ? "Aller à la connexion" : "Créer un compte"}</button>
              <button type="button" onClick={onBackLanding} style={{
                height: 40, padding: "0 18px", borderRadius: 12, cursor: "pointer",
                color: C.p200, border: `1px solid ${C.gold}30`,
                background: `linear-gradient(135deg, ${C.p800}88, ${C.p900}cc)`,
              }}>Retour à l'accueil</button>
            </div>
          </div>
        </div>
      </div>
      <FooterSignature />
    </div>
  );
}

/* ── FLOATING POST CARD ── */
function FloatingCard({ post, idx, isActive, isDimmed, onClick, parallax }) {
  const [hov, setHov] = useState(false);
  const layouts = [
    { top: "12%",    left: "6%",   w: 310, rot: -2.5, drift: "drift1" },
    { top: "16%",    right: "5%",  w: 295, rot:  3,   drift: "drift2" },
    { bottom: "13%", left: "10%",  w: 350, rot:  2,   drift: "drift3" },
    { bottom: "18%", right: "8%",  w: 300, rot: -3,   drift: "drift4" },
  ];
  const L = layouts[idx] || layouts[0];
  const px = parallax?.x || 0, py = parallax?.y || 0;
  const depth = idx % 2 === 0 ? 1 : 0.6;
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      position: "absolute",
      top: L.top, bottom: L.bottom, left: L.left, right: L.right,
      width: L.w, maxWidth: "90vw",
      background: hov || isActive
        ? `linear-gradient(145deg, rgba(30,50,100,0.82), rgba(10,16,34,0.94))`
        : `linear-gradient(145deg, rgba(15,24,48,0.65), rgba(6,11,24,0.88))`,
      border: `1px solid ${isActive ? C.gold + "88" : hov ? C.p300 + "88" : C.p500 + "44"}`,
      borderRadius: 24, backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
      padding: "18px 20px 14px", cursor: "pointer",
      boxShadow: isActive
        ? `0 0 0 1px ${C.gold}33, 0 24px 70px ${C.p900}, 0 0 60px ${C.p300}33`
        : hov ? `0 16px 60px ${C.p900}, 0 0 30px ${C.p400}33` : `0 10px 40px ${C.p900}cc`,
      transform: `translate(${px * depth}px, ${py * depth}px) rotate(${hov || isActive ? 0 : L.rot}deg) translateY(${hov ? -8 : 0}px) scale(${isActive ? 1.04 : isDimmed ? 0.96 : 1})`,
      opacity: isDimmed ? 0.3 : 1,
      filter: isDimmed ? "blur(1.5px)" : "none",
      transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
      zIndex: isActive ? 30 : hov ? 22 : 10 + idx,
      animation: `cardIn 0.9s cubic-bezier(0.16,1,0.3,1) ${0.15 + idx * 0.18}s both, ${L.drift} ${14 + idx * 1.5}s ease-in-out infinite ${idx * 0.7}s`,
    }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 24, pointerEvents: "none", background: `radial-gradient(ellipse at top right, ${post.topicColor}14, transparent 60%)` }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 12 }}>
        <MicOrb size={36} label={post.avatar} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.p100, letterSpacing: 0.3 }}>{post.user}</span>
            <span style={{
              fontSize: 9, padding: "2px 8px", borderRadius: 99, fontFamily: "monospace",
              background: `${post.topicColor}18`, border: `1px solid ${post.topicColor}55`,
              color: post.topicColor, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
            }}>{post.topic}</span>
          </div>
          <span style={{ fontSize: 10, color: C.p300, opacity: 0.6, fontFamily: "monospace" }}>{post.time}</span>
        </div>
      </div>
      <p style={{ color: C.p100, fontSize: 14, lineHeight: 1.8, direction: "rtl", margin: "0 0 14px 0", fontFamily: "'Georgia', serif" }}>{post.text}</p>
      <div style={{ marginBottom: 10 }}><InputBar glow={isActive} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 9, borderTop: `1px solid ${C.p600}44` }}>
        {[["👍", post.reactions], ["💬", post.comments], ["↩", post.shares]].map(([icon, n], i) => (
          <button key={i} onClick={e => e.stopPropagation()} style={{
            display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
            cursor: "pointer", color: C.p200, fontSize: 12, padding: 0, opacity: 0.75,
            transition: "opacity 0.2s, transform 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "0.75"; e.currentTarget.style.transform = "scale(1)"; }}
          ><span>{icon}</span><span style={{ fontSize: 11, color: C.p200, fontFamily: "monospace" }}>{n}</span></button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 13, color: C.gold, opacity: 0.35 }}>🔖</div>
      </div>
    </div>
  );
}

/* ── ANONYMOUS BUBBLE ── */
function AnonymousBubble({ delay = 0, rotate = 0, style = {} }) {
  return (
    <div style={{
      position: "absolute", ...style,
      opacity: 0, animation: `bubbleFloat 6s ease-in-out ${delay}s infinite`,
      transform: `rotate(${rotate}deg)`, pointerEvents: "none",
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.p700}88, ${C.p800}cc)`,
        border: `1px solid ${C.p400}44`, borderRadius: "18px 18px 18px 4px",
        backdropFilter: "blur(20px)", padding: "12px 16px 10px",
        maxWidth: 220, minWidth: 140, position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="11" fill={`${C.p500}88`} />
            <circle cx="11" cy="8.5" r="3.2" fill={`${C.p300}99`} />
            <path d="M4 19.5C4 15.5 7 13 11 13C15 13 18 15.5 18 19.5" stroke={`${C.p300}99`} strokeWidth="1.4" fill="none" />
          </svg>
          <div style={{ height: 8, borderRadius: 4, background: `${C.p400}66`, flex: 1, filter: "blur(2px)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ height: 7, borderRadius: 3, background: `${C.p200}44`, width: "90%" }} />
          <div style={{ height: 7, borderRadius: 3, background: `${C.p200}33`, width: "70%" }} />
          <div style={{ height: 7, borderRadius: 3, background: `${C.p200}22`, width: "50%" }} />
        </div>
        <div style={{
          position: "absolute", bottom: -8, right: 12, background: C.p600, borderRadius: "50%",
          width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${C.p400}88`,
        }}>
          <svg width="8" height="9" viewBox="0 0 8 9" fill="none">
            <rect x="1" y="4" width="6" height="5" rx="1" fill={C.p200} />
            <path d="M2.5 4V2.5C2.5 1.67 3.17 1 4 1C4.83 1 5.5 1.67 5.5 2.5V4" stroke={C.p200} strokeWidth="1" fill="none" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
PANEL 1 — HERO
════════════════════════════════════════════════════════ */
function HeroPanel({ isActive, onNext, onSignIn, onSignUp }) {
  const [rev, setRev] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (isActive) { const t = setTimeout(() => setRev(true), 80); return () => clearTimeout(t); }
    setRev(false);
  }, [isActive]);
  const onMove = e => setMouse({ x: (e.clientX / window.innerWidth - 0.5) * 28, y: (e.clientY / window.innerHeight - 0.5) * 28 });

  return (
    <div onMouseMove={onMove} style={{
      width: "100vw", height: "100vh", position: "relative", flexShrink: 0,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", overflow: "hidden", background: BG_SOLID,
    }}>
      <ParticleCanvas density={60} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(${C.p400}0d 1px, transparent 1px), linear-gradient(90deg, ${C.p400}0d 1px, transparent 1px)`,
        backgroundSize: "56px 56px", animation: "gridPulse 9s ease-in-out infinite",
        transform: `translate(${mouse.x * 0.35}px, ${mouse.y * 0.35}px)`, transition: "transform 0.6s ease-out",
      }} />
      <div style={{
        position: "absolute", width: 420, height: 420, borderRadius: "50%",
        background: `radial-gradient(circle at 38% 36%, ${C.p400}55 0%, ${C.p600}44 30%, ${C.p800}cc 60%, ${C.p900} 85%)`,
        boxShadow: `0 0 120px ${C.p400}33, inset 0 0 80px ${C.p900}88`,
        top: "50%", left: "50%",
        transform: `translate(-50%, -50%) translate(${mouse.x * 0.5}px, ${mouse.y * 0.5}px)`,
        transition: "transform 0.8s ease-out", animation: "flt1 18s ease-in-out infinite", pointerEvents: "none",
      }}>
        <div style={{ position: "absolute", inset: -3, borderRadius: "50%", background: `radial-gradient(ellipse at 30% 25%, ${C.p300}22 0%, transparent 55%)`, border: `1px solid ${C.p300}18` }} />
      </div>
      <div style={{
        position: "absolute", width: 280, height: 280, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.gold}12 0%, transparent 70%)`,
        bottom: "8%", left: "6%", pointerEvents: "none",
        transform: `translate(${mouse.x * -0.9}px, ${mouse.y * -0.9}px)`,
        animation: "flt3 11s ease-in-out infinite", transition: "transform 0.8s ease-out",
      }} />
      <AnonymousBubble delay={0.2} rotate={-8} style={{ top: "16%", left: "4%", opacity: rev ? 0.55 : 0, transition: "opacity 1.2s 0.9s" }} />
      <AnonymousBubble delay={1.5} rotate={6}  style={{ bottom: "22%", right: "6%", opacity: rev ? 0.48 : 0, transition: "opacity 1.2s 1.1s" }} />
      <AnonymousBubble delay={3}   rotate={-4} style={{ top: "55%", left: "2%", opacity: rev ? 0.35 : 0, transition: "opacity 1.2s 1.3s" }} />
      <AnonymousBubble delay={2}   rotate={8}  style={{ top: "20%", right: "3%", opacity: rev ? 0.4 : 0, transition: "opacity 1.2s 1.5s" }} />

      <div style={{
        position: "relative", zIndex: 10, textAlign: "center", padding: "0 24px", maxWidth: 880,
        transform: `translate(${mouse.x * -0.25}px, ${mouse.y * -0.25}px)`, transition: "transform 0.5s ease-out",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 14, marginBottom: 36,
          opacity: rev ? 1 : 0, transform: rev ? "translateY(0)" : "translateY(-22px)",
          transition: "all 0.9s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <Logo size={52} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 7, color: C.p200, textTransform: "uppercase", fontFamily: "monospace" }}>HKEYA</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: C.p300, opacity: 0.6, fontFamily: "Georgia, serif" }}>منصة تعبير حر</div>
          </div>
        </div>

        <h1 style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: "clamp(80px, 15vw, 195px)",
          fontWeight: 900, lineHeight: 0.86, margin: "0 0 20px 0", letterSpacing: -5,
          background: `linear-gradient(135deg, #fff 18%, ${C.p100} 45%, ${C.p200} 70%, ${C.p300} 100%)`,
          backgroundSize: "220% auto",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          filter: `drop-shadow(0 0 70px ${C.p300}66)`,
          animation: "shimmer 7s linear infinite",
          opacity: rev ? 1 : 0, transform: rev ? "translateY(0)" : "translateY(70px)",
          transition: "opacity 1.3s cubic-bezier(0.16,1,0.3,1) 0.2s, transform 1.3s cubic-bezier(0.16,1,0.3,1) 0.2s",
        }}>HKEYA</h1>

        <p style={{
          fontSize: "clamp(11px, 1.6vw, 14px)", color: C.p300, letterSpacing: 3,
          textTransform: "uppercase", marginBottom: 44, fontFamily: "monospace",
          opacity: rev ? 1 : 0, transform: rev ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.9s cubic-bezier(0.16,1,0.3,1) 0.55s",
        }}>Expression anonyme · Liberté de parole · Sans jugement</p>

        <div style={{
          display: "inline-block", padding: "10px 22px", borderRadius: 14,
          background: `linear-gradient(135deg, ${C.p700}cc, ${C.p800}ee)`,
          border: `1px solid ${C.gold}33`, backdropFilter: "blur(28px)", direction: "rtl",
          boxShadow: `0 8px 30px ${C.p900}cc, inset 0 1px 0 ${C.gold}33`,
          opacity: rev ? 1 : 0, transform: rev ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          transition: "all 0.9s cubic-bezier(0.16,1,0.3,1) 0.95s", marginBottom: 0,
        }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "clamp(12px, 1.4vw, 15px)", color: C.p100, margin: 0, lineHeight: 1.6 }}>
            كان الحديث من فضة ...الكتيبة من{" "}
            <span style={{ color: C.gold, fontWeight: 900, fontStyle: "italic", textShadow: `0 0 24px ${C.gold}99` }}>ذهب</span>
          </p>
        </div>

      </div>
      <FooterSignature />
    </div>
  );
}

/* ── CtaBtn helper ── */
function CtaBtn({ label, primary = false, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: primary ? "14px 36px" : "14px 28px",
        borderRadius: 99,
        border: primary ? "none" : `1px solid ${C.gold}33`,
        background: primary
          ? h ? `linear-gradient(135deg, ${C.p200}, ${C.p300}, ${C.gold})` : `linear-gradient(135deg, ${C.p300}, ${C.p400})`
          : `linear-gradient(135deg, ${C.p800}bb, ${C.p900}ee)`,
        color: primary ? "#fff" : C.p100,
        fontSize: primary ? 14 : 13,
        fontWeight: primary ? 800 : 700,
        cursor: "pointer",
        letterSpacing: 1.5,
        fontFamily: "Georgia, serif",
        boxShadow: primary
          ? h ? `0 0 60px ${C.p300}99, 0 0 24px ${C.gold}55` : `0 0 28px ${C.p400}55`
          : `0 0 14px ${C.gold}12`,
        transform: h ? "translateY(-2px) scale(1.04)" : "scale(1)",
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
      }}
    >{label}</button>
  );
}

/* ════════════════════════════════════════════════════════
PANEL 2 — FEED
════════════════════════════════════════════════════════ */
function FeedPanel({ isActive, onNext, onPrev, onSignUp, onSignIn }) {
  const [rev, setRev] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (isActive) { const t = setTimeout(() => setRev(true), 160); return () => clearTimeout(t); }
    setRev(false); setActiveCard(null);
  }, [isActive]);
  const onMove = e => setMouse({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });

  return (
    <div onMouseMove={onMove} style={{ width: "100vw", height: "100vh", position: "relative", flexShrink: 0, overflow: "hidden", background: BG_SOLID }}>
      <ParticleCanvas density={40} />
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.p500}10 0%, transparent 70%)`,
        top: "25%", left: "35%", transform: `translate(-50%, -50%) translate(${mouse.x}px, ${mouse.y}px)`,
        animation: "flt2 15s ease-in-out infinite", pointerEvents: "none", transition: "transform 0.8s ease-out",
      }} />

      {/* Badge live */}
      <div style={{
        position: "absolute", top: 32, left: "50%", transform: "translateX(-50%)",
        zIndex: 40, opacity: rev ? 1 : 0, transition: "opacity 0.8s 0.3s",
        display: "flex", alignItems: "center", gap: 8, padding: "7px 22px", borderRadius: 99,
        background: `${C.p800}dd`, border: `1px solid ${C.gold}2a`,
        backdropFilter: "blur(20px)", boxShadow: `0 4px 24px ${C.p900}`,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, boxShadow: `0 0 10px ${C.gold}`, animation: "blink 2s infinite" }} />
        <span style={{ fontSize: 10, letterSpacing: 4, color: C.p200, textTransform: "uppercase", fontFamily: "monospace" }}>Ce qu'on dit sur Hkeya</span>
      </div>

      {/* Centre original */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%, -50%) translate(${mouse.x * -0.3}px, ${mouse.y * -0.3}px)`,
        textAlign: "center", zIndex: 5, pointerEvents: "none",
        opacity: activeCard !== null ? 0 : rev ? 1 : 0,
        transition: "opacity 0.5s, transform 0.6s ease-out", width: "min(540px, 86vw)",
      }}>
        <p style={{ fontSize: 9.5, color: C.gold, letterSpacing: 5.5, textTransform: "uppercase", fontFamily: "monospace", margin: "0 0 10px 0", opacity: 0.7 }}>· Le Feed ·</p>
        <h2 style={{
          fontFamily: "Georgia, serif", fontSize: "clamp(28px, 5vw, 54px)",
          margin: "0 0 10px 0", fontWeight: 900, fontStyle: "italic", lineHeight: 1.05,
          background: `linear-gradient(135deg, #fff 30%, ${C.p200} 70%, ${C.gold} 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          filter: `drop-shadow(0 0 40px ${C.p300}44)`,
        }}>Des vraies conversations</h2>
        <p style={{ color: C.p300, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontFamily: "monospace", opacity: 0.6 }}>Anonymes · Authentiques · Tunisiennes</p>
        <p style={{ color: C.p400, fontSize: 10, marginTop: 14, fontFamily: "monospace", opacity: 0.5, letterSpacing: 1 }}>↑ Clique sur une card pour interagir</p>
      </div>

      {/* Floating cards */}
      {posts.map((post, i) => (
        <FloatingCard key={post.id} post={post} idx={i}
          isActive={activeCard === i} isDimmed={activeCard !== null && activeCard !== i}
          onClick={() => setActiveCard(activeCard === i ? null : i)} parallax={mouse} />
      ))}
      {activeCard !== null && <div onClick={() => setActiveCard(null)} style={{ position: "absolute", inset: 0, zIndex: 25, cursor: "pointer" }} />}

      {/* Boutons CTA (ancienne page 3) */}
      <div style={{
        position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
        zIndex: 50, opacity: rev ? 1 : 0, transition: "opacity 0.8s 0.9s",
        display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "center",
      }}>
        <CtaBtn label="Créer un compte →" primary onClick={onSignUp} />
        <CtaBtn label="J'ai déjà un compte" onClick={onSignIn} />
      </div>

      <FooterSignature />
    </div>
  );
}

/* ── Données rôles ── */
const memberContent = [
  { id: 1, type: "Membre", author: "AnonStu22", avatar: "A", topic: "Études", text: "يخي فما شركة تقبل stagiaire مغير اكتاف ؟", time: "il y a 1h", reactions: 87, comments: 31 },
  { id: 2, type: "Membre", author: "TechDev99", avatar: "T", topic: "Technologie", text: "كيفاه تتعلم بيراتاج… لينك في أول كومنتار 👇", time: "il y a 3h", reactions: 204, comments: 78 },
  { id: 3, type: "Membre", author: "AnonymeSanté", avatar: "S", topic: "Santé", text: "ماعاش نحب الخروج مالدار و نحس عندي رهاب اجتماعي…", time: "il y a 5h", reactions: 312, comments: 95 },
];
const moderatorContent = [
  { id: 4, type: "Moderateur", author: "ModSarra", avatar: "S", topic: "Modération", text: "Post signalé par 3 utilisateurs — contenu potentiellement offensant.", time: "il y a 30min", reactions: 0, comments: 2 },
  { id: 5, type: "Moderateur", author: "ModKarim", avatar: "K", topic: "Modération", text: "Compte suspect détecté : 12 posts en 10 minutes. Surveillance activée.", time: "il y a 1h", reactions: 0, comments: 5 },
];
const adminContent = [
  { id: 6, type: "Administrateur", author: "System", avatar: "⚙", topic: "Système", text: "Nouveau pic de trafic : 1 240 connexions simultanées à 14h32.", time: "il y a 2h", reactions: 0, comments: 0 },
  { id: 7, type: "Administrateur", author: "EtoileLibre42", avatar: "E", topic: "Admin", text: "Mise à jour des règles de modération v2.4 déployée avec succès.", time: "il y a 4h", reactions: 0, comments: 1 },
];

function ContentCard({ item }) {
  const roleColors = { Membre: C.p300, Moderateur: C.gold, Administrateur: "#a78bfa" };
  const color = roleColors[item.type] || C.p300;
  return (
    <div style={{
      background: `linear-gradient(145deg, ${C.p800}88, ${C.p900}cc)`,
      border: `1px solid ${color}22`, borderRadius: 14, padding: "14px 16px", marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: `radial-gradient(circle at 32% 28%, ${color}44, ${C.p600})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{item.avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.p100 }}>{item.author}</span>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: `${color}18`, border: `1px solid ${color}44`, color, fontFamily: "monospace", fontWeight: 700 }}>{item.topic}</span>
          </div>
          <span style={{ fontSize: 10, color: C.p300, opacity: 0.6 }}>{item.time}</span>
        </div>
      </div>
      <p style={{ color: C.p100, fontSize: 13.5, lineHeight: 1.75, direction: "rtl", margin: 0 }}>{item.text}</p>
    </div>
  );
}

function SectionLabel({ label, color, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, marginTop: 20 }}>
      <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${color}44, transparent)` }} />
      <span style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color, fontFamily: "monospace", fontWeight: 700 }}>{label}</span>
      {count !== undefined && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: `${color}18`, border: `1px solid ${color}44`, color, fontFamily: "monospace" }}>{count}</span>}
      <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, ${color}44)` }} />
    </div>
  );
}

function DashboardShell({ user, onLogout, title, subtitle, accentColor, children }) {
  return (
    <div style={{ width: "100vw", height: "100vh", background: BG_SOLID, color: "#fff", display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", overflow: "hidden" }}>
      <div style={{ padding: "14px 24px", borderBottom: `1px solid ${accentColor}22`, display: "flex", alignItems: "center", gap: 14, background: `${C.p900}cc`, backdropFilter: "blur(20px)", flexShrink: 0 }}>
        <Logo size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.p100 }}>{title}</div>
          <div style={{ fontSize: 11, color: accentColor, opacity: 0.8 }}>{subtitle} · {user.username}</div>
        </div>
        <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.p500}44`, borderRadius: 8, color: C.p200, padding: "6px 14px", cursor: "pointer", fontSize: 12, transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.p300}88`; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = `${C.p500}44`; e.currentTarget.style.color = C.p200; }}
        >Déconnexion</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>{children}</div>
    </div>
  );
}

function ModeratorDashboard({ user, onLogout }) {
  const allContent = [...memberContent, ...moderatorContent];
  return (
    <DashboardShell user={user} onLogout={onLogout} title="Espace Modérateur" subtitle="Moderateur" accentColor={C.gold}>
      <SectionLabel label="Publications membres" color={C.p300} count={memberContent.length} />
      {memberContent.map(item => <ContentCard key={item.id} item={item} />)}
      <SectionLabel label="File de modération" color={C.gold} count={moderatorContent.length} />
      {moderatorContent.map(item => <ContentCard key={item.id} item={item} />)}
    </DashboardShell>
  );
}

function AdminDashboard({ user, onLogout }) {
  const allContent = [...memberContent, ...moderatorContent, ...adminContent];
  return (
    <DashboardShell user={user} onLogout={onLogout} title="Espace Administrateur" subtitle="Administrateur" accentColor="#a78bfa">
      <SectionLabel label="Publications membres" color={C.p300} count={memberContent.length} />
      {memberContent.map(item => <ContentCard key={item.id} item={item} />)}
      <SectionLabel label="Modération" color={C.gold} count={moderatorContent.length} />
      {moderatorContent.map(item => <ContentCard key={item.id} item={item} />)}
      <SectionLabel label="Administration" color="#a78bfa" count={adminContent.length} />
      {adminContent.map(item => <ContentCard key={item.id} item={item} />)}
    </DashboardShell>
  );
}

/* ── AUTH SCREEN (connecté à l'API) ── */
function AuthScreen({ mode, form, onModeChange, onFieldChange, onSubmit, loading, error, onBack }) {
  const [showPwd, setShowPwd] = useState(false);
  const [entered, setEntered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t); }, []);

  const eyeBtn = (
    <button type="button" onClick={() => setShowPwd(s => !s)} style={{
      border: "none", background: "none", color: C.p200, fontSize: 11,
      cursor: "pointer", opacity: 0.85, padding: 0,
    }}>{showPwd ? "Masquer" : "Afficher"}</button>
  );

  return (
    <div style={{
      width: "100vw", height: "100vh", background: BG_SOLID, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, position: "relative", overflow: "hidden", fontFamily: "Georgia, serif",
    }}>
      <ParticleCanvas density={40} />
      <div style={{ position: "absolute", top: "-8%", right: "-4%", width: 550, height: 550, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, ${C.p300}14 0%, ${C.p500}18 35%, transparent 65%)`, filter: "blur(50px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-12%", left: "-6%", width: 450, height: 450, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}08 0%, ${C.goldGlow}12 35%, transparent 65%)`, filter: "blur(60px)", pointerEvents: "none" }} />

      <form onSubmit={onSubmit} style={{
        width: "min(460px, 100%)",
        background: `linear-gradient(145deg, ${C.p800}88, ${C.p900}cc)`,
        border: `2px solid ${C.p400}33`, borderRadius: 24, padding: "28px 28px 24px",
        backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
        boxShadow: `0 32px 100px ${C.p900}cc, 0 0 0 1px ${C.p300}0d inset`,
        position: "relative", zIndex: 2, overflow: "hidden",
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
        transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{ position: "absolute", top: -40, right: -30, width: 220, height: 220, background: `radial-gradient(circle, ${C.p200}18 0%, ${C.p300}22 20%, ${C.gold}14 40%, transparent 65%)`, filter: "blur(8px)", pointerEvents: "none" }} />

        {onBack && (
          <button type="button" onClick={onBack} style={{
            background: "none", border: "none", color: C.p300, cursor: "pointer",
            fontSize: 12, display: "flex", alignItems: "center", gap: 6,
            marginBottom: 18, padding: 0, opacity: 0.75, transition: "all 0.2s",
            fontFamily: "monospace", letterSpacing: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateX(-3px)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "0.75"; e.currentTarget.style.transform = "none"; }}
          >← Retour</button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <Logo size={44} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 5, color: C.p200, textTransform: "uppercase", fontFamily: "monospace" }}>HKEYA</div>
            <div style={{ fontSize: 12, color: C.p300, opacity: 0.8, fontStyle: "italic" }}>
              {mode === "login" ? "Retrouve ton espace" : "Crée ton espace"}
            </div>
          </div>
        </div>

        <h2 style={{ margin: "0 0 6px", fontSize: 30, fontWeight: 800, lineHeight: 1,
          background: `linear-gradient(135deg, #fff 30%, ${C.p100} 65%, ${C.gold} 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>{mode === "login" ? "Connexion" : "Inscription"}</h2>
        <p style={{ margin: "0 0 20px", color: C.p200, fontSize: 13, opacity: 0.75 }}>
          {mode === "login" ? "Interface sobre et immersive, dans le thème Hkeya." : "Crée ton compte dans l'univers Hkeya."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, background: `${C.p900}99`, borderRadius: 14, padding: 4, border: `1px solid ${C.p600}44`, marginBottom: 20 }}>
          {["login", "register"].map(m => (
            <button key={m} type="button" onClick={() => onModeChange(m)} style={{
              border: "none",
              background: mode === m ? `linear-gradient(135deg, ${C.p400}, ${C.p500})` : "transparent",
              color: mode === m ? "#fff" : C.p200,
              borderRadius: 10, padding: "11px 14px", cursor: "pointer",
              fontWeight: 700, fontSize: 13, transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
              boxShadow: mode === m ? `0 4px 18px ${C.p400}44` : "none",
            }}>{m === "login" ? "Connexion" : "Inscription"}</button>
          ))}
        </div>

        {mode === "register" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <GlassInput label="Prénom" placeholder="Prénom" value={form.firstName || ""} onChange={e => onFieldChange("firstName", e.target.value)} />
            <GlassInput label="Nom" placeholder="Nom" value={form.lastName || ""} onChange={e => onFieldChange("lastName", e.target.value)} />
          </div>
        )}

        {mode === "login" ? (
          <GlassInput label="Identifiant" placeholder="Email, pseudo ou téléphone" value={form.identifier || ""} onChange={e => onFieldChange("identifier", e.target.value)} />
        ) : (
          <>
            <GlassInput label="Pseudo" placeholder="Ton pseudo anonyme" value={form.username || ""} onChange={e => onFieldChange("username", e.target.value)} />
            <GlassInput label="Email" placeholder="email@exemple.com" type="email" value={form.email || ""} onChange={e => onFieldChange("email", e.target.value)} />
            <GlassInput label="Téléphone" placeholder="Optionnel" value={form.phone || ""} onChange={e => onFieldChange("phone", e.target.value)} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.p300, opacity: 0.72, marginBottom: 8, fontFamily: "monospace" }}>Avatar</div>
              <select value={form.avatar || "A"} onChange={e => onFieldChange("avatar", e.target.value)} style={{
                width: "100%", height: 46, borderRadius: 12, outline: "none", padding: "0 14px",
                color: "#fff", fontSize: 14, cursor: "pointer",
                background: `linear-gradient(135deg, ${C.p800}cc, ${C.p900}ee)`,
                border: `1.5px solid ${C.p400}44`, fontFamily: "inherit",
              }}>
                {["A","B","C","D","E","M","S","T","Y","Z"].map(l => <option key={l} value={l} style={{ background: C.p800 }}>Avatar {l}</option>)}
              </select>
            </div>
          </>
        )}

        <GlassInput label="Mot de passe" placeholder="••••••••" type={showPwd ? "text" : "password"} value={form.password || ""} onChange={e => onFieldChange("password", e.target.value)} rightAction={eyeBtn} />

        {error && (
          <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠</span> {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          width: "100%", height: 48, border: "none", borderRadius: 14,
          background: loading ? `${C.p600}88` : `linear-gradient(135deg, ${C.p300}, ${C.p400} 55%, ${C.goldGlow})`,
          color: "#fff", fontWeight: 800, fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : `0 0 32px ${C.p300}44`,
          transition: "all 0.25s ease", letterSpacing: 1, textTransform: "uppercase", fontFamily: "monospace",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
        onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 0 50px ${C.p300}66`; } }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = loading ? "none" : `0 0 32px ${C.p300}44`; }}
        >
          {loading ? (
            <><div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${C.p200}44`, borderTop: `2px solid ${C.p200}`, animation: "spin 0.8s linear infinite" }} />Connexion...</>
          ) : (
            mode === "login" ? "Se connecter →" : "Créer mon compte →"
          )}
        </button>

        {mode === "login" && (
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <button type="button" style={{ background: "none", border: "none", color: C.p300, fontSize: 12, cursor: "pointer", opacity: 0.7, transition: "opacity 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "1"}
              onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}
            >Mot de passe oublié ?</button>
          </div>
        )}
      </form>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
ROOT — Composant principal
════════════════════════════════════════════════════════ */
export default function HkeyaImmersive() {
  const [cur, setCur] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [authedUser, setAuthedUser] = useState(null);
  const [form, setForm] = useState({
    identifier: "", password: "",
    firstName: "", lastName: "", username: "", email: "", phone: "", avatar: "E",
  });
  const PANELS = 2;
  const touch = useRef(null);

  // Détecter ?auth=login ou ?auth=register
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get("auth");
    if (authParam === "login" || authParam === "register") {
      setMode(authParam); setShowAuth(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const loginSuccess = useCallback((token, user) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token || "");
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user || {}));
    localStorage.setItem("whisper_auth_session_v1", JSON.stringify({ email: user.email }));
    localStorage.setItem("whisper_intro_seen", "1");
    try {
      const stored = JSON.parse(localStorage.getItem("whisper_users_v1") || "[]") || [];
      const idx = stored.findIndex(u => (u.email || "").toLowerCase() === user.email.toLowerCase());
      const entry = {
        firstName: user.firstName, lastName: user.lastName, fullName: user.fullName,
        email: user.email, phone: user.phone || "", username: user.username,
        avatar: user.avatar || user.username.charAt(0).toUpperCase(),
        password: "", role: user.role || "Membre",
      };
      if (idx >= 0) stored[idx] = { ...stored[idx], ...entry };
      else stored.push(entry);
      localStorage.setItem("whisper_users_v1", JSON.stringify(stored));
    } catch (_) {}
    window.location.assign("/whisper-original.html");
  }, []);

  const handleLogout = useCallback(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      fetch(`${API_BASE}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setAuthedUser(null); setShowAuth(false);
  }, []);

  const callApi = useCallback(async (path, options = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Erreur serveur");
    return data;
  }, []);

  // Vérification session au démarrage
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) { if (mounted) setCheckingSession(false); return; }
      try {
        const data = await callApi("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        const user = data.user;
        if (user) {
          localStorage.setItem("whisper_auth_session_v1", JSON.stringify({ email: user.email }));
          try {
            const stored = JSON.parse(localStorage.getItem("whisper_users_v1") || "[]") || [];
            const idx = stored.findIndex(u => (u.email || "").toLowerCase() === user.email.toLowerCase());
            const entry = {
              firstName: user.firstName, lastName: user.lastName, fullName: user.fullName,
              email: user.email, phone: user.phone || "", username: user.username,
              avatar: user.avatar || user.username.charAt(0).toUpperCase(),
              password: "", role: user.role || "Membre",
            };
            if (idx >= 0) stored[idx] = { ...stored[idx], ...entry };
            else stored.push(entry);
            localStorage.setItem("whisper_users_v1", JSON.stringify(stored));
          } catch (_) {}
        }
        window.location.assign("/whisper-original.html");
        return;
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };
    check();
    return () => { mounted = false; };
  }, [callApi]);

  const onFieldChange = useCallback((name, value) => setForm(prev => ({ ...prev, [name]: value })), []);
  const onModeChange = useCallback((nextMode) => { setMode(nextMode); setError(""); }, []);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const payload = mode === "login"
        ? { identifier: form.identifier.trim(), password: form.password }
        : { firstName: form.firstName.trim(), lastName: form.lastName.trim(), username: form.username.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password, avatar: form.avatar };
      const data = await callApi(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
      loginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message || "Action impossible");
    } finally {
      setLoading(false);
    }
  }, [callApi, form, mode, loginSuccess]);

  const goTo = useCallback((idx) => {
    if (transitioning || idx === cur || idx < 0 || idx >= PANELS) return;
    setTransitioning(true); setCur(idx);
    setTimeout(() => setTransitioning(false), 900);
  }, [cur, transitioning]);

  const goNext = useCallback(() => goTo(cur + 1), [cur, goTo]);
  const goPrev = useCallback(() => goTo(cur - 1), [cur, goTo]);

  useEffect(() => {
    const h = e => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   goPrev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [goNext, goPrev]);

  if (checkingSession) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#060b18", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <defs><linearGradient id="lg_s" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#d0e7ff"/><stop offset="60%" stopColor="#4F8EF7"/><stop offset="100%" stopColor="#F5C842"/></linearGradient></defs>
            <path d="M6 7C6 4.8 7.8 3 10 3H34C36.2 3 38 4.8 38 7V26C38 28.2 36.2 30 34 30H24L17 40V30H10C7.8 30 6 28.2 6 26V7Z" fill="rgba(30,50,104,0.4)" stroke="url(#lg_s)" strokeWidth="1.2"/>
            <text x="22" y="22" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="900" fontSize="16" fill="url(#lg_s)" dy="0.35em">ح</text>
          </svg>
          <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid rgba(79,142,247,0.25)", borderTop: "2px solid #4F8EF7", animation: "spin 0.8s linear infinite" }} />
        </div>
      </div>
    );
  }

  if (authedUser) {
    if (authedUser.role === "Administrateur") return <AdminDashboard user={authedUser} onLogout={handleLogout} />;
    if (authedUser.role === "Moderateur") return <ModeratorDashboard user={authedUser} onLogout={handleLogout} />;
  }

  if (showAuth) {
    return (
      <AuthScreen
        mode={mode} form={form}
        onModeChange={onModeChange} onFieldChange={onFieldChange}
        onSubmit={onSubmit} loading={loading} error={error}
        onBack={() => setShowAuth(false)}
      />
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: BG_SOLID, position: "relative", fontFamily: "Georgia, serif" }}
      onTouchStart={e => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (!touch.current) return;
        const d = touch.current - e.changedTouches[0].clientX;
        if (Math.abs(d) > 50) d > 0 ? goNext() : goPrev();
        touch.current = null;
      }}>
      <style>{`
        @keyframes flt1{0%,100%{transform:translate(0,0)}33%{transform:translate(-20px,14px) scale(1.03)}66%{transform:translate(14px,-10px) scale(.98)}}
        @keyframes flt2{0%,100%{transform:translate(-50%,-50%) translate(0,0)}50%{transform:translate(-50%,-50%) translate(28px,-20px) scale(1.04)}}
        @keyframes flt3{0%,100%{transform:translate(0,0)}50%{transform:translate(-12px,20px)}}
        @keyframes drift1{0%,100%{transform:rotate(-2.5deg) translate(0,0)}50%{transform:rotate(-1.5deg) translate(7px,-9px)}}
        @keyframes drift2{0%,100%{transform:rotate(3deg) translate(0,0)}50%{transform:rotate(2deg) translate(-9px,11px)}}
        @keyframes drift3{0%,100%{transform:rotate(2deg) translate(0,0)}50%{transform:rotate(3deg) translate(11px,-7px)}}
        @keyframes drift4{0%,100%{transform:rotate(-3deg) translate(0,0)}50%{transform:rotate(-4deg) translate(-8px,9px)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes blink{0%,100%{opacity:.45}50%{opacity:1}}
        @keyframes cardIn{from{opacity:0;transform:translateY(36px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes haloPulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.2);opacity:.12}}
        @keyframes bubbleFloat{0%,100%{opacity:.12;transform:translateY(0) rotate(0deg)}50%{opacity:.45;transform:translateY(-14px) rotate(1deg)}}
        @keyframes gridPulse{0%,100%{opacity:.28}50%{opacity:.5}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        *{box-sizing:border-box}::-webkit-scrollbar{display:none}
      `}</style>

      <div style={{ display: "flex", width: `${PANELS * 100}vw`, height: "100vh", transform: `translateX(-${cur * 100}vw)`, transition: "transform 0.9s cubic-bezier(0.77,0,0.18,1)" }}>
        <HeroPanel isActive={cur === 0} onNext={() => goTo(1)} onSignIn={() => { setMode("login"); setShowAuth(true); }} onSignUp={() => { setMode("register"); setShowAuth(true); }} />
        <FeedPanel isActive={cur === 1} onNext={goNext} onPrev={goPrev} onSignUp={() => { setMode("register"); setShowAuth(true); }} onSignIn={() => { setMode("login"); setShowAuth(true); }} />
      </div>

      {cur > 0 && (
        <button onClick={goPrev} style={{ position: "fixed", left: 16, top: "50%", transform: "translateY(-50%)", width: 42, height: 42, borderRadius: "50%", background: `${C.p700}cc`, border: `1px solid ${C.p500}55`, color: "#fff", fontSize: 16, cursor: "pointer", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, boxShadow: `0 4px 20px ${C.p900}`, transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = C.p500; e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${C.p700}cc`; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
        >←</button>
      )}
      {cur < PANELS - 1 && (
        <button onClick={goNext} style={{ position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)", width: 42, height: 42, borderRadius: "50%", background: `${C.p700}cc`, border: `1px solid ${C.p500}55`, color: "#fff", fontSize: 16, cursor: "pointer", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, boxShadow: `0 4px 20px ${C.p900}`, transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = C.p500; e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${C.p700}cc`; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
        >→</button>
      )}

      <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10, zIndex: 100, alignItems: "center" }}>
        {Array.from({ length: PANELS }).map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === cur ? 30 : 7, height: 7, borderRadius: 99,
            background: i === cur ? `linear-gradient(90deg, ${C.p300}, ${C.gold})` : `${C.p400}44`,
            border: "none", cursor: "pointer", padding: 0,
            transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
            boxShadow: i === cur ? `0 0 12px ${C.p300}66` : "none",
          }} />
        ))}
      </div>

      <div style={{ position: "fixed", top: 16, left: 18, zIndex: 100, display: "flex", alignItems: "center", gap: 9 }}>
        <Logo size={30} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 5, color: C.p200, textTransform: "uppercase", fontStyle: "italic", fontFamily: "Georgia, serif" }}>HKEYA</span>
      </div>

      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 100, fontSize: 10.5, color: C.p300, letterSpacing: 3, opacity: 0.55, fontFamily: "monospace" }}>
        {String(cur + 1).padStart(2, "0")} / {String(PANELS).padStart(2, "0")}
      </div>
    </div>
  );
}
