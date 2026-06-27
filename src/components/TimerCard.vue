<template>
  <div class="timer-card">
    <!-- Header: name + meta + actions -->
    <header class="card-header">
      <div class="title-row">
        <h2 class="name">{{ timer.name }}</h2>
        <span v-if="timer.isBuiltin" class="badge">內建</span>
      </div>
      <div class="meta-row">
        <span class="duration">{{ formatDuration(timer.durationSec) }}</span>
        <button class="icon-btn" @click="$emit('edit')">編輯</button>
        <button
          v-if="!timer.isBuiltin"
          class="icon-btn danger"
          @click="$emit('delete')"
        >
          刪除
        </button>
      </div>
    </header>

    <!-- Countdown card -->
    <div class="block-wrapper">
      <div
        class="countdown-block"
        :class="{
          running: isRunning && !isWarning,
          warning: isWarning,
        }"
        @click="handleClick"
      >
        <div v-if="showOverlay" class="overlay">
          <span class="overlay-text">{{ startText }}</span>
        </div>

        <template v-else>
          <span class="countdown-time">{{ displayTime }}</span>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="{ warn: isWarning }"
              :style="{ width: progressPct + '%' }"
            ></div>
          </div>
        </template>
      </div>

      <div v-if="isWarning" class="warn-overlay" @click="handleClick">
        <span class="warn-text">{{ warnDisplay }}</span>
      </div>
    </div>

    <!-- Controls -->
    <div class="actions">
      <button class="action-btn restart" @click="restart">重新倒數</button>
      <button class="action-btn stop" :disabled="!hasStarted" @click="stop">
        停止
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useSpeech } from "../composables/useSpeech";

const props = defineProps({
  timer: { type: Object, required: true },
});

defineEmits(["edit", "delete"]);

const WARN_AT = 5;

const current = ref(0);
const hasStarted = ref(false);
const isRunning = ref(false);
let intervalId = null;

const { speak } = useSpeech();

// ── Derived ───────────────────────────────────────────────
const showOverlay = computed(() => !hasStarted.value);
const isWarning = computed(() => isRunning.value && current.value <= WARN_AT);
const progressPct = computed(() => {
  if (!props.timer.durationSec) return 0;
  return (current.value / props.timer.durationSec) * 100;
});
const displayTime = computed(() => {
  const m = Math.floor(current.value / 60);
  const s = current.value % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});
const startText = computed(
  () => props.timer.startText || `開始 ${props.timer.name}`,
);
const warnDisplay = computed(
  () => props.timer.displayText || props.timer.speechText || props.timer.name,
);

// ── Voice trigger ─────────────────────────────────────────
watch(isWarning, (val) => {
  if (val && props.timer.speechText) speak(props.timer.speechText);
});

// ── Reset if config changes externally (e.g. user edits duration) ──
watch(
  () => `${props.timer.durationSec}|${props.timer.speechText}`,
  () => stop(),
);

// ── Helpers ───────────────────────────────────────────────
function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}秒`;
  if (s === 0) return `${m}分`;
  return `${m}分${s}秒`;
}

function clearTimers() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function restartCycle() {
  current.value = props.timer.durationSec;
  hasStarted.value = true;
  isRunning.value = true;
}

function startLoop() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    if (current.value > 1) {
      current.value--;
    } else {
      // Auto-loop next cycle (cube-auto behavior)
      restartCycle();
    }
  }, 1000);
}

function restart() {
  clearTimers();
  restartCycle();
  startLoop();
}

function stop() {
  clearTimers();
  current.value = 0;
  hasStarted.value = false;
  isRunning.value = false;
}

function handleClick() {
  if (!hasStarted.value) restart();
}

onBeforeUnmount(() => {
  clearTimers();
});
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "../styles/variables" as *;

// Shared accent — gold like the original Buff timer
$accent-border: $accent-gold;
$accent-progress: $accent-gold;
$accent-progress-warn: $accent-warn;
$accent-overlay-text: $accent-gold;
$accent-warn-text: $accent-warn;

.timer-card {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.name {
  font-size: 16px;
  font-weight: 700;
  color: $text-primary;
  letter-spacing: 1px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 999px;
  color: $accent-gold;
  background: rgba(240, 165, 0, 0.15);
  letter-spacing: 1px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.duration {
  font-size: 12px;
  color: $text-secondary;
  flex: 1;
  font-weight: 600;
}

.icon-btn {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  border-radius: $radius-sm;
  background: $accent-secondary;
  color: $text-primary;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.7;
  }

  &.danger {
    background: $reset-btn;
    color: #fff;
  }
}

// ── Countdown block ─────────────────────────────────────
.block-wrapper {
  position: relative;
  border-radius: $radius-md;
  overflow: hidden;
}

.countdown-block {
  position: relative;
  background: $bg-dark;
  border: 2px solid $border-color;
  border-radius: $radius-md;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 120px;
  cursor: pointer;
  transition: border-color 0.3s;

  &.running {
    border-color: $accent-border;
  }
  &.warning {
    border-color: $accent-border;
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
  border-radius: $radius-md;

  .overlay-text {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 3px;
    color: $accent-overlay-text;
    text-align: center;
    padding: 0 8px;
  }
}

.countdown-time {
  font-size: 42px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  color: $text-primary;
  line-height: 1;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: $progress-bg;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  background: $accent-progress;
  transition:
    width 0.9s linear,
    background 0.3s;

  &.warn {
    background: $accent-progress-warn;
  }
}

.warn-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: rgba(240, 165, 0, 0.18);
  pointer-events: auto;
}

.warn-text {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 4px;
  color: $accent-warn-text;
  text-align: center;
  padding: 0 12px;
  animation: flash 0.6s ease-in-out infinite;
  word-break: break-word;
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

// ── Action buttons ─────────────────────────────────────
.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 10px;
  border-radius: $radius-sm;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  transition:
    background 0.2s,
    opacity 0.2s;

  &.restart {
    background: $accent-secondary;

    &:active {
      background: color.adjust($accent-secondary, $lightness: 8%);
    }
  }

  &.stop {
    background: $reset-btn;

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    &:not(:disabled):active {
      background: $reset-btn-hover;
    }
  }
}
</style>
