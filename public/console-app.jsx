// console-app.jsx — private tools launcher
const { useState, useEffect, useRef, useCallback } = React;

/* ───────── tweak defaults ───────── */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": "#7dd3fc",
  "density": "comfy",
  "layout": "grid"
}/*EDITMODE-END*/;

/* ───────── tools registry ───────── */
const TOOLS = [
  { id: 'otp',   name: 'Keyring', kind: '2FA · OTP codes', tone: '#7dd3fc',
    glyph: 'OTP', status: 'live', requiresAuth: true,
    desc: 'Time-based one-time codes for every account, plus backup recovery codes.' },
  { id: 'notes', name: 'Notes',   kind: 'Scratchpad',      tone: '#c9b8ff',
    glyph: 'NTS', status: 'live', requiresAuth: true,
    desc: 'Fast markdown notes — capture, search, and pin the things you reach for.' },
];

const LK_THEME = 'ej_theme';
const INIT_TWEAKS = (() => {
  const d = { ...TWEAK_DEFAULTS };
  try {
    const th = localStorage.getItem(LK_THEME);
    if (th === 'light' || th === 'dark') d.theme = th;
  } catch (e) {}
  return d;
})();

/* ───────── tiny icon ───────── */
function Ico({ d, size = 16, sw = 1.7, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} className={className} aria-hidden="true">
      {d.split('|').map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
const IC = {
  arrow: 'M5 12h14|M13 6l6 6-6 6',
  lock:  'M7 10V7a5 5 0 0 1 10 0v3|M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z',
  play:  'M7 5l11 7-11 7z',
  sun:   'M12 4V2|M12 22v-2|M4 12H2|M22 12h-2|M5 5l-1.4-1.4|M20.4 20.4 19 19|M5 19l-1.4 1.4|M20.4 3.6 19 5|M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  moon:  'M21 12.8A8.6 8.6 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8z',
};

function useClock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const kst = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });
      const utc = d.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' });
      setT(`${kst} KST · ${utc} UTC`);
    };
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function App() {
  const [t, setTweak] = useTweaks(INIT_TWEAKS);
  const [toast, setToast] = useState(null);
  const toastT = useRef(null);
  const flash = useCallback((msg) => {
    setToast(msg); clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2100);
  }, []);

  const clock = useClock();

  const [shown, setShown] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(id); }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
    document.documentElement.style.setProperty('--accent', t.accent);
    document.body.classList.toggle('density-compact', t.density === 'compact');
    try { localStorage.setItem(LK_THEME, t.theme); } catch (e) {}
  }, [t.theme, t.accent, t.density]);

  const toggleTheme = () => setTweak('theme', t.theme === 'dark' ? 'light' : 'dark');

  // ── launch: auth-required tools go through credential.html ──
  const open = useCallback((tool) => {
    if (tool.status !== 'live') { flash(`${tool.name} — coming soon`); return; }
    const qs = new URLSearchParams();
    if (tool.requiresAuth) {
      qs.set('service', tool.id);
      location.href = `/credential?${qs.toString()}`;
    } else {
      location.href = tool.href;
    }
  }, [flash]);

  // keyboard: 1-9 launch
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= TOOLS.length) open(TOOLS[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const liveCount = TOOLS.filter((x) => x.status === 'live').length;

  return (
    <>
      {/* topbar */}
      <div className="topbar">
        <div className="topbar-inner">
          <span className="dot"></span>
          <a className="brand" href="/">EUISUH.JEONG</a>
          <nav className="nav">
            <a href="/#about">about</a>
            <a href="/#now">now</a>
            <a href="/#experience">work</a>
            <a href="/#projects">projects</a>
            <a href="/#publications">papers</a>
            <a href="/#writing">writing</a>
            <a href="/#gallery">places</a>
            <a href="/#contact">contact</a>
            <a href="/console">console</a>
          </nav>
          <button className="theme-toggle" onClick={toggleTheme}
            title={t.theme === 'dark' ? 'Light mode' : 'Dark mode'}
            aria-label={t.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <Ico d={t.theme === 'dark' ? IC.sun : IC.moon} size={14} sw={1.6} />
          </button>
          <span className="clock">{clock}</span>
        </div>
      </div>

      <main className="wrap" style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(10px)', transition: 'opacity .55s ease, transform .55s ease' }}>
        <section className="hero reveal">
          <div className="kicker">private workspace</div>
          <h1>The <span className="accent">console</span>.<br/><span className="ser">everything I reach for</span>.</h1>
          <p className="lede">A launcher for the small tools I use day to day. Select a tool to authenticate and open it.</p>
        </section>

        <div className="sec-head">
          <div className="tag">tools · {liveCount} live / {TOOLS.length} total</div>
          <div className="hint">press <kbd>1</kbd>–<kbd>{TOOLS.length}</kbd> to open</div>
        </div>

        {t.layout === 'grid'   && <GridView   onOpen={open} />}
        {t.layout === 'roster' && <RosterView onOpen={open} />}
        {t.layout === 'dock'   && <DockView   onOpen={open} />}

        <footer>
          <div>© 2026 · Euisuh Jeong · console</div>
          <div>{t.layout}</div>
        </footer>
      </main>

      <div className={'toast' + (toast ? ' show' : '')}>
        <Ico d={IC.play} size={13} /> {toast}
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance" />
        <TweakRadio label="Theme" value={t.theme} options={['dark', 'light']} onChange={(v) => setTweak('theme', v)} />
        <TweakColor label="Accent" value={t.accent}
          options={['#7dd3fc', '#84d8ff', '#c9b8ff', '#ffd479', '#ff9eb5']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakRadio label="Density" value={t.density} options={['comfy', 'compact']} onChange={(v) => setTweak('density', v)} />
        <TweakSection label="Launcher" />
        <TweakRadio label="Layout" value={t.layout} options={['grid', 'roster', 'dock']} onChange={(v) => setTweak('layout', v)} />
      </TweaksPanel>
    </>
  );
}

/* ───────── shared bits ───────── */
function Tile({ glyph, tone, className }) {
  return <div className={'tile ' + (className || '')} style={{ '--tone': tone }}>{glyph}</div>;
}

/* ───────── A · GRID ───────── */
function GridView({ onOpen }) {
  return (
    <div className="tool-grid">
      {TOOLS.map((tool, i) => {
        const live = tool.status === 'live';
        return (
          <div key={tool.id} className={'tool-card reveal ' + tool.status}
            style={{ transitionDelay: `${0.08 + i * 0.05}s` }}
            onClick={() => onOpen(tool)}>
            <div className="c-top">
              <Tile glyph={tool.glyph} tone={tool.tone} />
              <span className={'pill ' + tool.status}>{live ? 'live' : 'soon'}</span>
            </div>
            <div>
              <h3 className="c-name">{tool.name}</h3>
              <div className="c-kind">{tool.kind}</div>
            </div>
            <p className="c-desc">{tool.desc}</p>
            <div className="c-foot">
              <span className="c-action">
                {live ? 'open' : 'soon'} {live && <Ico d={IC.arrow} size={15} />}
              </span>
              {live && tool.requiresAuth && (
                <span className="access-badge"><Ico d={IC.lock} size={12} /> auth</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────── B · ROSTER ───────── */
function RosterView({ onOpen }) {
  return (
    <div className="tool-roster">
      {TOOLS.map((tool, i) => {
        const live = tool.status === 'live';
        return (
          <div key={tool.id} className={'roster-row reveal ' + tool.status}
            style={{ transitionDelay: `${0.08 + i * 0.05}s` }}
            onClick={() => onOpen(tool)}>
            <span className="r-idx">{String(i + 1).padStart(2, '0')}</span>
            <Tile glyph={tool.glyph} tone={tool.tone} />
            <div>
              <div className="r-name">{tool.name}</div>
              <div className="r-kind">{tool.kind}</div>
            </div>
            <div className="r-desc">{tool.desc}</div>
            <span className={'pill ' + tool.status}>{live ? 'live' : 'soon'}</span>
            <span className="r-action">
              {live ? 'open' : 'soon'} {live && <Ico d={IC.arrow} size={15} />}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ───────── C · DOCK ───────── */
function DockView({ onOpen }) {
  return (
    <div className="tool-dock">
      <div className="dock-head"><span>launch</span><span>select to authenticate</span></div>
      {TOOLS.map((tool, i) => {
        const live = tool.status === 'live';
        return (
          <div key={tool.id} className={'dock-row reveal ' + tool.status}
            style={{ transitionDelay: `${0.08 + i * 0.05}s` }}
            onClick={() => onOpen(tool)}>
            <span className="d-key">{live ? `[${i + 1}]` : '·'}</span>
            <Tile glyph={tool.glyph} tone={tool.tone} />
            <div>
              <div className="d-name">{tool.name}</div>
              <div className="d-kind">{tool.kind}</div>
            </div>
            <div className="d-right">
              {live && tool.requiresAuth
                ? <span className="access-badge"><Ico d={IC.lock} size={12} /> auth</span>
                : live ? null : <span className="pill soon">soon</span>}
              {live && <Ico d={IC.arrow} size={16} className="d-arrow" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
