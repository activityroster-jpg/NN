'use client'

// Ported from the BoatyJobs navigation course player. The guide "video": a sequence of animated scenes with spoken narration.
// Narration uses the browser's built-in speech synthesis (no audio files
// to host), spoken a sentence at a time so captions follow along and long
// utterances are never cut off. Without speech (muted, or unsupported)
// the scenes run on a reading-speed timer with captions.

import { splitSentences } from '@/lib/cruising/narration'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'


// Small inline icons (the site has no icon library).
type IP = { size?: number; className?: string; [prop: string]: unknown }
const svg = (d: ReactNode, fill = false) =>
  function Icon({ size = 20, className = '' }: IP) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {d}
      </svg>
    )
  }
const Play = svg(<path d="M7 4.5v15l12-7.5z" />, true)
const Pause = svg(<><rect x="6" y="4.5" width="4" height="15" rx="1" /><rect x="14" y="4.5" width="4" height="15" rx="1" /></>, true)
const SkipBack = svg(<><path d="M19 20 9 12l10-8z" /><path d="M5 19V5" /></>)
const SkipForward = svg(<><path d="m5 4 10 8-10 8z" /><path d="M19 5v14" /></>)
const Volume2 = svg(<><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></>)
const VolumeX = svg(<><path d="M11 5 6 9H2v6h4l5 4z" /><path d="m22 9-6 6" /><path d="m16 9 6 6" /></>)
const Settings = svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>)
const Maximize = svg(<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />)
const RotateCcw = svg(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>)
const ArrowDown = svg(<><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></>)
const ChevronRight = svg(<path d="m9 18 6-6-6-6" />)
const TriangleAlert = svg(<><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>)

export interface Scene {
  /** Chapter title. */
  title: string
  /** Spoken narration; also the captions and transcript. */
  narration: string
  /** Minimum seconds on screen, for animations that need longer than the words. */
  seconds?: number
  /**
   * The visual at progress t (0 → 1 through the narration). `sentence` is
   * the index of the narration sentence being spoken: switch visuals on it
   * when they must match a particular sentence exactly. `seconds` is real
   * elapsed scene time, for things that run at a fixed rate (flashing lights).
   */
  render: (t: number, sentence: number, seconds: number) => ReactNode
  /** Audio played once when the scene starts (intro music). */
  sound?: string
}

const BASE_CHARS_PER_SECOND = 14.5
const HOLD_AFTER_SCENE_MS = 700

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const gb = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('en-gb'))
  return (
    gb.find((v) => /natural/i.test(v.name)) ??
    gb.find((v) => /google uk english/i.test(v.name)) ??
    gb.find((v) => /daniel|serena|kate|libby|sonia|ryan/i.test(v.name)) ??
    gb[0] ??
    voices.find((v) => v.lang.toLowerCase().startsWith('en')) ??
    null
  )
}

const noopSubscribe = () => () => {}

// Icon buttons in the navy player chrome: 44px touch targets on phones.
const ICON_BUTTON =
  'flex size-11 shrink-0 items-center justify-center rounded-xl text-white/85 transition-colors hover:bg-white/10 hover:text-white ' +
  'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[#e9b9a6] disabled:cursor-not-allowed disabled:text-white/30 disabled:hover:bg-transparent sm:size-10'

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

interface Frame {
  scene: number
  sentence: number
  t: number
  /** Seconds the scene has been playing (paused time excluded). */
  seconds: number
}

