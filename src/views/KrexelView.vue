<template>
  <div class="app-wrapper">
    <div class="app-layout">
      <div class="stage-row" aria-label="選擇階段">
        <button
          v-for="stage in stages"
          :key="stage.id"
          class="stage-button"
          :class="{ active: selectedStage === stage.id }"
          :disabled="hasStarted"
          :aria-pressed="selectedStage === stage.id"
          @click="selectedStage = stage.id"
        >
          {{ stage.label }}
        </button>
      </div>

      <button
        class="countdown-card"
        :class="{ running, warning: isWarning, done: hasFinished }"
        :disabled="hasStarted"
        @click="startCountdown"
      >
        <span v-if="!hasStarted" class="card-label">叭叭叭</span>
        <template v-else>
          <span class="countdown-time">{{ formattedTime }}</span>
          <span v-if="isWarning" class="warning-text">你後面有車</span>
        </template>
      </button>

      <div class="slot-reset">
        <ResetBar @reset="showResetDialog = true" />
      </div>
    </div>

    <ConfirmDialog
      :visible="showResetDialog"
      @confirm="handleReset"
      @cancel="showResetDialog = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useSpeech } from "../composables/useSpeech";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import ResetBar from "../components/ResetBar.vue";

const stages = [
  { id: "first", label: "一階59%", duration: 85 },
  { id: "second", label: "二階59%", duration: 30 },
];

const selectedStage = ref("first");
const remainingSeconds = ref(null);
const hasStarted = ref(false);
const hasFinished = ref(false);
const showResetDialog = ref(false);
const { speak, unlock } = useSpeech();

let timerId;
let deadline = 0;
let warningPlayed = false;

const running = computed(() => hasStarted.value && !hasFinished.value);
const isWarning = computed(() => running.value && remainingSeconds.value <= 5);
const formattedTime = computed(() => {
  const seconds = remainingSeconds.value ?? 0;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
});

function startCountdown() {
  if (hasStarted.value) return;

  const stage = stages.find((item) => item.id === selectedStage.value);
  if (!stage) return;

  hasStarted.value = true;
  remainingSeconds.value = stage.duration;
  deadline = Date.now() + stage.duration * 1000;
  timerId = window.setInterval(updateCountdown, 100);
}

function updateCountdown() {
  const millisecondsLeft = Math.max(0, deadline - Date.now());
  remainingSeconds.value = Math.ceil(millisecondsLeft / 1000);

  if (remainingSeconds.value <= 5 && remainingSeconds.value > 0 && !warningPlayed) {
    warningPlayed = true;
    speak("你後面有車");
  }

  if (millisecondsLeft === 0) {
    hasFinished.value = true;
    window.clearInterval(timerId);
    timerId = undefined;
  }
}

function handleReset() {
  showResetDialog.value = false;
  window.clearInterval(timerId);
  timerId = undefined;
  remainingSeconds.value = null;
  hasStarted.value = false;
  hasFinished.value = false;
  warningPlayed = false;
}

onMounted(() => {
  window.addEventListener("touchstart", unlock, { once: true, passive: true });
  window.addEventListener("pointerdown", unlock, { once: true });
});

onUnmounted(() => {
  window.clearInterval(timerId);
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
  flex-direction: column;
  gap: 12px;
}

.stage-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stage-button {
  min-height: 64px;
  padding: 12px;
  border: 2px solid $border-color;
  border-radius: $radius-lg;
  background: $bg-card;
  color: $text-secondary;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  transition: border-color 0.2s, background 0.2s, color 0.2s;

  &.active {
    border-color: $accent-gold;
    background: $bg-card-hover;
    color: $text-primary;
  }

  &:disabled {
    cursor: default;
  }
}

.countdown-card {
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
  transition: border-color 0.3s, background 0.3s;

  &:not(:disabled) {
    cursor: pointer;
  }

  &.running {
    border-color: $accent-gold;
  }

  &.warning {
    border-color: $accent-warn;
    background: rgba(255, 107, 53, 0.1);
  }

  &.done {
    border-color: $accent-warn;
  }
}

.card-label {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 5px;
}

.countdown-time {
  font-size: clamp(48px, 16vw, 76px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  line-height: 1;
}

.warning-text {
  color: $accent-warn;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 2px;
  animation: flash 0.6s ease-in-out infinite;
}

.slot-reset {
  display: flex;
  flex-direction: column;
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
