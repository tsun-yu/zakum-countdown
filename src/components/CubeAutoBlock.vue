<template>
  <div class="block-wrapper">
    <!-- Main card -->
    <div
      class="countdown-block cube"
      :class="{
        disabled: !store.mainHasStarted,
        running:
          store.cubeAutoTimer.isRunning && !store.cubeAutoTimer.isWarning,
        warning: store.cubeAutoTimer.isWarning,
      }"
      @click="handleClick"
    >
      <!-- Initial overlay -->
      <div v-if="!store.cubeAutoTimer.hasStarted" class="overlay cube">
        <span class="overlay-text">召喚炎魔</span>
      </div>

      <!-- Active content -->
      <template v-else>
        <div class="top-row">
          <span class="countdown-time">{{
            store.formatTime(store.cubeAutoTimer.current)
          }}</span>
        </div>

        <div class="estimated-row" v-if="estimatedLabel">
          <span class="estimated">預估 {{ estimatedLabel }}</span>
        </div>

        <div class="progress-bar">
          <div
            class="progress-fill cube"
            :class="{ warn: store.cubeAutoTimer.isWarning }"
            :style="{ width: progressPct + '%' }"
          ></div>
        </div>
      </template>
    </div>

    <!-- Warning overlay -->
    <div
      v-if="store.cubeAutoTimer.isWarning && store.cubeAutoTimer.hasStarted"
      class="warn-overlay cube"
      @click="handleClick"
    >
      <span class="warn-text cube">注意魔方</span>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from "vue";
import { useTimerStore } from "../stores/timer";
import { useSpeech } from "../composables/useSpeech";

const store = useTimerStore();
const { speak } = useSpeech();

watch(
  () => store.cubeAutoTimer.isWarning,
  (val) => {
    if (
      val &&
      (store.currentMode === "hand" || store.currentMode === "body1")
    ) {
      speak("注意場地魔方");
    }
  },
);

const progressPct = computed(() => {
  const d = store.CUBE_AUTO_DURATION;
  return (store.cubeAutoTimer.current / d) * 100;
});

const estimatedLabel = computed(() => {
  const est = store.cubeAutoTimer.estimatedTime;
  if (est === null) return null;
  return store.formatTime(est);
});

function handleClick() {
  if (!store.mainHasStarted) return;
  if (!store.cubeAutoTimer.hasStarted) {
    store.startCubeAuto();
  }
}
</script>

<style lang="scss" scoped>
@use "sass:color";
@use "../styles/variables" as *;

.block-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: $radius-lg;
  overflow: hidden;
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
  gap: 8px;
  padding: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.3s;

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.cube.running {
    border-color: $cube-border;
  }
  &.cube.warning {
    border-color: $cube-border;
    background: rgba(39, 174, 96, 0.08);
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
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 3px;
    color: $cube-overlay-text;
  }
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.countdown-time {
  font-size: 44px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  color: $text-primary;
  line-height: 1;
}

.estimated-row {
  width: 100%;
  display: flex;
  justify-content: center;
}

.estimated {
  font-size: 20px;
  font-weight: 600;
  color: $text-secondary;
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
  transition:
    width 0.9s linear,
    background 0.3s;

  &.cube {
    background: $cube-progress;
  }
  &.cube.warn {
    background: $cube-progress-warn;
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

  &.cube {
    background: rgba(39, 174, 96, 0.18);
  }
}

.warn-text {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 4px;
  animation: flash 0.6s ease-in-out infinite;

  &.cube {
    color: $cube-warn-text;
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
</style>
