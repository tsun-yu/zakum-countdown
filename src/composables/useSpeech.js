export function useSpeech() {
  function speak(text) {
    if (!window.speechSynthesis) return
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'zh-TW'
    utt.rate = 1.05
    window.speechSynthesis.speak(utt)
  }
  return { speak }
}
