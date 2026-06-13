<template>
  <div class="buff-wrapper">
    <div class="buff-layout">
      <h1 class="title">Buff 計時器</h1>

      <div class="duration-config">
        <span class="cfg-label">倒數時間</span>
        <div class="cfg-controls">
          <input
            v-model.number="inputMinutes"
            class="time-input"
            type="number"
            min="0"
            max="99"
          />
          <span class="sep">分</span>
          <input
            v-model.number="inputSeconds"
            class="time-input"
            type="number"
            min="0"
            max="59"
          />
          <span class="sep">秒</span>
          <button class="apply-btn" @click="applyDuration(false)">套用</button>
        </div>
      </div>

      <div class="buff-slot">
        <div class="block-wrapper">
          <!-- Main card -->
          <div
            class="countdown-block buff"
            :class="{
              running: isRunning && !isWarning,
              warning: isWarning,
            }"
            @click="handleClick"
          >
            <!-- Initial overlay -->
            <div v-if="showOverlay" class="overlay buff">
              <span class="overlay-text">開始施放Buff</span>
            </div>

            <!-- Active content -->
            <template v-else>
              <div class="top-row">
                <span class="countdown-time">{{ displayTime }}</span>
              </div>

              <div class="progress-bar">
                <div
                  class="progress-fill buff"
                  :class="{ warn: isWarning }"
                  :style="{ width: progressPct + '%' }"
                ></div>
              </div>
            </template>
          </div>

          <!-- Warning overlay -->
          <div v-if="isWarning" class="warn-overlay buff" @click="handleClick">
            <span class="warn-text buff">施放Buff</span>
          </div>
        </div>
      </div>

      <div class="action-row">
        <button class="restart-btn" @click="manualRestart">重新倒數</button>
        <button class="reset-btn" :disabled="!hasStarted" @click="doReset">
          停止
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useSpeech } from "../composables/useSpeech";

// ── Config ────────────────────────────────────────────────
const DEFAULT_DURATION = 180; // 3 minutes
const WARN_AT = 5; // last N seconds show warning

// ── State ─────────────────────────────────────────────────
const durationSec = ref(DEFAULT_DURATION);
const inputMinutes = ref(Math.floor(DEFAULT_DURATION / 60));
const inputSeconds = ref(DEFAULT_DURATION % 60);
const current = ref(0);
const hasStarted = ref(false);
const isRunning = ref(false);

let intervalId = null;

const { speak, unlock } = useSpeech();

// ── Derived ───────────────────────────────────────────────
const showOverlay = computed(() => !hasStarted.value);
const isWarning = computed(() => isRunning.value && current.value <= WARN_AT);
const progressPct = computed(() => {
  if (!durationSec.value) return 0;
  return (current.value / durationSec.value) * 100;
});
const displayTime = computed(() => {
  const m = Math.floor(current.value / 60);
  const s = current.value % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

// ── Voice trigger ─────────────────────────────────────────
watch(isWarning, (val) => {
  if (val) speak("給我狀態");
});

// ── Actions ───────────────────────────────────────────────
function clearTimers() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function resetState() {
  clearTimers();
  current.value = 0;
  hasStarted.value = false;
  isRunning.value = false;
}

function normalizeDurationInput() {
  const min = Math.max(0, Math.min(99, Number(inputMinutes.value) || 0));
  const sec = Math.max(0, Math.min(59, Number(inputSeconds.value) || 0));
  const total = Math.max(1, min * 60 + sec);
  durationSec.value = total;
  inputMinutes.value = Math.floor(total / 60);
  inputSeconds.value = total % 60;
}

function restartCycle() {
  current.value = durationSec.value;
  hasStarted.value = true;
  isRunning.value = true;
}

function startLoopIfNeeded() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    if (current.value > 1) {
      current.value--;
    } else {
      // Auto loop like cube-auto: immediately restart next cycle
      restartCycle();
    }
  }, 1000);
}

function applyDuration(shouldRestart = false) {
  normalizeDurationInput();
  if (shouldRestart) {
    restartCycle();
    startLoopIfNeeded();
  }
}

function manualRestart() {
  applyDuration(true);
}

function doReset() {
  resetState();
}

function handleClick() {
  if (!hasStarted.value) manualRestart();
}

// ── Audio unlock (mirror HomeView) ────────────────────────
onMounted(() => {
  window.addEventListener("touchstart", unlock, { once: true, passive: true });
  window.addEventListener("pointerdown", unlock, { once: true });
});

onUnmounted(() => {
  clearTimers();
});
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "../styles/variables" as *;

// Buff theme — gold accent (re-uses cube layout)
$buff-border: $accent-gold;
$buff-progress: $accent-gold;
$buff-progress-warn: $accent-warn;
$buff-overlay-text: $accent-gold;
$buff-warn-text: $accent-warn;

.buff-wrapper {
  width: 100%;
  max-width: 480px;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  gap: 12px;
}

.buff-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: $text-primary;
  text-align: center;
  letter-spacing: 2px;
  margin: 4px 0;
}

.duration-config {
  width: 100%;
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cfg-label {
  font-size: 13px;
  color: $text-secondary;
  font-weight: 600;
}

.cfg-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input {
  width: 60px;
  padding: 8px 10px;
  border-radius: $radius-sm;
  border: 1px solid $border-color;
  background: $bg-dark;
  color: $text-primary;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
}

.sep {
  color: $text-secondary;
  font-size: 13px;
  font-weight: 600;
}

.apply-btn {
  margin-left: auto;
  padding: 9px 12px;
  border-radius: $radius-sm;
  background: $accent-secondary;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
}

.buff-slot {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  > * {
    flex: 1;
    min-height: 0;
  }
}

// ── Card (mirrors CountdownBlock) ─────────────────────────
.block-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: $radius-lg;
}

.countdown-block {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  border-radius: $radius-lg;
  background: $bg-card;
  border: 2px solid $border-color;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.3s;
  will-change: transform;

  &.buff.running {
    border-color: $buff-border;
  }
  &.buff.warning {
    border-color: $buff-border;
    background: rgba(240, 165, 0, 0.08);
  }
}

.overlay {
  position: absolute;
  inset: 0;
  background: $overlay-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;

  .overlay-text {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 3px;
  }

  &.buff .overlay-text {
    color: $buff-overlay-text;
  }
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.countdown-time {
  font-size: 56px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 3px;
  color: $text-primary;
  line-height: 1;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: $progress-bg;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 5px;
  transition:
    width 0.9s linear,
    background 0.3s;

  &.buff {
    background: $buff-progress;
  }
  &.buff.warn {
    background: $buff-progress-warn;
  }
}

.warn-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  pointer-events: auto;

  &.buff {
    background: rgba(240, 165, 0, 0.18);
  }
}

.warn-text {
  font-size: 44px;
  font-weight: 700;
  letter-spacing: 6px;
  animation: flash 0.6s ease-in-out infinite;

  &.buff {
    color: $buff-warn-text;
  }
}

@keyframes flash {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}

// ── Reset button ──────────────────────────────────────────
.action-row {
  width: 100%;
  display: flex;
  gap: 10px;
}

.restart-btn,
.reset-btn {
  flex: 1;
  padding: 16px;
  border-radius: $radius-md;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 2px;
  transition:
    background 0.2s,
    opacity 0.2s;
}

.restart-btn {
  background: $accent-secondary;

  &:active {
    background: color.adjust($accent-secondary, $lightness: 8%);
  }
}

.reset-btn {
  background: $reset-btn;

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &:not(:disabled):active {
    background: $reset-btn-hover;
  }
}
</style>
