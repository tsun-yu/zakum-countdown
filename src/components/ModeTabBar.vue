<template>
  <div class="mode-tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="tab-btn"
      :class="{ active: store.currentMode === tab.value }"
      @click="store.setMode(tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
import { useTimerStore } from '../stores/timer'

const store = useTimerStore()

const tabs = [
  { label: '本體', value: 'body' },
  { label: '手階段一', value: 'hand1' },
  { label: '手階段二', value: 'hand2' },
  { label: '手階段三', value: 'hand3' },
]
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.mode-tab-bar {
  display: flex;
  gap: 6px;
  width: 100%;
}

.tab-btn {
  flex: 1;
  padding: 10px 4px;
  border-radius: $radius-sm;
  font-size: 13px;
  font-weight: 600;
  background: $tab-inactive-bg;
  color: $text-secondary;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;

  &.active {
    background: $tab-active-bg;
    color: #fff;
  }

  &:active {
    opacity: 0.8;
  }
}
</style>
