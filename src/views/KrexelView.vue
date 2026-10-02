<template>
  <div class="app-wrapper">
    <div class="app-layout">
      <div class="stage-row" aria-label="選擇階段">
        <button
          v-for="stage in stages"
          :key="stage.id"
          class="stage-button"
          :class="{ active: selectedStage === stage.id }"
          :aria-pressed="selectedStage === stage.id"
          @click="selectStage(stage.id)"
        >
          {{ stage.label }}
        </button>
      </div>

      <div
        v-for="timer in timerCards"
        :key="timer.id"
        class="timer-wrapper"
        @touchstart.passive="onTouchStart(timer.id, $event)"
        @touchmove.passive="onTouchMove(timer.id, $event)"
        @touchend="onTouchEnd(timer.id)"
        @touchcancel="onTouchEnd(timer.id)"
        @mousedown="onMouseDown(timer.id, $event)"
      >
        <div
          class="reset-panel"
          :style="{ width: resetPanelWidth(timer.id) }"
          @click.stop="resetTimer(timer.id)"
        >
          <span>重置</span>
        </div>

        <button
          class="countdown-card"
          :class="{ running: timer.hasStarted, warning: isWarning(timer) }"
          :style="{ transform: `translateX(-${slideOffsets[timer.id]}px)` }"
          @click="startCountdown(timer.id)"
        >
          <span v-if="!timer.hasStarted" class="card-label">{{
            timer.label
          }}</span>
          <template v-else>
            <span class="countdown-time">{{
              formattedTime(timer.remainingSeconds)
            }}</span>
            <span v-if="isWarning(timer)" class="warning-text">你後面有車</span>
          </template>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { useSpeech } from "../composables/useSpeech";

const stages = [
  { id: "first", label: "一階59%", honkDuration: 90, departedDuration: 85 },
  {
    id: "second100",
    label: "二階100%",
    honkDuration: 90,
    departedDuration: 85,
  },
  { id: "second", label: "二階59%", honkDuration: 30, departedDuration: 25 },
];

const selectedStage = ref("first");
const timerStates = reactive({
  honk: {
    label: "叭叭叭",
    durationKey: "honkDuration",
    remainingSeconds: null,
    hasStarted: false,
    warningPlayed: false,
  },
  departed: {
    label: "已發車",
    durationKey: "departedDuration",
    remainingSeconds: null,
    hasStarted: false,
    warningPlayed: false,
  },
});
const slideOffsets = reactive({ honk: 0, departed: 0 });
const slidingTimers = reactive({ honk: false, departed: false });
const { speak, unlock } = useSpeech();

const activeStage = computed(() =>
  stages.find((stage) => stage.id === selectedStage.value),
);
const timerCards = computed(() =>
  Object.entries(timerStates).map(([id, timer]) => ({ id, ...timer })),
);

const timerIds = { honk: undefined, departed: undefined };
const deadlines = { honk: 0, departed: 0 };
const REVEAL_WIDTH = 160;
const TRIGGER_DIST = 40;
const dragState = {
  timerId: null,
  startX: 0,
  startY: 0,
  isDragging: false,
  axisLocked: false,
};

function formattedTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function isWarning(timer) {
  return timer.hasStarted && timer.remainingSeconds <= 5;
}

function startCountdown(timerId) {
  const timer = timerStates[timerId];
  if (!timer || timer.hasStarted || slidingTimers[timerId]) return;

  const duration = activeStage.value?.[timer.durationKey];
  if (!duration) return;

  timer.hasStarted = true;
  timer.remainingSeconds = duration;
  deadlines[timerId] = Date.now() + duration * 1000;
  timerIds[timerId] = window.setInterval(() => updateCountdown(timerId), 100);
}

function updateCountdown(timerId) {
  const timer = timerStates[timerId];
  const millisecondsLeft = Math.max(0, deadlines[timerId] - Date.now());
  timer.remainingSeconds = Math.ceil(millisecondsLeft / 1000);

  if (
    timer.remainingSeconds <= 5 &&
    timer.remainingSeconds > 0 &&
    !timer.warningPlayed
  ) {
    timer.warningPlayed = true;
    speak("你後面有車");
  }

  if (millisecondsLeft === 0) {
    window.clearInterval(timerIds[timerId]);
    timerIds[timerId] = undefined;
    timer.remainingSeconds = null;
    timer.hasStarted = false;
    timer.warningPlayed = false;
  }
}

