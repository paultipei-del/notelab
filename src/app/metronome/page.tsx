"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

// =====================================================================
// Italian tempo lookup, ordered so each BPM maps to a single best-fit name.
// =====================================================================
const TEMPO_NAMES: { name: string; max: number }[] = [
  { name: "grave",       max: 39 },
  { name: "largo",       max: 49 },
  { name: "larghetto",   max: 59 },
  { name: "lento",       max: 65 },
  { name: "adagio",      max: 71 },
  { name: "andante",     max: 89 },
  { name: "andantino",   max: 99 },
  { name: "moderato",    max: 119 },
  { name: "allegretto",  max: 131 },
  { name: "allegro",     max: 167 },
  { name: "vivace",      max: 179 },
  { name: "presto",      max: 199 },
  { name: "prestissimo", max: 400 },
];
const nameFor = (bpm: number) =>
  TEMPO_NAMES.find((t) => bpm <= t.max)?.name ?? "prestissimo";

// Canonical Italian tempo ranges from the standard mechanical-metronome chart.
const RANGES = [
  { name: "largo",     lo: 40,  hi: 66 },
  { name: "larghetto", lo: 60,  hi: 66 },
  { name: "lento",     lo: 52,  hi: 108 },
  { name: "adagio",    lo: 50,  hi: 76 },
  { name: "andante",   lo: 56,  hi: 108 },
  { name: "moderato",  lo: 66,  hi: 126 },
  { name: "allegro",   lo: 84,  hi: 144 },
  { name: "presto",    lo: 100, hi: 152 },
  { name: "vivace",    lo: 80,  hi: 160 },
];

const MIN_BPM = 20;
const MAX_BPM = 400;
const clampBpm = (n: number) => Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(n)));

// =====================================================================
// Design tokens, sourced from the live NoteLab CSS:
//   text     #2A2318  (rgb(42,35,24))
//   muted    #7A7060  (rgb(122,112,96))
//   page bg  #F2EDDF  (set on <html>, we don't override)
//   serif    var(--font-cormorant)
//   sans     var(--font-jost)
//   accent   warm rust for active beat + active range highlight
// =====================================================================
const INK = "#2A2318";
const MUTE = "#7A7060";
const RULE = "#D9D2BD";
const RULE_SOFT = "#E6E0CE";
const ACCENT = "#B0552B";
const SERIF = "var(--font-cormorant), serif";
const SANS = "var(--font-jost), sans-serif";

