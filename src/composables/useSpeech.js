let audioUnlocked = false

export function useSpeech() {
  // iOS requires speechSynthesis to be triggered once from a user gesture.
  // Call unlock() on the first touch/click to satisfy this requirement.
  function unlock() {
    if (audioUnlocked || !window.speechSynthesis) return
    audioUnlocked = true
    const silent = new SpeechSynthesisUtterance('')
    silent.volume = 0
    window.speechSynthesis.speak(silent)
  }

  function speak(text) {
    if (!window.speechSynthesis) return
    // Cancel any stuck utterance, then force-resume (iOS can silently pause synthesis)
    window.speechSynthesis.cancel()
    window.speechSynthesis.resume()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'zh-TW'
    utt.rate = 1.05
    window.speechSynthesis.speak(utt)
  }

  return { speak, unlock }
}
