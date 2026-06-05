// notes-app.jsx — private local scratchpad
const { useCallback, useEffect, useMemo, useRef, useState } = React;

const STORE_KEY = 'ej_notes';
const AUTH_KEY = 'notes_authed';
const THEME_KEY = 'ej_theme';

function hasNotesAccess() {
  try { return sessionStorage.getItem(AUTH_KEY) === '1'; } catch (e) { return false; }
}

function redirectToCredential() {
  location.replace('/credential?service=notes');
}

function Ico({ d, size = 16, sw = 1.7, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {d.split('|').map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

const IC = {
  pin: 'M12 17v5|M5 17h14|M8 3h8l-1 8 3 3v3H6v-3l3-3-1-8z',
  sun: 'M12 4V2|M12 22v-2|M4 12H2|M22 12h-2|M5 5l-1.4-1.4|M20.4 20.4 19 19|M5 19l-1.4 1.4|M20.4 3.6 19 5|M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  moon: 'M21 12.8A8.6 8.6 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8z',
};

function uuidv4() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => n && n.id) : [];
  } catch (e) {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw && !localStorage.getItem(STORE_KEY + '_corrupt_latest')) {
        const key = STORE_KEY + '_corrupt_' + new Date().toISOString();
        localStorage.setItem(key, raw);
        localStorage.setItem(STORE_KEY + '_corrupt_latest', key);
      }
    } catch (_e) {}
    return [];
  }
}

function persistNotes(notes) {
  localStorage.setItem(STORE_KEY, JSON.stringify(notes));
}

function mergeDraft(notes, draft) {
  if (!draft || !draft.id) return notes;
  const now = new Date().toISOString();
  const saved = { ...draft, updatedAt: now };
  return notes.some((n) => n.id === saved.id)
    ? notes.map((n) => n.id === saved.id ? saved : n)
    : [saved, ...notes];
}

function noteTitle(note) {
  return (note.title || '').trim() || 'Untitled';
}

function wordCount(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

function relativeTime(iso) {
  if (!iso) return 'just now';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 45000) return 'just now';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-CA');
}

