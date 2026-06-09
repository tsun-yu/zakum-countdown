<template>
  <div
    class="block-wrapper"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="onTouchEnd"
    @mousedown="onMouseDown"
  >
    <!-- Swipe-reveal reset panel -->
    <div
      class="reset-panel"
      :class="blockType"
      :style="{ width: resetPanelWidth }"
      @click="handleSwipeReset"
    >
      <span>重置</span>
    </div>

    <!-- Main card -->
    <div
      class="countdown-block"
      :class="[
        blockType,
        {
          disabled: !store.mainHasStarted,
          running: timer.isRunning && !isWarning,
          warning: isWarning,
        },
      ]"
      :style="{ transform: `translateX(-${slideOffset}px)` }"
      @click="handleClick"
    >
      <!-- Initial overlay -->
      <div v-if="showOverlay" class="overlay" :class="blockType">
        <span class="overlay-text">{{ overlayText }}</span>
      </div>

      <!-- Active content -->
      <template v-else>
        <div class="top-row">
          <span class="countdown-time">{{ displayTime }}</span>
        </div>

        <div class="estimated-row" v-if="estimatedLabel">
          <span class="estimated">預估 {{ estimatedLabel }}</span>
        </div>

        <div class="progress-bar" :class="blockType">
          <div
            class="progress-fill"
            :class="[blockType, { warn: isWarning }]"
            :style="{ width: (timer.isDone ? 0 : progressPct) + '%' }"
          ></div>
        </div>
      </template>
    </div>

    <!-- Warning overlay — covers entire slot including reset panel area -->
    <div
      v-if="isWarning"
      class="warn-overlay"
      :class="blockType"
      :style="{ transform: `translateX(-${slideOffset}px)` }"
      @click="handleClick"
    >
      <span class="warn-text" :class="blockType">{{ warnText }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useTimerStore } from "../stores/timer";

const props = defineProps({
  blockType: {
    type: String, // 'cube' | 'water'
    required: true,
  },
});

const store = useTimerStore();
const timer = computed(() =>
  props.blockType === "cube" ? store.cubeTimer : store.waterTimer,
);

const duration = computed(() =>
  props.blockType === "cube" ? store.cubeDuration : store.WATER_DURATION,
);

// ── Overlay ──────────────────────────────────────────────
const overlayText = computed(() => {
  if (props.blockType === "cube") {
    return store.currentMode === "body" ? "召喚炎魔" : "出現黑水";
  }
  return "出現雙魔方";
});

// Overlay only shows before start; done state shows warning content instead
const showOverlay = computed(() => !timer.value.hasStarted);

// ── Time display ─────────────────────────────────────────
const displayTime = computed(() => {
  const s = timer.value.current;
  if (props.blockType === "cube" && store.currentMode === "body") {
    return store.formatTime(s);
  }
  return String(s).padStart(2, "0");
});

// ── Estimated time ────────────────────────────────────────
const estimatedLabel = computed(() => {
  const est = timer.value.estimatedTime;
  if (est === null) return null;
  return store.formatTime(est);
});

// ── Progress ─────────────────────────────────────────────
const progressPct = computed(() => {
  const d = duration.value;
  if (!d) return 0;
  return (timer.value.current / d) * 100;
});

// ── Warning ──────────────────────────────────────────────
// Active warning: last 5s of countdown OR full 10s done period
const isWarning = computed(
  () =>
    (timer.value.isRunning && timer.value.current <= 5) || timer.value.isDone,
);
const warnText = computed(() =>
  props.blockType === "cube" ? "注意魔方" : "注意黑水",
);

// ── Click handler ─────────────────────────────────────────
function handleClick() {
  if (!store.mainHasStarted) return;
  if (isSliding.value) return;

  if (timer.value.isDone) {
    doReset();
    return;
  }

  if (!timer.value.hasStarted) {
    if (props.blockType === "cube") store.startCube();
    else store.startWater();
  }
}

function doReset() {
  if (props.blockType === "cube") store.earlyResetCube();
  else store.earlyResetWater();
  snapBack();
}

