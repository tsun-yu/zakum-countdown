<template>
  <div
    class="countdown-block"
    :class="{
      disabled: !store.mainHasStarted,
      running: timer.isRunning,
      done: timer.isDone,
      warning: isWarning,
    }"
    @click="handleClick"
  >
    <!-- Overlay (initial / done-waiting state) -->
    <div v-if="showOverlay" class="overlay" @click.stop="handleClick">
      <span class="overlay-text">{{ overlayText }}</span>
    </div>

    <!-- Active content -->
    <template v-else>
      <div class="top-row">
        <span class="countdown-time">{{ displayTime }}</span>
        <span v-if="estimatedLabel" class="estimated">預估 {{ estimatedLabel }}</span>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPct + '%' }" :class="{ warn: isWarning }"></div>
      </div>

      <div v-if="isWarning" class="warn-text">{{ warnText }}</div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTimerStore } from '../stores/timer'

const props = defineProps({
  blockType: {
    type: String, // 'cube' | 'water'
    required: true,
  },
})

const store = useTimerStore()

const timer = computed(() => props.blockType === 'cube' ? store.cubeTimer : store.waterTimer)

const duration = computed(() => {
  if (props.blockType === 'cube') return store.cubeDuration
  return store.WATER_DURATION
})

// ── Overlay ─────────────────────────────────────────────
const overlayText = computed(() => {
  if (props.blockType === 'cube') {
    return store.currentMode === 'body' ? '召喚炎魔' : '出現黑水'
  }
  return '出現雙魔方'
})

const showOverlay = computed(() =>
  !timer.value.hasStarted || timer.value.isDone
)

// ── Time display ─────────────────────────────────────────
const displayTime = computed(() => {
  const s = timer.value.current
  if (props.blockType === 'cube' && store.currentMode === 'body') {
    return store.formatTime(s)
  }
  return String(s).padStart(2, '0')
})

// ── Estimated time ───────────────────────────────────────
const estimatedLabel = computed(() => {
  const est = timer.value.estimatedTime
  if (est === null) return null
  return store.formatTime(est)
})

// ── Progress ─────────────────────────────────────────────
const progressPct = computed(() => {
  const d = duration.value
  if (!d) return 0
  return (timer.value.current / d) * 100
})

// ── Warning ──────────────────────────────────────────────
const isWarning = computed(() => {
  if (!timer.value.isRunning) return false
  return timer.value.current <= 5
})

const warnText = computed(() =>
  props.blockType === 'cube' ? '注意魔方' : '注意黑水'
)

// ── Click handler ─────────────────────────────────────────
function handleClick() {
  if (!store.mainHasStarted) return

  if (timer.value.isDone) {
    if (props.blockType === 'cube') store.earlyResetCube()
    else store.earlyResetWater()
    return
  }

  if (!timer.value.hasStarted) {
    if (props.blockType === 'cube') store.startCube()
    else store.startWater()
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '../styles/variables' as *;

.countdown-block {
  position: relative;
  width: 100%;
  min-height: 100px;
  border-radius: $radius-lg;
  background: $bg-card;
  border: 1px solid $border-color;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  transition: border-color 0.3s;
  overflow: hidden;
  cursor: pointer;

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.running {
    border-color: $accent-primary;
  }

  &.warning {
    border-color: $accent-warn;
    animation: pulse-border 0.8s ease-in-out infinite;
  }

  &.done {
    cursor: pointer;
  }
}

@keyframes pulse-border {
  0%, 100% { border-color: $accent-warn; box-shadow: 0 0 0 0 rgba(255, 107, 53, 0); }
  50% { border-color: color.adjust(#ff6b35, $lightness: 15%); box-shadow: 0 0 0 6px rgba(255, 107, 53, 0.15); }
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
    color: $accent-gold;
    letter-spacing: 3px;
  }
}

.top-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
  width: 100%;
  justify-content: center;
}

.countdown-time {
  font-size: 40px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  color: $text-primary;
}

.estimated {
  font-size: 14px;
  color: $text-secondary;
  white-space: nowrap;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: $progress-bg;
  border-radius: 4px;
  overflow: hidden;

  .progress-fill {
    height: 100%;
    background: $progress-fill;
    border-radius: 4px;
    transition: width 0.9s linear, background 0.3s;

    &.warn {
      background: $progress-warn;
    }
  }
}

.warn-text {
  font-size: 18px;
  font-weight: 700;
  color: $accent-warn;
  letter-spacing: 2px;
  animation: flash 0.6s ease-in-out infinite;
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
