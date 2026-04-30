"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ----- italian tempo lookup (single name per BPM) -----
const TEMPO_NAMES: { name: string; max: number }[] = [
  { name: "grave",       max: 39 },
  { name: "largo",       max: 49 },
  { name: "larghetto",   max: 59 },
  { name: "lento",       max: 65 },
  { name: "adagio",      max: 71 },
  { name: "andante",     max: 85 },
  { name: "andantino",   max: 97 },
  { name: "moderato",    max: 113 },
  { name: "allegretto",  max: 119 },
  { name: "allegro",     max: 156 },
  { name: "vivace",      max: 175 },
  { name: "presto",      max: 199 },
  { name: "prestissimo", max: 400 },
];
const nameFor = (bpm: number) =>
  TEMPO_NAMES.find((t) => bpm <= t.max)?.name ?? "prestissimo";

// canonical ranges from the standard chart
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

export default function MetronomePage() {
  const [bpm, setBpmState] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [bpmInput, setBpmInput] = useState("120");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  // tap tempo
  const tapTimesRef = useRef<number[]>([]);
  const tapResetRef = useRef<number | null>(null);
  const [tapFlash, setTapFlash] = useState(false);

  const setBpm = useCallback((n: number) => {
    const v = clampBpm(n);
    setBpmState(v);
    setBpmInput(String(v));
  }, []);

  // --- audio ---
  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctor =
        (window.AudioContext as typeof AudioContext) ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new Ctor();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
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

  // restart scheduling on tempo change while playing (interval changes)
  useEffect(() => {
    if (!playing) return;
    // re-prime nextNoteTime so we don't backlog
    if (audioCtxRef.current) {
      nextNoteRef.current = audioCtxRef.current.currentTime + 0.05;
    }
  }, [bpm, playing]);

  useEffect(() => () => { if (timerRef.current !== null) clearInterval(timerRef.current); }, []);

  // --- tap tempo ---
  const tap = useCallback(() => {
    const now = performance.now();
    let times = [...tapTimesRef.current, now].filter((t) => now - t < 3000);
    if (times.length > 6) times = times.slice(-6);
    tapTimesRef.current = times;

    if (tapResetRef.current) window.clearTimeout(tapResetRef.current);
    tapResetRef.current = window.setTimeout(() => {
      tapTimesRef.current = [];
    }, 2000);

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

  // --- keyboard shortcuts ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.isContentEditable) return;

      if (e.code === "Space") {
        e.preventDefault();
        playing ? stop() : start();
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        tap();
      } else if (e.key === "ArrowUp" || e.key === "ArrowRight") {
        e.preventDefault();
        setBpm(bpmRef.current + 1);
      } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
        e.preventDefault();
        setBpm(bpmRef.current - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, start, stop, tap, setBpm]);

  const marking = useMemo(() => nameFor(bpm), [bpm]);

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#1a1a18] font-sans">
      <main className="max-w-5xl mx-auto px-6 pt-16 pb-24">
        <header className="text-center mb-16">
          <h1 className="font-serif font-normal text-3xl tracking-tight">Metronome</h1>
          <p className="mt-2 text-sm text-[#8a8a84]">tempo, ratios, and Italian markings in one view</p>
        </header>

        {/* ---------- face ---------- */}
        <section className="flex flex-col items-center gap-10">
          <div
            className="font-serif italic text-2xl text-[#4a4a46] tracking-wide h-7 transition-colors"
            aria-live="polite"
          >
            {marking}
          </div>

          <div className="flex items-baseline gap-5">
            <span
              className={`block w-2.5 h-2.5 rounded-full transition-all duration-75 ${
                pulse ? "bg-[#c9402c] scale-[1.4]" : "bg-[#e5e3dc]"
              }`}
              aria-hidden
            />
            <input
              type="text"
              inputMode="numeric"
              value={bpmInput}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                setBpmInput(v);
                const n = parseInt(v, 10);
                if (!isNaN(n)) setBpmState(clampBpm(n));
              }}
              onBlur={() => setBpmInput(String(bpm))}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="font-serif font-normal text-9xl leading-none tracking-tight bg-transparent border-0 outline-none w-[5ch] text-center tabular-nums"
              aria-label="Beats per minute"
            />
          </div>
          <div className="-mt-6 text-[0.7rem] tracking-[0.18em] uppercase text-[#8a8a84]">
            beats per minute
          </div>

          <div className="w-full max-w-md flex items-center gap-4">
            <button
              onClick={() => setBpm(bpm - 1)}
              className="w-9 h-9 rounded-full border border-[#e5e3dc] grid place-items-center text-[#4a4a46] hover:border-[#1a1a18] hover:text-[#1a1a18] active:scale-95 transition"
              aria-label="Decrease BPM"
            >
              −
            </button>
            <input
              type="range"
              min={MIN_BPM}
              max={MAX_BPM}
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value, 10))}
              className="metronome-slider flex-1"
              aria-label="Tempo"
            />
            <button
              onClick={() => setBpm(bpm + 1)}
              className="w-9 h-9 rounded-full border border-[#e5e3dc] grid place-items-center text-[#4a4a46] hover:border-[#1a1a18] hover:text-[#1a1a18] active:scale-95 transition"
              aria-label="Increase BPM"
            >
              +
            </button>
          </div>
          <div className="w-full max-w-md flex justify-between text-[0.7rem] text-[#8a8a84] tabular-nums -mt-7">
            <span>{MIN_BPM}</span>
            <span>{MAX_BPM}</span>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => (playing ? stop() : start())}
              className="font-sans text-[0.78rem] tracking-[0.12em] uppercase px-9 py-3.5 min-w-[160px] bg-[#1a1a18] text-[#fafaf7] hover:bg-black transition"
            >
              {playing ? "Stop" : "Play"}
            </button>
            <button
              onClick={tap}
              className={`font-sans text-[0.78rem] tracking-[0.12em] uppercase px-9 py-3.5 min-w-[120px] border border-[#1a1a18] transition ${
                tapFlash ? "bg-[#1a1a18] text-[#fafaf7]" : "bg-transparent text-[#1a1a18] hover:bg-[#1a1a18] hover:text-[#fafaf7]"
              }`}
            >
              Tap
            </button>
          </div>

          <p className="mt-4 text-xs text-[#8a8a84]">
            <span className="tracking-[0.14em] uppercase">space</span> play/stop
            <span className="mx-2">·</span>
            <span className="tracking-[0.14em] uppercase">t</span> tap
            <span className="mx-2">·</span>
            <span className="tracking-[0.14em] uppercase">↑↓</span> adjust
          </p>
        </section>

        {/* ---------- reference drawer ---------- */}
        <button
          onClick={() => setRefOpen((v) => !v)}
          className="mt-20 mx-auto flex items-center gap-2 px-2 py-2 text-[#4a4a46] hover:text-[#1a1a18] transition text-[0.78rem] tracking-[0.14em] uppercase"
        >
          <span>Reference</span>
          <span className={`text-xs transition-transform duration-300 ${refOpen ? "rotate-180" : ""}`}>▾</span>
        </button>

        <div
          className={`overflow-hidden border-t border-[#e5e3dc] mt-6 transition-[max-height] duration-500 ease-out ${
            refOpen ? "max-h-[2400px]" : "max-h-0"
          }`}
        >
          <div className="pt-12 pb-4 grid md:grid-cols-2 gap-12">

            <div>
              <h3 className="font-serif text-lg font-medium mb-3">Ratios</h3>
              <p className="font-serif text-[#4a4a46] text-[0.95rem] leading-relaxed mb-5">
                Doubled and tripled tempos relative to the current BPM. Handy for working out polyrhythms or moving between note values that share a pulse.
              </p>

              <div className="grid grid-cols-3 border-t border-[#e5e3dc]">
                <div className="text-center text-[0.65rem] tracking-[0.18em] uppercase text-[#8a8a84] py-3 border-b border-[#e5e3dc]">×1</div>
                <div className="text-center text-[0.65rem] tracking-[0.18em] uppercase text-[#8a8a84] py-3 border-b border-[#e5e3dc]">×2</div>
                <div className="text-center text-[0.65rem] tracking-[0.18em] uppercase text-[#8a8a84] py-3 border-b border-[#e5e3dc]">×3</div>
                <div className="text-center py-3 border-b border-[#efede6]"><span className="font-serif text-2xl tabular-nums">{bpm}</span></div>
                <div className="text-center py-3 border-b border-[#efede6]"><span className="font-serif text-xl tabular-nums text-[#8a8a84]">{bpm * 2}</span></div>
                <div className="text-center py-3 border-b border-[#efede6]"><span className="font-serif text-xl tabular-nums text-[#8a8a84]">{bpm * 3}</span></div>
              </div>

              <h3 className="font-serif text-lg font-medium mt-10 mb-3">Note value at 80 BPM</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  // SMuFL codepoints rendered via the site's Bravura font.
                  // Unicode music glyphs left as fallback in the font chain.
                  { glyph: "", fallback: "♪",  lbl: "adagio" },   // noteEighthUp
                  { glyph: "", fallback: "♩",  lbl: "andante" },  // noteQuarterUp
                  { glyph: "", fallback: "𝅗𝅥", lbl: "allegro" },  // noteHalfUp
                  { glyph: "", fallback: "𝅝",  lbl: "presto" },   // noteWhole
                ].map((ex) => (
                  <div key={ex.lbl} className="flex items-baseline gap-2 font-serif">
                    <span
                      className="text-3xl leading-none"
                      style={{ fontFamily: "Bravura, 'Bravura Text', 'Bravura Learn', serif" }}
                      aria-hidden
                    >
                      {ex.glyph}
                    </span>
                    <span className="italic text-[#4a4a46]">{ex.lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-serif text-lg font-medium mb-3">Italian tempo ranges</h3>
              <div className="flex flex-col">
                {RANGES.map((r) => {
                  const active = bpm >= r.lo && bpm <= r.hi;
                  return (
                    <div
                      key={r.name}
                      className={`grid grid-cols-[1fr_auto] items-baseline py-2.5 border-b border-[#efede6] transition-colors ${
                        active ? "text-[#c9402c]" : ""
                      }`}
                    >
                      <span className="font-serif italic text-[1.05rem]">{r.name}</span>
                      <span className={`font-sans text-[0.78rem] tabular-nums tracking-wider ${active ? "text-[#c9402c]" : "text-[#8a8a84]"}`}>
                        {r.lo}–{r.hi}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 pt-5 border-t border-[#efede6] font-serif italic text-[0.95rem] text-[#8a8a84] leading-relaxed">
                Many of these tempos sit close to a human pulse. A resting adult heart runs near 70 beats per minute, which lands inside the <span className="not-italic font-medium">andante</span> range and lines up with a comfortable walking pace. Smaller bodies beat faster: a child of seven holds around 90, and a fetal heart can reach 180.
              </p>
            </div>

          </div>
        </div>
      </main>

      {/* slider styling, kept here so component is self-contained */}
      <style jsx global>{`
        .metronome-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 1px;
          background: #e5e3dc;
          outline: none;
        }
        .metronome-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #1a1a18;
          cursor: grab;
          border: 3px solid #fafaf7;
          box-shadow: 0 0 0 1px #1a1a18;
        }
        .metronome-slider::-webkit-slider-thumb:active { cursor: grabbing; }
        .metronome-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #1a1a18;
          cursor: grab;
          border: 3px solid #fafaf7;
          box-shadow: 0 0 0 1px #1a1a18;
        }
      `}</style>
    </div>
  );
}
