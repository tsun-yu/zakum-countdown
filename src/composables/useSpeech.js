const clips = {
  注意場地魔方: "/sounds/cube_auto_warn.mp3",
  注意機制魔方: "/sounds/cube_warn.mp3",
  小心黑水: "/sounds/water_warn.mp3",
  給我狀態: "/sounds/buff_warn_wayne.m4a",
};

// ── Platform detection ─────────────────────────────────────
// iOS / iPadOS / Safari → play pre-recorded mp3 files (more reliable on Apple)
// Everything else (Android, desktop Chrome/Firefox/Edge, etc.) → use Web Speech API
const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
const isIOS =
  /iPad|iPhone|iPod/.test(ua) ||
  // iPadOS 13+ reports as Mac; detect via touch support
  (typeof navigator !== "undefined" &&
    /Macintosh/.test(ua) &&
    typeof document !== "undefined" &&
    "ontouchend" in document);
const isSafari =
  typeof navigator !== "undefined" &&
  /^((?!chrome|crios|fxios|edg|android).)*safari/i.test(ua);

const useAudioFiles = isIOS || isSafari;
const forceAudioKeys = new Set(["給我狀態"]);
const hasSpeechSynthesis =
  typeof window !== "undefined" && "speechSynthesis" in window;

const voiceState = {
  selected: null,
  initialized: false,
};

const audioPool = Object.fromEntries(
  Object.entries(clips).map(([key, src]) => {
    const a = new Audio(src);
    a.preload = "auto";
    return [key, a];
  }),
);

let unlocked = false;

function pickPreferredVoice() {
  if (!hasSpeechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices?.length) return null;

  const femaleHint =
    /female|woman|女|mei|ting|han|hui|xiao|samantha|karen|zira|yating/i;
  const maleHint = /male|man|男|bo|george|david|mark/i;

  const scored = voices
    .filter((v) => /^zh(-|_)?/i.test(v.lang || ""))
    .map((v) => {
      let score = 0;
      const lang = (v.lang || "").toLowerCase();
      const name = v.name || "";
      if (lang.startsWith("zh-tw")) score += 100;
      else if (lang.includes("hant")) score += 80;
      else score += 40;
      if (femaleHint.test(name)) score += 30;
      if (maleHint.test(name)) score -= 20;
      return { v, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.v ?? null;
}

function ensureVoiceInitialized() {
  if (!hasSpeechSynthesis || voiceState.initialized) return;
  voiceState.initialized = true;

  const applyVoice = () => {
    voiceState.selected = pickPreferredVoice();
  };

  applyVoice();
  window.speechSynthesis.addEventListener("voiceschanged", applyVoice, {
    once: true,
  });
}

export function useSpeech() {
  ensureVoiceInitialized();

  function warmAudio(a) {
    a.volume = 0;
    a.play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
        a.volume = 1;
      })
      .catch(() => {});
  }

  // iOS / Safari require a user gesture before any Audio can play.
  // Some Android browsers also need a gesture before SpeechSynthesis works
  // reliably. Call this once on the first touchstart / pointerdown.
  function unlock() {
    if (unlocked) return;
    unlocked = true;

    if (useAudioFiles) {
      // Play every clip at volume 0 to satisfy iOS autoplay policy
      Object.values(audioPool).forEach((a) => {
        warmAudio(a);
      });
    } else if (hasSpeechSynthesis) {
      // Also warm up forced-audio clip on non-iOS/Safari.
      forceAudioKeys.forEach((key) => {
        const a = audioPool[key];
        if (a) warmAudio(a);
      });

      // Warm up the speech engine with a silent utterance so the first
      // real call doesn't get swallowed on some Android Chrome builds.
      try {
        const warmup = new SpeechSynthesisUtterance("");
        warmup.volume = 0;
        window.speechSynthesis.speak(warmup);
      } catch (_) {
        /* ignore */
      }
    }
  }

  function speak(key) {
    if (useAudioFiles || forceAudioKeys.has(key)) {
      const a = audioPool[key];
      if (!a) return;
      a.currentTime = 0;
      a.play().catch(() => {});
      return;
    }

    if (hasSpeechSynthesis) {
      try {
        // Cancel anything queued so warnings don't pile up
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(key);
        u.lang = "zh-TW";
        if (voiceState.selected) u.voice = voiceState.selected;
        u.rate = 1;
        // Slightly higher pitch keeps the fallback voice closer to female style.
        u.pitch = 1.15;
        u.volume = 1;
        window.speechSynthesis.speak(u);
      } catch (_) {
        /* ignore */
      }
    }
  }

  return { speak, unlock };
}