export default function MetronomePage() {
  const [bpm, setBpmState] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [tapFlash, setTapFlash] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  const tapTimesRef = useRef<number[]>([]);
  const tapResetRef = useRef<number | null>(null);

  // BPM display node (contentEditable span). We sync it imperatively when
  // the BPM changes externally (slider, +/-, tap), but don't touch it while
  // the user is editing it directly.
  const bpmDisplayRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = bpmDisplayRef.current;
    if (!el) return;
    if (document.activeElement === el) return; // user is typing, leave alone
    if (el.textContent !== String(bpm)) el.textContent = String(bpm);
  }, [bpm]);

  const setBpm = useCallback((n: number) => {
    const v = clampBpm(n);
    setBpmState(v);
  }, []);

  // ---------- audio ----------
  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctor =
        (window.AudioContext as typeof AudioContext) ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new Ctor();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
  }, []);

  const click = useCallback((time: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(1000, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.4, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);

    const delay = Math.max(0, (time - ctx.currentTime) * 1000);
    window.setTimeout(() => {
      setPulse(true);
      window.setTimeout(() => setPulse(false), 90);
    }, delay);
  }, []);

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const interval = 60.0 / bpmRef.current;
    while (nextNoteRef.current < ctx.currentTime + 0.1) {
      click(nextNoteRef.current);
      nextNoteRef.current += interval;
    }
  }, [click]);

  const start = useCallback(() => {
    ensureAudio();
    const ctx = audioCtxRef.current!;
    nextNoteRef.current = ctx.currentTime + 0.05;
    timerRef.current = window.setInterval(scheduler, 25);
    setPlaying(true);
  }, [ensureAudio, scheduler]);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaying(false);
    setPulse(false);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (audioCtxRef.current) {
      nextNoteRef.current = audioCtxRef.current.currentTime + 0.05;
    }
  }, [bpm, playing]);

  useEffect(() => () => { if (timerRef.current !== null) clearInterval(timerRef.current); }, []);

  // ---------- tap tempo ----------
  const tap = useCallback(() => {
    const now = performance.now();
    let times = [...tapTimesRef.current, now].filter((t) => now - t < 3000);
    if (times.length > 6) times = times.slice(-6);
    tapTimesRef.current = times;

    if (tapResetRef.current) window.clearTimeout(tapResetRef.current);
    tapResetRef.current = window.setTimeout(() => { tapTimesRef.current = []; }, 2000);

    if (times.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) intervals.push(times[i] - times[i - 1]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avg);
      if (newBpm >= MIN_BPM && newBpm <= MAX_BPM) setBpm(newBpm);
    }

    setTapFlash(true);
    window.setTimeout(() => setTapFlash(false), 100);
  }, [setBpm]);

  // ---------- keyboard ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.isContentEditable) return;
      if (e.code === "Space") { e.preventDefault(); playing ? stop() : start(); }
      else if (e.key.toLowerCase() === "t") { e.preventDefault(); tap(); }
      else if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); setBpm(bpmRef.current + 1); }
      else if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); setBpm(bpmRef.current - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, start, stop, tap, setBpm]);

  const marking = useMemo(() => nameFor(bpm), [bpm]);

  // =====================================================================
  // STYLES (inline, mirroring the tap-tempo page's approach)
  // =====================================================================
  const wrap: CSSProperties = {
    minHeight: "calc(100vh - var(--nl-site-header-h, 60px))",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "3rem 1.5rem 5rem",
    color: INK,
    fontFamily: SANS,
    boxSizing: "border-box",
  };
  const headerStyle: CSSProperties = {
    textAlign: "center",
    marginBottom: "2.5rem",
  };
  const h1Style: CSSProperties = {
    fontFamily: SERIF,
    fontWeight: 300,
    fontSize: "clamp(36px, 4.5vw, 48px)",
    letterSpacing: "0.01em",
    color: INK,
    margin: 0,
  };
  const subStyle: CSSProperties = {
    fontFamily: SANS,
    fontSize: "var(--nl-text-meta, 14px)",
    color: MUTE,
    marginTop: "0.5rem",
    letterSpacing: "0.01em",
  };
  const faceStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.75rem",
    width: "100%",
    maxWidth: "560px",
  };
  const markingStyle: CSSProperties = {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: "clamp(20px, 2.4vw, 28px)",
    color: INK,
    opacity: 0.7,
    height: "1.4em",
    letterSpacing: "0.01em",
  };
  const bpmRowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.25rem",
  };
  const pulseStyle: CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: pulse ? ACCENT : RULE,
    transform: pulse ? "scale(1.5)" : "scale(1)",
    transition: "background 80ms ease, transform 80ms ease",
    flexShrink: 0,
  };
  const bpmInputStyle: CSSProperties = {
    fontFamily: SERIF,
    fontWeight: 300,
    fontSize: "clamp(100px, 18vw, 160px)",
    lineHeight: 1,
    color: INK,
    letterSpacing: "-0.03em",
    background: "transparent",
    border: 0,
    outline: "none",
    textAlign: "center",
    minWidth: "2.5ch",
    padding: 0,
    fontVariantNumeric: "tabular-nums",
    display: "inline-block",
    cursor: "text",
  };
  const bpmLabelStyle: CSSProperties = {
    fontFamily: SANS,
    fontSize: "var(--nl-text-badge, 11px)",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: MUTE,
    marginTop: "-0.5rem",
  };
  const controlsRowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    width: "100%",
    maxWidth: "440px",
  };
  const stepBtnStyle: CSSProperties = {
    width: 36,
    height: 36,
    border: `1px solid ${RULE}`,
    background: "transparent",
    borderRadius: "50%",
    color: MUTE,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontFamily: SANS,
    fontSize: 16,
    lineHeight: 1,
    padding: 0,
    transition: "all 150ms ease",
    flexShrink: 0,
  };
  const sliderRangeStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "440px",
    fontSize: "var(--nl-text-badge, 11px)",
    color: MUTE,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "0.05em",
    marginTop: "-1rem",
  };
  const actionsStyle: CSSProperties = {
    display: "flex",
    gap: "0.75rem",
    marginTop: "0.5rem",
  };
  const playBtnStyle: CSSProperties = {
    fontFamily: SANS,
    fontSize: "var(--nl-text-compact, 13px)",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    padding: "0.95rem 2.4rem",
    minWidth: 160,
    background: INK,
    color: "#F2EDDF",
    border: `1px solid ${INK}`,
    cursor: "pointer",
    transition: "all 150ms ease",
  };
  const tapBtnStyle: CSSProperties = {
    fontFamily: SANS,
    fontSize: "var(--nl-text-compact, 13px)",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    padding: "0.95rem 2.4rem",
    minWidth: 120,
    background: tapFlash ? INK : "transparent",
    color: tapFlash ? "#F2EDDF" : INK,
    border: `1px solid ${INK}`,
    cursor: "pointer",
    transition: "all 100ms ease",
  };
  const hintStyle: CSSProperties = {
    fontFamily: SANS,
    fontSize: "var(--nl-text-badge, 11px)",
    color: MUTE,
    marginTop: "0.75rem",
    letterSpacing: "0.05em",
  };
  const refToggleStyle: CSSProperties = {
    marginTop: "4rem",
    background: "transparent",
    border: 0,
    cursor: "pointer",
    color: MUTE,
    fontFamily: SANS,
    fontSize: "var(--nl-text-compact, 13px)",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    transition: "color 150ms ease",
  };
  const refOuterStyle: CSSProperties = {
    width: "100%",
    maxWidth: "880px",
    overflow: "hidden",
    borderTop: `1px solid ${RULE}`,
    marginTop: "1.25rem",
    maxHeight: refOpen ? 2400 : 0,
    transition: "max-height 500ms ease",
  };
  const refInnerStyle: CSSProperties = {
    padding: "2.5rem 0 0.5rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "2.5rem",
  };
  const refH3Style: CSSProperties = {
    fontFamily: SERIF,
    fontWeight: 400,
    fontSize: "clamp(20px, 2vw, 24px)",
    color: INK,
    margin: "0 0 0.75rem",
    letterSpacing: "0.005em",
  };
  const refBodyStyle: CSSProperties = {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 1.55,
    color: INK,
    opacity: 0.75,
    margin: "0 0 1.25rem",
  };

  return (
    <div style={wrap}>
      <header style={headerStyle}>
        <h1 style={h1Style}>Metronome</h1>
        <p style={subStyle}>tempo, ratios, and Italian markings in one view</p>
      </header>

      <section style={faceStyle}>
        <div style={markingStyle} aria-live="polite">{marking}</div>

        <div style={bpmRowStyle}>
          <span style={pulseStyle} aria-hidden />
          <span
            ref={(el) => {
              bpmDisplayRef.current = el;
              // initial render: set text content once on mount
              if (el && el.textContent === "") el.textContent = String(bpmRef.current);
            }}
            role="textbox"
            contentEditable
            suppressContentEditableWarning
            inputMode="numeric"
            onInput={(e) => {
              const el = e.currentTarget;
              const raw = (el.textContent ?? "").replace(/\D/g, "").slice(0, 3);
              const n = parseInt(raw, 10);
              if (!isNaN(n)) {
                setBpmState(clampBpm(n));
              }
            }}
            onBlur={(e) => {
              // normalize whatever the user left on screen
              e.currentTarget.textContent = String(bpmRef.current);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.currentTarget as HTMLElement).blur();
              } else if (
                e.key.length === 1 &&
                !/[0-9]/.test(e.key) &&
                !e.metaKey &&
                !e.ctrlKey
              ) {
                e.preventDefault();
              }
            }}
            style={bpmInputStyle}
            aria-label="Beats per minute"
          />
        </div>
        <div style={bpmLabelStyle}>beats per minute</div>

        <div style={controlsRowStyle}>
          <button
            type="button"
            onClick={() => setBpm(bpm - 1)}
            style={stepBtnStyle}
            aria-label="Decrease BPM"
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = INK; e.currentTarget.style.color = INK; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = RULE; e.currentTarget.style.color = MUTE; }}
          >
            −
          </button>
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value, 10))}
            className="nl-metronome-slider"
            aria-label="Tempo"
          />
          <button
            type="button"
            onClick={() => setBpm(bpm + 1)}
            style={stepBtnStyle}
            aria-label="Increase BPM"
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = INK; e.currentTarget.style.color = INK; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = RULE; e.currentTarget.style.color = MUTE; }}
          >
            +
          </button>
        </div>
        <div style={sliderRangeStyle}>
          <span>{MIN_BPM}</span>
          <span>{MAX_BPM}</span>
        </div>

        <div style={actionsStyle}>
          <button type="button" onClick={() => (playing ? stop() : start())} style={playBtnStyle}>
            {playing ? "Stop" : "Play"}
          </button>
          <button type="button" onClick={tap} style={tapBtnStyle}>
            Tap
          </button>
        </div>

        <p style={hintStyle}>
          space play/stop &nbsp;·&nbsp; t tap &nbsp;·&nbsp; ↑ ↓ adjust
        </p>
      </section>

      <button
        type="button"
        onClick={() => setRefOpen((v) => !v)}
        style={refToggleStyle}
        onMouseEnter={(e) => { e.currentTarget.style.color = INK; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = MUTE; }}
      >
        <span>Reference</span>
        <span style={{
          fontSize: 10,
          display: "inline-block",
          transition: "transform 300ms ease",
          transform: refOpen ? "rotate(180deg)" : "rotate(0deg)",
        }}>▼</span>
      </button>

      <div style={refOuterStyle}>
        <div style={refInnerStyle}>

          {/* LEFT COLUMN: ratios + note-value examples */}
          <div>
            <h3 style={refH3Style}>Ratios</h3>
            <p style={refBodyStyle}>
              Doubled and tripled tempos relative to the current BPM. Handy for working out polyrhythms or moving between note values that share a pulse.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              borderTop: `1px solid ${RULE}`,
            }}>
              {["×1", "×2", "×3"].map((h) => (
                <div key={h} style={{
                  textAlign: "center",
                  fontFamily: SANS,
                  fontSize: "var(--nl-text-badge, 11px)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: MUTE,
                  padding: "0.7rem 0",
                  borderBottom: `1px solid ${RULE}`,
                }}>{h}</div>
              ))}
              {[bpm, bpm * 2, bpm * 3].map((v, i) => (
                <div key={i} style={{
                  textAlign: "center",
                  padding: "0.85rem 0",
                  borderBottom: `1px solid ${RULE_SOFT}`,
                }}>
                  <span style={{
                    fontFamily: SERIF,
                    fontSize: i === 0 ? 28 : 22,
                    fontWeight: 400,
                    color: i === 0 ? INK : MUTE,
                    fontVariantNumeric: "tabular-nums",
                  }}>{v}</span>
                </div>
              ))}
            </div>

            <h3 style={{ ...refH3Style, marginTop: "2.25rem" }}>Note value at 80 BPM</h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.85rem 1.5rem",
              marginTop: "0.5rem",
            }}>
              {[
                { glyph: "\uE1D7", lbl: "adagio" },
                { glyph: "\uE1D5", lbl: "andante" },
                { glyph: "\uE1D3", lbl: "allegro" },
                { glyph: "\uE1D2", lbl: "presto" },
              ].map((ex) => (
                <div key={ex.lbl} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.7rem",
                }}>
                  <span style={{
                    fontFamily: 'Bravura, "Bravura Text", serif',
                    fontSize: 28,
                    lineHeight: 1,
                    color: INK,
                    width: "1.1em",
                    display: "inline-block",
                    textAlign: "center",
                  }}>{ex.glyph}</span>
                  <span style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 17,
                    color: INK,
                    opacity: 0.8,
                  }}>{ex.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: ranges + heart-rate note */}
          <div>
            <h3 style={refH3Style}>Italian tempo ranges</h3>
            <div>
              {RANGES.map((r) => {
                const active = bpm >= r.lo && bpm <= r.hi;
                return (
                  <div key={r.name} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "baseline",
                    padding: "0.6rem 0",
                    borderBottom: `1px solid ${RULE_SOFT}`,
                  }}>
                    <span style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: 19,
                      color: active ? ACCENT : INK,
                      opacity: active ? 1 : 0.85,
                      transition: "color 150ms ease",
                    }}>{r.name}</span>
                    <span style={{
                      fontFamily: SANS,
                      fontSize: "var(--nl-text-compact, 13px)",
                      color: active ? ACCENT : MUTE,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "0.06em",
                      transition: "color 150ms ease",
                    }}>{r.lo}–{r.hi}</span>
                  </div>
                );
              })}
            </div>

            <p style={{
              marginTop: "1.5rem",
              paddingTop: "1.25rem",
              borderTop: `1px solid ${RULE_SOFT}`,
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 17,
              lineHeight: 1.55,
              color: INK,
              opacity: 0.7,
            }}>
              Many of these tempos sit close to a human pulse. A resting adult heart runs near 70 beats per minute, which lands inside the{" "}<span style={{ fontStyle: "normal", fontWeight: 500 }}>andante</span>{" "}range and lines up with a comfortable walking pace. Smaller bodies beat faster: a child of seven holds around 90, and a fetal heart can reach 180.
            </p>
          </div>

        </div>
      </div>

      <style jsx global>{`
        .nl-metronome-slider {
          flex: 1;
          appearance: none;
          -webkit-appearance: none;
          height: 1px;
          background: ${RULE};
          outline: none;
          margin: 0;
        }
        .nl-metronome-slider::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${INK};
          cursor: grab;
          border: 3px solid #F2EDDF;
          box-shadow: 0 0 0 1px ${INK};
        }
        .nl-metronome-slider::-webkit-slider-thumb:active { cursor: grabbing; }
        .nl-metronome-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${INK};
          cursor: grab;
          border: 3px solid #F2EDDF;
          box-shadow: 0 0 0 1px ${INK};
        }
      `}</style>
    </div>
  );
}
