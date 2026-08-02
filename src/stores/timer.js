import { defineStore } from "pinia";
import { ref, reactive, computed } from "vue";

const CUBE_AUTO_DURATION = 150; // 2m30s
const CUBE_HAND_DURATION = 37;
const WATER_DURATION = 37;

function makeSubTimer() {
  return reactive({
    current: 0,
    isRunning: false,
    hasStarted: false,
    isDone: false,
  });
}

export const useTimerStore = defineStore("timer", () => {
  const currentMode = ref("hand");

  // Sub timers
  const cubeAutoTimer = reactive({
    current: 0,
    isRunning: false,
    hasStarted: false,
    isWarning: false,
  });
  const cubeTimer = makeSubTimer();
  const waterTimer = makeSubTimer();

  // Interval/timeout IDs (not reactive — never displayed)
  let cubeAutoIntervalId = null;
  let cubeAutoWarnTimeoutId = null;
  let cubeIntervalId = null;
  let cubeResetTimeoutId = null;
  let waterIntervalId = null;
  let waterResetTimeoutId = null;

  // ─── Computed ────────────────────────────────────────────
  const anyRunning = computed(
    () =>
      cubeAutoTimer.isRunning || cubeTimer.isRunning || waterTimer.isRunning,
  );

  const cubeDuration = computed(() => CUBE_HAND_DURATION);

  // ─── Helpers ─────────────────────────────────────────────
  function formatTime(seconds) {
    if (seconds == null || seconds < 0) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function clearCubeAuto() {
    if (cubeAutoIntervalId) {
      clearInterval(cubeAutoIntervalId);
      cubeAutoIntervalId = null;
    }
    if (cubeAutoWarnTimeoutId) {
      clearTimeout(cubeAutoWarnTimeoutId);
      cubeAutoWarnTimeoutId = null;
    }
  }

  function resetCubeAutoState() {
    clearCubeAuto();
    cubeAutoTimer.current = 0;
    cubeAutoTimer.isRunning = false;
    cubeAutoTimer.hasStarted = false;
    cubeAutoTimer.isWarning = false;
  }

  function clearCube() {
    if (cubeIntervalId) {
      clearInterval(cubeIntervalId);
      cubeIntervalId = null;
    }
    if (cubeResetTimeoutId) {
      clearTimeout(cubeResetTimeoutId);
      cubeResetTimeoutId = null;
    }
  }

  function clearWater() {
    if (waterIntervalId) {
      clearInterval(waterIntervalId);
      waterIntervalId = null;
    }
    if (waterResetTimeoutId) {
      clearTimeout(waterResetTimeoutId);
      waterResetTimeoutId = null;
    }
  }

  function resetCubeState() {
    clearCube();
    cubeTimer.current = 0;
    cubeTimer.isRunning = false;
    cubeTimer.hasStarted = false;
    cubeTimer.isDone = false;
  }

  function resetWaterState() {
    clearWater();
    waterTimer.current = 0;
    waterTimer.isRunning = false;
    waterTimer.hasStarted = false;
    waterTimer.isDone = false;
  }

  // ─── CubeAuto timer (2m30s loop) ─────────────────────────
  function _runCubeAutoInterval() {
    cubeAutoIntervalId = setInterval(() => {
      if (cubeAutoTimer.current > 0) {
        cubeAutoTimer.current--;
        if (cubeAutoTimer.current <= 10) cubeAutoTimer.isWarning = true;
      } else {
        // Restart immediately, reset warning
        cubeAutoTimer.current = CUBE_AUTO_DURATION;
        cubeAutoTimer.isWarning = false;
      }
    }, 1000);
  }

  function startCubeAuto() {
    clearCubeAuto();
    cubeAutoTimer.current = CUBE_AUTO_DURATION;
    cubeAutoTimer.isRunning = true;
    cubeAutoTimer.hasStarted = true;
    cubeAutoTimer.isWarning = false;
    _runCubeAutoInterval();
  }

  // ─── Cube timer ───────────────────────────────────────────
  function startCube() {
    clearCube();
    const duration = cubeDuration.value;
    cubeTimer.current = duration;
    cubeTimer.isRunning = true;
    cubeTimer.hasStarted = true;
    cubeTimer.isDone = false;

    cubeIntervalId = setInterval(() => {
      if (cubeTimer.current > 0) {
        cubeTimer.current--;
      } else {
        clearInterval(cubeIntervalId);
        cubeIntervalId = null;
        cubeTimer.isRunning = false;
        cubeTimer.isDone = true;
        cubeResetTimeoutId = setTimeout(() => resetCubeState(), 10000);
      }
    }, 1000);
  }

  function earlyResetCube() {
    resetCubeState();
  }

  // ─── Water timer ──────────────────────────────────────────
  function startWater() {
    clearWater();
    waterTimer.current = WATER_DURATION;
    waterTimer.isRunning = true;
    waterTimer.hasStarted = true;
    waterTimer.isDone = false;

    waterIntervalId = setInterval(() => {
      if (waterTimer.current > 0) {
        waterTimer.current--;
      } else {
        clearInterval(waterIntervalId);
        waterIntervalId = null;
        waterTimer.isRunning = false;
        waterTimer.isDone = true;
        waterResetTimeoutId = setTimeout(() => resetWaterState(), 10000);
      }
    }, 1000);
  }

  function earlyResetWater() {
    resetWaterState();
  }

  // ─── Tab switch ───────────────────────────────────────────
  function setMode(mode) {
    currentMode.value = mode;
    resetCubeState();
    resetWaterState();
  }

  // ─── Reset all ────────────────────────────────────────────
  function resetAll() {
    resetCubeAutoState();
    resetCubeState();
    resetWaterState();
    currentMode.value = "hand";
  }

  return {
    currentMode,
    cubeAutoTimer,
    cubeTimer,
    waterTimer,
    anyRunning,
    cubeDuration,
    formatTime,
    startCubeAuto,
    resetCubeAutoState,
    startCube,
    earlyResetCube,
    startWater,
    earlyResetWater,
    setMode,
    resetAll,
    CUBE_AUTO_DURATION,
    CUBE_HAND_DURATION,
    WATER_DURATION,
  };
});