/** Spoken text for a caption: respells names the voice gets wrong (longest first). */
function forSpeech(text: string, pronounce?: Record<string, string>): string {
  let out = text.replace(/°/g, ' degrees ').replace(/(\d)'/g, '$1 minutes')
  if (pronounce) {
    for (const k of Object.keys(pronounce).sort((a, b) => b.length - a.length)) out = out.split(k).join(pronounce[k]!)
  }
  return out
}

export default function LessonPlayer({
  title,
  scenes,
  pronounce,
  poster = 1,
  audioUrl,
}: {
  title: string
  scenes: Scene[]
  pronounce?: Record<string, string>
  /** Scene shown finished as the poster before play. */
  poster?: number
  /** Recorded narration: the audio URL for a sentence. Falls back to the device voice on error. */
  audioUrl?: (sentence: string) => string
}) {
  const sentences = useMemo(() => scenes.map((s) => splitSentences(s.narration)), [scenes])
  const sceneChars = useMemo(() => sentences.map((ss) => ss.reduce((n, s) => n + s.length, 0)), [sentences])

  const [frame, setFrame] = useState<Frame>({ scene: 0, sentence: 0, t: 0, seconds: 0 })
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [ended, setEnded] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)
  const [captionsOn, setCaptionsOn] = useState(true)
  const [rate, setRate] = useState(1)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceName, setVoiceName] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [voiceFailed, setVoiceFailed] = useState(false)
  const [recordedFailed, setRecordedFailed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  // Scenes render only in the browser: their trig-heavy SVG can differ in
  // the last decimal place from the server's, and the transcript below
  // already carries the content for search engines.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)

  // Mutable playback state read by the animation loop and speech callbacks.
  const e = useRef({
    playing: false,
    scene: 0,
    sentence: 0,
    sceneMs: 0,
    sentenceMs: 0,
    speechDone: false,
    speaking: false,
    gen: 0,
    cps: BASE_CHARS_PER_SECOND,
    holdMs: 0,
    last: 0,
    raf: 0,
    voiceOn: true,
    rate: 1,
    voice: null as SpeechSynthesisVoice | null,
    /** Recorded narration failed: use the device voice from now on. */
    audioFailed: false,
  })
  // One element each for narration and music, created inside the first tap
  // so mobile browsers allow later playback.
  const narrationEl = useRef<HTMLAudioElement | null>(null)
  const musicEl = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const load = () => {
      const list = window.speechSynthesis.getVoices()
      setVoices(list)
      // No installed voices (common on Linux): captions only.
      setSpeechSupported(list.length > 0)
      if (!e.current.voice) e.current.voice = pickVoice(list)
      setVoiceName(e.current.voice?.name ?? null)
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    const engine = e.current
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load)
      engine.gen++
      engine.playing = false
      cancelAnimationFrame(engine.raf)
      window.speechSynthesis.cancel()
    }
  }, [])

  const recorded = !!audioUrl
  const canSpeak = (recorded || speechSupported) && voiceOn

  const stopSpeech = useCallback(() => {
    e.current.gen++
    e.current.speaking = false
    narrationEl.current?.pause()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  const speakCurrent = useCallback(() => {
    const s = e.current
    if (!s.voiceOn || typeof window === 'undefined') return
    const text = sentences[s.scene]?.[s.sentence]
    if (!text) return
    const gen = ++s.gen
    const finishRecorded = () => {
      if (gen !== s.gen) return
      s.speaking = false
      if (s.sentenceMs > 400) {
        const measured = text.length / (s.sentenceMs / 1000)
        s.cps = Math.min(26, Math.max(8, s.cps * 0.6 + measured * 0.4))
      }
      advanceSentence()
    }
    if (audioUrl && !s.audioFailed) {
      const a = narrationEl.current ?? (narrationEl.current = new Audio())
      a.onended = finishRecorded
      a.onerror = () => {
        if (gen !== s.gen) return
        // Not available (no key, busy or offline): switch to the device voice.
        s.audioFailed = true
        setRecordedFailed(true)
        speakCurrent()
      }
      a.src = audioUrl(text)
      a.playbackRate = s.rate
      s.speaking = true
      a.play().catch(() => a.onerror?.(new Event('error')))
      // Warm the next sentence so it is ready (and generated) in time.
      const next = sentences[s.scene]?.[s.sentence + 1] ?? sentences[s.scene + 1]?.[0]
      if (next) void fetch(audioUrl(next)).catch(() => {})
      return
    }
    if (!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(forSpeech(text, pronounce))
    u.lang = 'en-GB'
    if (s.voice) u.voice = s.voice
    u.rate = s.rate
    const finish = () => {
      if (gen !== s.gen) return
      s.speaking = false
      // Calibrate the reading speed so animations track the real voice.
      if (s.sentenceMs > 400) {
        const measured = text.length / (s.sentenceMs / 1000)
        s.cps = Math.min(26, Math.max(8, s.cps * 0.6 + measured * 0.4))
      }
      advanceSentence()
    }
    u.onend = finish
    u.onerror = (ev) => {
      if (gen !== s.gen) return
      if (ev.error === 'interrupted' || ev.error === 'canceled') return finish()
      // Blocked or unavailable: carry on with captions on the timer.
      s.speaking = false
      s.voiceOn = false
      setVoiceFailed(true)
    }
    s.speaking = true
    window.speechSynthesis.speak(u)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences, pronounce, audioUrl])

  function advanceSentence() {
    const s = e.current
    if (s.sentence < sentences[s.scene]!.length - 1) {
      s.sentence++
      s.sentenceMs = 0
      speakCurrent()
    } else {
      s.speechDone = true
    }
  }

  const playSound = useCallback((scene: number) => {
    const src = scenes[scene]?.sound
    const m = musicEl.current
    if (!m) return
    if (!src || !e.current.voiceOn) {
      m.pause()
      return
    }
    m.src = src
    m.volume = 0.8
    void m.play().catch(() => {})
  }, [scenes])

  const goTo = useCallback((index: number) => {
    const s = e.current
    stopSpeech()
    s.scene = Math.max(0, Math.min(scenes.length - 1, index))
    s.sentence = 0
    s.sceneMs = 0
    s.sentenceMs = 0
    s.holdMs = 0
    s.speechDone = false
    setEnded(false)
    setFrame({ scene: s.scene, sentence: 0, t: 0, seconds: 0 })
    // Chrome drops an utterance queued in the same tick as cancel().
    if (s.playing) {
      playSound(s.scene)
      window.setTimeout(() => { if (s.playing) speakCurrent() }, 80)
    }
  }, [scenes.length, speakCurrent, stopSpeech, playSound])

  const tick = useCallback((now: number) => {
    const s = e.current
    if (!s.playing) return
    const dt = Math.min(100, now - s.last)
    s.last = now
    s.sceneMs += dt
    s.sentenceMs += dt
    const list = sentences[s.scene] ?? []
    // Scenes without narration (the intro) just run for their minimum time.
    if (list.length === 0) s.speechDone = true
    const cur = list[s.sentence] ?? ''
    const expectedMs = (cur.length / (s.cps * (s.voiceOn ? 1 : s.rate))) * 1000
    if (!s.speechDone) {
      if (!s.voiceOn || !speechReady()) {
        if (s.sentenceMs >= expectedMs) advanceSentence()
      } else if (s.speaking && s.sentenceMs > expectedMs * 2.5 + 3000) {
        // Watchdog: some platforms never fire onend.
        stopSpeech()
        advanceSentence()
      }
    }
    const done = list.slice(0, s.sentence).reduce((n, x) => n + x.length, 0)
    const within = s.speechDone ? cur.length : Math.min(cur.length * 0.97, (s.sentenceMs / 1000) * s.cps * (s.voiceOn ? 1 : s.rate))
    const total = sceneChars[s.scene] || 1
    const minMs = (scenes[s.scene]!.seconds ?? 0) * 1000
    let t = s.speechDone ? 1 : (done + within) / total
    if (minMs > 0) t = Math.min(t, s.sceneMs / minMs)
    if (s.speechDone && s.sceneMs >= minMs) {
      t = 1
      s.holdMs += dt
      if (s.holdMs >= HOLD_AFTER_SCENE_MS) {
        if (s.scene < scenes.length - 1) {
          goTo(s.scene + 1)
        } else {
          s.playing = false
          setPlaying(false)
          setEnded(true)
          setFrame({ scene: s.scene, sentence: s.sentence, t: 1, seconds: s.sceneMs / 1000 })
          return
        }
      }
    }
    setFrame({ scene: s.scene, sentence: s.sentence, t: Math.max(0, Math.min(1, t)), seconds: s.sceneMs / 1000 })
    s.raf = requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences, sceneChars, scenes, goTo, stopSpeech])

  function speechReady() {
    if (audioUrl && !e.current.audioFailed) return true
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  function play() {
    const s = e.current
    if (ended) {
      s.scene = 0
      setEnded(false)
    }
    s.playing = true
    s.voiceOn = canSpeak
    s.rate = rate
    s.sentenceMs = 0
    s.holdMs = 0
    if (ended) {
      s.sentence = 0
      s.sceneMs = 0
      s.speechDone = false
    }
    s.last = performance.now()
    if (audioUrl && !narrationEl.current) narrationEl.current = new Audio()
    if (!musicEl.current) musicEl.current = new Audio()
    setPlaying(true)
    setStarted(true)
    if (s.sceneMs === 0) playSound(s.scene)
    // Speak inside the click handler: iOS only allows speech started by a tap.
    if (!s.speechDone) speakCurrent()
    s.raf = requestAnimationFrame(tick)
  }

  function pause() {
    const s = e.current
    s.playing = false
    cancelAnimationFrame(s.raf)
    stopSpeech()
    musicEl.current?.pause()
    setPlaying(false)
  }

  function toggleVoice() {
    setVoiceFailed(false)
    const next = !voiceOn
    setVoiceOn(next)
    const s = e.current
    s.voiceOn = next && (recorded || speechSupported)
    if (!next) {
      stopSpeech()
    } else if (s.playing && !s.speechDone) {
      s.sentenceMs = 0
      speakCurrent()
    }
  }

  function changeRate(r: number) {
    setRate(r)
    e.current.rate = r
    if (e.current.playing && e.current.voiceOn && !e.current.speechDone) {
      stopSpeech()
      e.current.sentenceMs = 0
      speakCurrent()
    }
  }

  function changeVoice(name: string) {
    const v = voices.find((x) => x.name === name) ?? null
    e.current.voice = v
    setVoiceName(v?.name ?? null)
    if (e.current.playing && e.current.voiceOn && !e.current.speechDone) {
      stopSpeech()
      e.current.sentenceMs = 0
      speakCurrent()
    }
  }

  function jump(index: number) {
    setStarted(true)
    goTo(index)
  }

  function fullscreen() {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen?.()
  }

  const totalSeconds = useMemo(
    () => scenes.reduce((n, sc, i) => n + Math.max(sc.seconds ?? 0, sceneChars[i]! / BASE_CHARS_PER_SECOND) + HOLD_AFTER_SCENE_MS / 1000, 0),
    [scenes, sceneChars],
  )
  const elapsedSeconds =
    scenes.slice(0, frame.scene).reduce((n, sc, i) => n + Math.max(sc.seconds ?? 0, sceneChars[i]! / BASE_CHARS_PER_SECOND) + HOLD_AFTER_SCENE_MS / 1000, 0) +
    frame.t * Math.max(scenes[frame.scene]!.seconds ?? 0, sceneChars[frame.scene]! / BASE_CHARS_PER_SECOND)

  const caption = sentences[frame.scene]?.[frame.sentence] ?? ''
  const voiceOptions = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))

  return (
    <section aria-label={`${title} — guide video`} className="rounded-2xl bg-[#13293b] p-1.5 sm:p-3">
      <div ref={containerRef} className="relative overflow-hidden rounded-xl bg-[#1b3a52]" style={{ aspectRatio: '16 / 9' }}>
        {/* Before play, the poster scene is shown finished. */}
        <div className="absolute inset-0">
          {mounted &&
            (started
              ? scenes[frame.scene]!.render(frame.t, frame.sentence, frame.seconds)
              : scenes[Math.min(poster, scenes.length - 1)]!.render(1, 99, 0))}
        </div>

        {/* On wider screens captions sit over the picture; phones get them below it. */}
        {captionsOn && started && caption && (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 hidden justify-center px-4 sm:flex">
            <p className="max-w-3xl rounded-xl bg-[#13293b]/85 px-3 py-1.5 text-center text-base leading-snug text-white" aria-live="off">
              {caption}
            </p>
          </div>
        )}

        {!started && (
          <button
            type="button"
            onClick={play}
            className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#13293b]/55 text-white transition-colors hover:bg-[#13293b]/45 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#e9b9a6]"
            aria-label={`Play the guide video: ${title}`}
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-brand ring-4 ring-white/25 transition-colors group-hover:bg-[#8d3b24] sm:size-20">
              <Play size={30} fill="currentColor" strokeWidth={0} className="ml-1 sm:size-9" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold sm:text-xl">Watch the guide</span>
            <span className="text-xs tabular-nums text-white/85 sm:text-sm">{scenes.length} chapters · about {Math.max(1, Math.round(totalSeconds / 60))} min · narrated</span>
          </button>
        )}

        {ended && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#13293b]/75 px-4 text-white">
            <p className="text-lg font-semibold">Guide video complete</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={play} className={'btn border border-white/60 text-white hover:bg-white/10'}>
                <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
                Watch again
              </button>
              <a href="#guide-notes" className={'btn-primary'}>
                Read the guide
                <ArrowDown size={16} strokeWidth={1.5} aria-hidden="true" />
              </a>
            </div>
          </div>
        )}
      </div>

      {captionsOn && started && (
        <p className="flex min-h-[3.75rem] items-center justify-center px-2 pt-2 text-center text-sm leading-snug text-white sm:hidden" aria-live="off">
          {caption}
        </p>
      )}

      {/* Chapters: one segment per scene, filled as it plays. */}
      <div className="mt-1 flex items-center gap-1 px-1 sm:mt-2" role="group" aria-label="Chapters">
        {scenes.map((sc, i) => (
          <button
            key={i}
            type="button"
            onClick={() => jump(i)}
            title={`${i + 1}. ${sc.title}`}
            aria-label={`Chapter ${i + 1}: ${sc.title}`}
            aria-current={i === frame.scene ? 'step' : undefined}
            className="group flex h-11 flex-1 items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[#e9b9a6] sm:h-6"
          >
            <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-white/20 transition-colors group-hover:bg-white/35">
              <span
                className="absolute inset-y-0 left-0 bg-[#e9b9a6]"
                style={{ width: i < frame.scene ? '100%' : i === frame.scene ? `${frame.t * 100}%` : '0%' }}
              />
            </span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-0.5 text-white sm:gap-1 sm:px-1">
        <button
          type="button"
          onClick={playing ? pause : play}
          className="mr-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-[#8d3b24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e9b9a6] sm:size-10"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <Pause size={18} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          ) : (
            <Play size={18} fill="currentColor" strokeWidth={0} className="ml-0.5" aria-hidden="true" />
          )}
        </button>
        <button type="button" onClick={() => jump(frame.scene - 1)} disabled={frame.scene === 0} className={ICON_BUTTON} aria-label="Previous chapter" title="Previous chapter">
          <SkipBack size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => jump(frame.scene + 1)} disabled={frame.scene === scenes.length - 1} className={ICON_BUTTON} aria-label="Next chapter" title="Next chapter">
          <SkipForward size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <span className="ml-1 hidden text-sm tabular-nums text-white/70 sm:inline">{formatClock(elapsedSeconds)} / {formatClock(totalSeconds)}</span>

        <span className="flex-1" />

        <button
          type="button"
          onClick={toggleVoice}
          disabled={!recorded && !speechSupported}
          className={ICON_BUTTON}
          aria-pressed={voiceOn}
          aria-label={voiceOn ? 'Mute narration' : 'Turn narration on'}
          title={speechSupported ? (voiceOn ? 'Mute narration' : 'Turn narration on') : 'Narration is not supported in this browser — captions only'}
        >
          {voiceOn && (recorded || speechSupported) ? <Volume2 size={20} strokeWidth={1.75} aria-hidden="true" /> : <VolumeX size={20} strokeWidth={1.75} aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={() => setCaptionsOn((v) => !v)}
          className={ICON_BUTTON}
          aria-pressed={captionsOn}
          aria-label="Captions"
          title={captionsOn ? 'Hide captions' : 'Show captions'}
        >
          <span
            className={`rounded-[4px] border px-1 py-px text-[11px] leading-4 font-bold tracking-[0.04em] ${captionsOn ? 'border-white bg-white text-[#13293b]' : 'border-white/50 text-white/70'}`}
            aria-hidden="true"
          >
            CC
          </span>
        </button>
        <div className="relative">
          <button type="button" onClick={() => setSettingsOpen((v) => !v)} className={ICON_BUTTON} aria-expanded={settingsOpen} aria-label="Playback settings" title="Playback settings">
            <Settings size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
          {settingsOpen && (
            <div className="absolute right-0 bottom-12 z-10 w-64 rounded-2xl border border-line bg-white p-4 text-sm text-ink shadow-xl">
              <p className="text-xs font-semibold text-muted" id="guide-speed-label">Speed</p>
              <div className="mt-1.5 flex gap-1" role="group" aria-labelledby="guide-speed-label">
                {[0.85, 1, 1.15, 1.3].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => changeRate(r)}
                    aria-pressed={rate === r}
                    className={`h-9 flex-1 rounded-xl border px-1 text-xs font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e9b9a6] ${rate === r ? 'border-brand bg-brand text-white' : 'border-line text-ink hover:bg-brand-soft'}`}
                  >
                    {r}×
                  </button>
                ))}
              </div>
              {!recorded && voiceOptions.length > 1 && (
                <>
                  <label htmlFor="guide-voice" className="mt-4 block text-xs font-semibold text-muted">Narrator voice</label>
                  <select
                    id="guide-voice"
                    value={voiceName ?? ''}
                    onChange={(ev) => changeVoice(ev.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-line bg-white px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[#e9b9a6]"
                  >
                    {voiceOptions.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
                  </select>
                </>
              )}
              <p className="mt-4 text-xs leading-snug text-muted">{recorded ? 'Recorded narration.' : 'Narration uses your device\'s built-in voices, so it sounds different on each device.'}</p>
            </div>
          )}
        </div>
        <button type="button" onClick={fullscreen} className={ICON_BUTTON} aria-label="Full screen" title="Full screen">
          <Maximize size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1 text-sm text-white/70">
        <span className="tabular-nums sm:hidden">{formatClock(elapsedSeconds)} / {formatClock(totalSeconds)}</span>
        <span>
          Chapter {frame.scene + 1} of {scenes.length}: <span className="font-semibold text-white">{scenes[frame.scene]!.title}</span>
        </span>
        {voiceFailed && (
          <span className="inline-flex items-center gap-1.5 text-white/80">
            <TriangleAlert size={14} strokeWidth={1.5} className="shrink-0 text-warn" aria-hidden="true" />
            Your browser blocked the narration — showing captions instead.
          </span>
        )}
        {recordedFailed && <span className="text-white/80">Recorded narration unavailable, using this device&apos;s voice.</span>}
        {!recorded && !speechSupported && started && <span className="text-white/55">No narrator voice on this device — captions only.</span>}
      </div>

      <details className="group mt-2 rounded-xl bg-white/5 text-sm text-white/85">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 text-xs font-semibold tracking-[0.14em] text-white/70 uppercase select-none hover:text-white focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[#e9b9a6] [&::-webkit-details-marker]:hidden">
          <ChevronRight size={16} strokeWidth={1.5} className="shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
          Transcript
        </summary>
        <ol className="space-y-3 px-3 pb-3">
          {scenes.map((sc, i) => sc.narration && (
            <li key={i}>
              <button type="button" onClick={() => jump(i)} className="rounded-sm text-left font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e9b9a6]">
                {i + 1}. {sc.title}
              </button>
              <p className="mt-0.5 leading-relaxed text-white/70">{sc.narration}</p>
            </li>
          ))}
        </ol>
      </details>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Scene building blocks                                               */
/* ------------------------------------------------------------------ */

/** A 1600×900 drawing surface for diagram scenes. */
export function Stage({ children, background = '#1b3a52' }: { children: ReactNode; background?: string }) {
  return (
    <svg viewBox="0 0 1600 900" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width={1600} height={900} fill={background} />
      <g fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif">{children}</g>
    </svg>
  )
}

/** Map t from a sub-range [a, b] of the scene to 0 → 1, eased. */
export function phase(t: number, a: number, b: number): number {
  if (t <= a) return 0
  if (t >= b) return 1
  const x = (t - a) / (b - a)
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

/** Fade in over a sub-range of the scene. */
export function fade(t: number, a: number, b = a + 0.08): number {
  return phase(t, a, b)
}

/** Big on-screen heading used by most scenes. */
export function SceneTitle({ children, t = 1, y = 110 }: { children: ReactNode; t?: number; y?: number }) {
  return (
    <text x={800} y={y} textAnchor="middle" fontSize={58} fontWeight={800} fill="#fff" opacity={fade(t, 0, 0.1)}>
      {children}
    </text>
  )
}
