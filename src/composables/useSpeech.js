const clips = {
  '注意場地魔方': '/sounds/cube_auto_warn.mp3',
  '注意機制魔方': '/sounds/cube_warn.mp3',
  '小心黑水':     '/sounds/water_warn.mp3',
}

// Pre-create Audio elements so they're ready to play instantly
const audioPool = Object.fromEntries(
  Object.entries(clips).map(([key, src]) => {
    const a = new Audio(src)
    a.preload = 'auto'
    return [key, a]
  })
)

let unlocked = false

export function useSpeech() {
  // iOS requires a user gesture before any Audio can play.
  // Call this once on the first touchstart / pointerdown.
  function unlock() {
    if (unlocked) return
    unlocked = true
    // Play every clip at volume 0 to satisfy iOS autoplay policy
    Object.values(audioPool).forEach(a => {
      a.volume = 0
      a.play().then(() => {
        a.pause()
        a.currentTime = 0
        a.volume = 1
      }).catch(() => {})
    })
  }

  function speak(key) {
    const a = audioPool[key]
    if (!a) return
    a.currentTime = 0
    a.play().catch(() => {})
  }

  return { speak, unlock }
}