function resetTimer(timerId) {
  const timer = timerStates[timerId];
  if (!timer) return;

  window.clearInterval(timerIds[timerId]);
  timerIds[timerId] = undefined;
  timer.remainingSeconds = null;
  timer.hasStarted = false;
  timer.warningPlayed = false;
  snapBack(timerId);
}

function selectStage(stageId) {
  if (selectedStage.value === stageId) return;

  resetTimer("honk");
  resetTimer("departed");
  selectedStage.value = stageId;
}

function resetPanelWidth(timerId) {
  return slideOffsets[timerId] > 0 ? `${slideOffsets[timerId]}px` : "0px";
}

function onTouchStart(timerId, event) {
  beginSwipe(timerId, event.touches[0].clientX, event.touches[0].clientY);
}

function onTouchMove(timerId, event) {
  moveSwipe(timerId, event.touches[0].clientX, event.touches[0].clientY);
}

function onTouchEnd(timerId) {
  finishSwipe(timerId);
}

function onMouseDown(timerId, event) {
  beginSwipe(timerId, event.clientX, event.clientY);

  const onMove = (moveEvent) => {
    moveSwipe(timerId, moveEvent.clientX, moveEvent.clientY);
  };

  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    finishSwipe(timerId);
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

function beginSwipe(timerId, x, y) {
  dragState.timerId = timerId;
  dragState.startX = x;
  dragState.startY = y;
  dragState.isDragging = true;
  dragState.axisLocked = false;
}

function moveSwipe(timerId, x, y) {
  if (!dragState.isDragging || dragState.timerId !== timerId) return;

  const dx = dragState.startX - x;
  const dy = dragState.startY - y;
  if (!dragState.axisLocked) {
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    dragState.axisLocked = Math.abs(dx) > Math.abs(dy);
  }
  if (!dragState.axisLocked) return;

  slideOffsets[timerId] = Math.max(0, Math.min(REVEAL_WIDTH, dx));
  slidingTimers[timerId] = slideOffsets[timerId] > 5;
}

function finishSwipe(timerId) {
  if (!dragState.isDragging || dragState.timerId !== timerId) return;

  dragState.isDragging = false;
  if (slideOffsets[timerId] >= TRIGGER_DIST) {
    slideOffsets[timerId] = REVEAL_WIDTH + 5;
  } else {
    snapBack(timerId);
  }
  window.setTimeout(() => {
    slidingTimers[timerId] = false;
  }, 50);
}

function snapBack(timerId) {
  slideOffsets[timerId] = 0;
}

onMounted(() => {
  window.addEventListener("touchstart", unlock, { once: true, passive: true });
  window.addEventListener("pointerdown", unlock, { once: true });
});

onUnmounted(() => {
  window.clearInterval(timerIds.honk);
  window.clearInterval(timerIds.departed);
});
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.app-wrapper {
  width: 100%;
  max-width: 480px;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  gap: 12px;
}

.app-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
}

.stage-row {
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
  width: 100%;
}

.stage-button {
  flex: 1;
  padding: 10px 4px;
  border-radius: $radius-sm;
  background: $tab-inactive-bg;
  color: $text-secondary;
  font-size: 13px;
  font-weight: 600;
  transition:
    background 0.2s,
    color 0.2s;
  white-space: nowrap;

  &.active {
    background: $tab-active-bg;
    color: #fff;
  }

  &:active {
    opacity: 0.8;
  }
}

.timer-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: $radius-lg;
}

.reset-panel {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  background: $reset-btn;
  cursor: pointer;
  overflow: hidden;
  transition: width 0.15s ease;

  span {
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 1px;
    white-space: nowrap;
  }
}

.countdown-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  border: 2px solid $border-color;
  border-radius: $radius-lg;
  background: $bg-card;
  color: $text-primary;
  transition:
    border-color 0.3s,
    background 0.3s,
    transform 0.15s ease;
  will-change: transform;

  &.running {
    border-color: $accent-gold;
  }

  &.warning {
    border-color: $accent-warn;
    background: rgba(255, 107, 53, 0.1);
  }
}

.card-label {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 5px;
}

.countdown-time {
  font-size: clamp(42px, 12vw, 64px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  line-height: 1;
}

.warning-text {
  color: $accent-warn;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 2px;
  animation: flash 0.6s ease-in-out infinite;
}

@keyframes flash {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
