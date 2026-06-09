<template>
  <div class="main-timer">
    <button class="adj-btn" :disabled="!store.mainHasStarted" @click="store.adjustMain(-1)">−1s</button>

    <div class="time-display" @click="handleStart">
      <div v-if="!store.mainHasStarted" class="overlay">
        <span>開始</span>
      </div>
      <span class="time">{{ store.formatTime(store.mainCurrent) }}</span>
    </div>

    <button class="adj-btn" :disabled="!store.mainHasStarted" @click="store.adjustMain(1)">+1s</button>
  </div>
</template>

<script setup>
import { useTimerStore } from '../stores/timer'

const store = useTimerStore()

function handleStart() {
  if (!store.mainHasStarted) {
    store.startMain()
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '../styles/variables' as *;

.main-timer {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.adj-btn {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: $radius-md;
  background: $accent-secondary;
  color: $text-primary;
  font-size: 15px;
  font-weight: 700;
  transition: background 0.2s, opacity 0.2s;

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &:not(:disabled):active {
    background: color.adjust(#0f3460, $lightness: 10%);
  }
}

.time-display {
  position: relative;
  flex: 1;
  height: 64px;
  border-radius: $radius-md;
  background: $bg-card;
  border: 1px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .overlay {
    position: absolute;
    inset: 0;
    background: $overlay-bg;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: $radius-md;

    span {
      font-size: 20px;
      font-weight: 700;
      color: $accent-gold;
      letter-spacing: 2px;
    }
  }

  .time {
    font-size: 32px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 2px;
    color: $text-primary;
  }
}
</style>
