<template>
  <div class="app-wrapper">
    <div class="app-layout">
      <ModeTabBar />
      <MainTimer />
      <CountdownBlock block-type="cube" />
      <CountdownBlock block-type="water" />
      <ResetBar @reset="showResetDialog = true" />
    </div>

    <ConfirmDialog
      :visible="showResetDialog"
      @confirm="handleReset"
      @cancel="showResetDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useTimerStore } from './stores/timer'
import ModeTabBar from './components/ModeTabBar.vue'
import MainTimer from './components/MainTimer.vue'
import CountdownBlock from './components/CountdownBlock.vue'
import ResetBar from './components/ResetBar.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

const store = useTimerStore()
const showResetDialog = ref(false)

function handleReset() {
  showResetDialog.value = false
  store.resetAll()
}

function beforeUnloadHandler(e) {
  if (store.anyRunning) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => window.addEventListener('beforeunload', beforeUnloadHandler))
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnloadHandler))
</script>

<style lang="scss">
@use './styles/global.scss';
@use './styles/variables' as *;

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
  flex-direction: column;
  gap: 12px;
  flex: 1;

  // Stretch cube/water blocks to fill available space
  > :nth-child(3),
  > :nth-child(4) {
    flex: 1;
  }
}

// ── Landscape layout ─────────────────────────────────────
@media (orientation: landscape) and (max-height: 500px) {
  .app-wrapper {
    max-width: 100%;
    padding: 8px 12px;
    gap: 8px;
  }

  .app-layout {
    display: grid;
    grid-template-areas:
      "tabs  tabs  tabs"
      "main  cube  water"
      "reset reset reset";
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto 1fr auto;
    gap: 8px;
    flex: 1;

    > :nth-child(1) { grid-area: tabs; }
    > :nth-child(2) { grid-area: main; }
    > :nth-child(3) { grid-area: cube; flex: unset; }
    > :nth-child(4) { grid-area: water; flex: unset; }
    > :nth-child(5) { grid-area: reset; }
  }
}
</style>