function savedTime(iso) {
  if (!iso) return 'not saved';
  return `last saved ${relativeTime(iso)}`;
}

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
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === 'light' || saved === 'dark' ? saved : 'dark';
    } catch (e) {
      return 'dark';
    }
  });
  const [notes, setNotes] = useState(loadNotes);
  const [selectedId, setSelectedId] = useState(() => loadNotes()[0]?.id || null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [shown, setShown] = useState(false);
  const saveTimer = useRef(null);
  const savedFlashTimer = useRef(null);
  const latestNotes = useRef(notes);
  const latestDraft = useRef(draft);
  const latestSaveState = useRef(saveState);
  const titleRef = useRef(null);
  const clock = useClock();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }, [theme]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedNotes;
    return sortedNotes.filter((n) => `${n.title || ''}\n${n.body || ''}`.toLowerCase().includes(q));
  }, [query, sortedNotes]);

  const selected = useMemo(() => notes.find((n) => n.id === selectedId) || null, [notes, selectedId]);

  useEffect(() => {
    setDraft(selected ? { ...selected } : null);
    setDeleteConfirm(false);
    setSaveState('idle');
    clearTimeout(saveTimer.current);
  }, [selectedId]);

  useEffect(() => {
    if (!selected && notes.length) setSelectedId(sortedNotes[0].id);
  }, [notes, selected, sortedNotes]);

  useEffect(() => { latestNotes.current = notes; }, [notes]);
  useEffect(() => { latestDraft.current = draft; }, [draft]);
  useEffect(() => { latestSaveState.current = saveState; }, [saveState]);

  const flashSaved = () => {
    setSaveState('saved');
    clearTimeout(savedFlashTimer.current);
    savedFlashTimer.current = setTimeout(() => setSaveState('idle'), 1300);
  };

  const commitDraft = useCallback((nextDraft) => {
    setNotes((prev) => {
      const next = mergeDraft(prev, nextDraft);
      const saved = next.find((n) => n.id === nextDraft.id) || nextDraft;
      persistNotes(next);
      latestNotes.current = next;
      latestDraft.current = saved;
      setDraft(saved);
      return next;
    });
    flashSaved();
  }, []);

  const scheduleSave = useCallback((nextDraft) => {
    setDraft(nextDraft);
    setDeleteConfirm(false);
    setSaveState('pending');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => commitDraft(nextDraft), 800);
  }, [commitDraft]);

  useEffect(() => {
    const flushPending = () => {
      if (latestSaveState.current !== 'pending' || !latestDraft.current) return;
      const next = mergeDraft(latestNotes.current, latestDraft.current);
      try { persistNotes(next); } catch (e) {}
      latestNotes.current = next;
      latestSaveState.current = 'saved';
    };
    window.addEventListener('pagehide', flushPending);
    window.addEventListener('beforeunload', flushPending);
    return () => {
      flushPending();
      window.removeEventListener('pagehide', flushPending);
      window.removeEventListener('beforeunload', flushPending);
      clearTimeout(saveTimer.current);
      clearTimeout(savedFlashTimer.current);
    };
  }, []);

  const createNote = useCallback(() => {
    if (draft && saveState === 'pending') commitDraft(draft);
    clearTimeout(saveTimer.current);
    const now = new Date().toISOString();
    const note = {
      id: uuidv4(),
      title: '',
      body: '',
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => {
      const next = [note, ...prev];
      persistNotes(next);
      return next;
    });
    setSelectedId(note.id);
    setDraft(note);
    setSaveState('saved');
    requestAnimationFrame(() => titleRef.current?.focus());
  }, [commitDraft, draft, saveState]);

  const selectNote = (id) => {
    if (id === selectedId) return;
    if (draft && saveState === 'pending') commitDraft(draft);
    setSelectedId(id);
  };

  const updateDraft = (patch) => {
    if (!draft) return;
    scheduleSave({ ...draft, ...patch });
  };

  const togglePin = () => {
    if (!draft) return;
    const next = { ...draft, pinned: !draft.pinned };
    clearTimeout(saveTimer.current);
    commitDraft(next);
  };

  const deleteNote = () => {
    if (!draft) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    clearTimeout(saveTimer.current);
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== draft.id);
      persistNotes(next);
      const fallback = [...next].sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      })[0];
      setSelectedId(fallback?.id || null);
      return next;
    });
    setDraft(null);
    setDeleteConfirm(false);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <>
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
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <Ico d={theme === 'dark' ? IC.sun : IC.moon} size={14} sw={1.6} />
          </button>
          <span className="clock">{clock}</span>
        </div>
      </div>

      <main className={'wrap reveal' + (shown ? ' in' : '')}>
        <section className="hero">
          <div className="kicker">private workspace</div>
          <h1><span className="accent">Notes</span>.<br/><span className="ser">capture, search, pin</span>.</h1>
          <p className="lede"><b>Local scratchpad</b> for quick markdown-ish notes stored on this browser.</p>
        </section>

        <input
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search notes"
          aria-label="Search notes"
        />

        <section className="notes-shell">
          <aside className="note-list" aria-label="Notes list">
            <button className="new-note" onClick={createNote}>+ new note</button>
            {notes.length === 0 ? (
              <div className="empty">No notes yet. Press [+ new note] to start.</div>
            ) : filteredNotes.length === 0 ? (
              <div className="empty">No matching notes.</div>
            ) : filteredNotes.map((note) => (
              <button
                key={note.id}
                className={'note-row' + (note.id === selectedId ? ' active' : '') + (note.pinned ? ' pinned' : '')}
                onClick={() => selectNote(note.id)}>
                <span>
                  <span className="note-title">{noteTitle(note)}</span>
                  <span className="note-time">{relativeTime(note.updatedAt)}</span>
                </span>
                <Ico d={IC.pin} size={15} className="pin" />
              </button>
            ))}
          </aside>

          {draft ? (
            <article className="editor" aria-label="Note editor">
              <input
                ref={titleRef}
                className="title-input"
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                placeholder="Untitled"
                aria-label="Note title"
              />
              <textarea
                className="body-input"
                value={draft.body}
                onChange={(e) => updateDraft({ body: e.target.value })}
                placeholder="Write here..."
                aria-label="Note body"
              />
              <footer className="editor-foot">
                <button className={'mini-btn' + (draft.pinned ? ' active' : '')} onClick={togglePin}>
                  {draft.pinned ? 'pinned' : 'pin'}
                </button>
                <button className={'mini-btn danger' + (deleteConfirm ? ' confirm' : '')} onClick={deleteNote}>
                  {deleteConfirm ? 'confirm delete' : 'delete'}
                </button>
                <span className="foot-spacer"></span>
                <span>{wordCount(draft.body)} words</span>
                <span className={'save-state ' + saveState}>{saveState === 'pending' ? 'saving...' : saveState === 'saved' ? 'saved' : savedTime(draft.updatedAt)}</span>
              </footer>
            </article>
          ) : (
            <div className="blank-editor">No notes yet. Press [+ new note] to start.</div>
          )}
        </section>
      </main>
    </>
  );
}

if (hasNotesAccess()) {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
} else {
  redirectToCredential();
}