// ── Swipe logic ───────────────────────────────────────────
const REVEAL_WIDTH = 160; // px width of reset panel revealed
const TRIGGER_DIST = 40; // px needed to trigger reveal

const slideOffset = ref(0);
const isSliding = ref(false);
let touchStartX = 0;
let touchStartY = 0;
let isDragging = false;
let axisLocked = false; // true=horizontal, false=vertical/undecided

const resetPanelWidth = computed(() =>
  slideOffset.value > 0 ? slideOffset.value + "px" : "0px",
);

function onTouchStart(e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  isDragging = true;
  axisLocked = false;
}

function onMouseDown(e) {
  touchStartX = e.clientX;
  touchStartY = e.clientY;
  isDragging = true;
  axisLocked = false;

  const onMove = (me) => {
    if (!isDragging) return;
    const dx = touchStartX - me.clientX;
    const dy = touchStartY - me.clientY;
    if (!axisLocked) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      axisLocked = Math.abs(dx) > Math.abs(dy);
    }
    if (!axisLocked) return;
    const offset = Math.max(0, Math.min(REVEAL_WIDTH, dx));
    slideOffset.value = offset;
    isSliding.value = offset > 5;
  };

  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    finishSwipe();
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

function onTouchMove(e) {
  if (!isDragging) return;
  const dx = touchStartX - e.touches[0].clientX;
  const dy = touchStartY - e.touches[0].clientY;
  if (!axisLocked) {
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    axisLocked = Math.abs(dx) > Math.abs(dy);
  }
  if (!axisLocked) return;
  const offset = Math.max(0, Math.min(REVEAL_WIDTH, dx));
  slideOffset.value = offset;
  isSliding.value = offset > 5;
}

function onTouchEnd() {
  finishSwipe();
}

function finishSwipe() {
  isDragging = false;
  if (slideOffset.value >= TRIGGER_DIST) {
    slideOffset.value = REVEAL_WIDTH + 5;
  } else {
    snapBack();
  }
  setTimeout(() => {
    isSliding.value = false;
  }, 50);
}

function snapBack() {
  slideOffset.value = 0;
}

function handleSwipeReset() {
  doReset();
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
  overflow: hidden;
  border-radius: $radius-lg;
}

// ── Reset panel ───────────────────────────────────────────
.reset-panel {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  cursor: pointer;
  overflow: hidden;
  transition: width 0.15s ease;

  span {
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    letter-spacing: 1px;
  }

  &.cube {
    background: color.adjust($cube-border, $lightness: -10%);
  }
  &.water {
    background: color.adjust($water-border, $lightness: -10%);
  }
}

// ── Main card ─────────────────────────────────────────────
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
  transition:
    transform 0.15s ease,
    border-color 0.3s;
  will-change: transform;

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  // Cube — green theme
  &.cube.running {
    border-color: $cube-border;
  }
  &.cube.warning {
    border-color: $cube-border;
    background: rgba(39, 174, 96, 0.08);
  }

  // Water — purple theme
  &.water.running {
    border-color: $water-border;
  }
  &.water.warning {
    border-color: $water-border;
    background: rgba(142, 68, 173, 0.1);
  }
}

// ── Overlay ───────────────────────────────────────────────
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
  }

  &.cube .overlay-text {
    color: $cube-overlay-text;
  }
  &.water .overlay-text {
    color: $water-overlay-text;
  }
}

// ── Content ───────────────────────────────────────────────
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

// ── Progress bar ──────────────────────────────────────────
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
  &.water {
    background: $water-progress;
  }
  &.water.warn {
    background: $water-progress-warn;
  }
}

// ── Warning overlay — covers the entire slot ─────────────
.warn-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  pointer-events: auto;
  transition: transform 0.15s ease;

  &.cube  { background: rgba(39, 174, 96, 0.18); }
  &.water { background: rgba(142, 68, 173, 0.18); }
}

.warn-text {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 4px;
  animation: flash 0.6s ease-in-out infinite;

  &.cube  { color: $cube-warn-text; }
  &.water { color: $water-warn-text; }
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
}
</style>
