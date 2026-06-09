import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'

const MAIN_INITIAL = 30 * 60 + 30 // 1830s
const CUBE_BODY_DURATION = 150     // 2m30s
const CUBE_HAND_DURATION = 40
const WATER_DURATION = 40

function makeSubTimer() {
  return reactive({
    current: 0,
    isRunning: false,
    hasStarted: false,
    isDone: false,
    estimatedTime: null,
  })
}

export const useTimerStore = defineStore('timer', () => {
  const currentMode = ref('body')

  // Main timer
  const mainCurrent = ref(MAIN_INITIAL)
  const mainIsRunning = ref(false)
  const mainHasStarted = ref(false)
  let mainIntervalId = null

  // Sub timers
  const cubeTimer = makeSubTimer()
  const waterTimer = makeSubTimer()

  // Interval/timeout IDs (not reactive — never displayed)
  let cubeIntervalId = null
  let cubeResetTimeoutId = null
  let waterIntervalId = null
  let waterResetTimeoutId = null

  // ─── Computed ────────────────────────────────────────────
  const anyRunning = computed(
    () => mainIsRunning.value || cubeTimer.isRunning || waterTimer.isRunning
  )

  const cubeDuration = computed(() =>
    currentMode.value === 'body' ? CUBE_BODY_DURATION : CUBE_HAND_DURATION
  )

  // ─── Helpers ─────────────────────────────────────────────
  function formatTime(seconds) {
    if (seconds == null || seconds < 0) return '--:--'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  function clearCube() {
    if (cubeIntervalId) { clearInterval(cubeIntervalId); cubeIntervalId = null }
    if (cubeResetTimeoutId) { clearTimeout(cubeResetTimeoutId); cubeResetTimeoutId = null }
  }

  function clearWater() {
    if (waterIntervalId) { clearInterval(waterIntervalId); waterIntervalId = null }
    if (waterResetTimeoutId) { clearTimeout(waterResetTimeoutId); waterResetTimeoutId = null }
  }

  function resetCubeState() {
    clearCube()
    cubeTimer.current = 0
    cubeTimer.isRunning = false
    cubeTimer.hasStarted = false
    cubeTimer.isDone = false
    cubeTimer.estimatedTime = null
  }

  function resetWaterState() {
    clearWater()
    waterTimer.current = 0
    waterTimer.isRunning = false
    waterTimer.hasStarted = false
    waterTimer.isDone = false
    waterTimer.estimatedTime = null
  }

  // ─── Main timer ───────────────────────────────────────────
  function startMain() {
    if (mainHasStarted.value) return
    mainHasStarted.value = true
    mainIsRunning.value = true
    mainIntervalId = setInterval(() => {
      if (mainCurrent.value > 0) {
        mainCurrent.value--
      } else {
        clearInterval(mainIntervalId)
        mainIntervalId = null
        mainIsRunning.value = false
      }
    }, 1000)
  }

  function adjustMain(delta) {
    mainCurrent.value = Math.max(0, mainCurrent.value + delta)
    if (cubeTimer.estimatedTime !== null) cubeTimer.estimatedTime += delta
    if (waterTimer.estimatedTime !== null) waterTimer.estimatedTime += delta
  }

  // ─── Cube timer ───────────────────────────────────────────
  function startCube() {
    if (!mainHasStarted.value) return
    clearCube()
    const duration = cubeDuration.value
    cubeTimer.estimatedTime = mainCurrent.value - duration
    cubeTimer.current = duration
    cubeTimer.isRunning = true
    cubeTimer.hasStarted = true
    cubeTimer.isDone = false

    cubeIntervalId = setInterval(() => {
      if (cubeTimer.current > 0) {
        cubeTimer.current--
      } else {
        clearInterval(cubeIntervalId)
        cubeIntervalId = null
        cubeTimer.isRunning = false
        cubeTimer.isDone = true
        cubeResetTimeoutId = setTimeout(() => resetCubeState(), 10000)
      }
    }, 1000)
  }

  function earlyResetCube() {
    resetCubeState()
  }

  // ─── Water timer ──────────────────────────────────────────
  function startWater() {
    if (!mainHasStarted.value) return
    clearWater()
    waterTimer.estimatedTime = mainCurrent.value - WATER_DURATION
    waterTimer.current = WATER_DURATION
    waterTimer.isRunning = true
    waterTimer.hasStarted = true
    waterTimer.isDone = false

    waterIntervalId = setInterval(() => {
      if (waterTimer.current > 0) {
        waterTimer.current--
      } else {
        clearInterval(waterIntervalId)
        waterIntervalId = null
        waterTimer.isRunning = false
        waterTimer.isDone = true
        waterResetTimeoutId = setTimeout(() => resetWaterState(), 10000)
      }
    }, 1000)
  }

  function earlyResetWater() {
    resetWaterState()
  }

  // ─── Tab switch ───────────────────────────────────────────
  function setMode(mode) {
    currentMode.value = mode
    resetCubeState()
    resetWaterState()
  }

  // ─── Reset all ────────────────────────────────────────────
  function resetAll() {
    if (mainIntervalId) { clearInterval(mainIntervalId); mainIntervalId = null }
    mainCurrent.value = MAIN_INITIAL
    mainIsRunning.value = false
    mainHasStarted.value = false
    resetCubeState()
    resetWaterState()
    currentMode.value = 'body'
  }

  return {
    currentMode,
    mainCurrent,
    mainIsRunning,
    mainHasStarted,
    cubeTimer,
    waterTimer,
    anyRunning,
    cubeDuration,
    formatTime,
    startMain,
    adjustMain,
    startCube,
    earlyResetCube,
    startWater,
    earlyResetWater,
    setMode,
    resetAll,
    CUBE_BODY_DURATION,
    CUBE_HAND_DURATION,
    WATER_DURATION,
  }
})
