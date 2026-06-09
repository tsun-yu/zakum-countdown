<template>
  <div class="app-wrapper">
    <div class="app-layout">
      <div class="slot-tabs"><ModeTabBar /></div>
      <div class="slot-main"><MainTimer /></div>
      <div class="slot-cube"><CountdownBlock block-type="cube" /></div>
      <div
        class="slot-water"
        :class="{ 'slot-water-hide': store.currentMode === 'body' }"
      >
        <CountdownBlock block-type="water" />
      </div>
      <div class="slot-reset"><ResetBar @reset="showResetDialog = true" /></div>
    </div>

    <ConfirmDialog
      :visible="showResetDialog"
      @confirm="handleReset"
      @cancel="showResetDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useTimerStore } from "./stores/timer";
import ModeTabBar from "./components/ModeTabBar.vue";
import MainTimer from "./components/MainTimer.vue";
import CountdownBlock from "./components/CountdownBlock.vue";
import ResetBar from "./components/ResetBar.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";

const store = useTimerStore();
const showResetDialog = ref(false);

function handleReset() {
  showResetDialog.value = false;
  store.resetAll();
}

function beforeUnloadHandler(e) {
  if (store.anyRunning) {
    e.preventDefault();
    e.returnValue = "";
  }
}

onMounted(() => window.addEventListener("beforeunload", beforeUnloadHandler));
onUnmounted(() =>
  window.removeEventListener("beforeunload", beforeUnloadHandler),
);
</script>

<style lang="scss">
@use "./styles/global.scss";
@use "./styles/variables" as *;

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

  .slot-cube,
  .slot-water {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    > * { flex: 1; min-height: 0; }
  }
  .slot-water-hide {
    display: none;
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

    .slot-tabs {
      grid-area: tabs;
    }
    .slot-main {
      grid-area: main;
    }
    .slot-cube {
      grid-area: cube;
    }
    .slot-water {
      grid-area: water;
    }
    .slot-reset {
      grid-area: reset;
    }

    // body mode: cube takes full middle row
    &:not(:has(.slot-water)) {
      grid-template-areas:
        "tabs  tabs  tabs"
        "main  cube  cube"
        "reset reset reset";
    }
  }
}
</style>
