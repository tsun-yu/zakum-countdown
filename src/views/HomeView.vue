<template>
  <div class="app-wrapper">
    <div class="app-layout">
      <div class="slot-tabs"><ModeTabBar /></div>
      <div class="slot-main"><MainTimer /></div>

      <!-- cube-auto: hand + body1（隱藏時仍保留 DOM，計時不中斷） -->
      <div v-show="showCubeAuto" class="slot-cube-auto">
        <CubeAutoBlock />
      </div>

      <!-- cube (40s click): body1/2/3 -->
      <div v-if="showCube" class="slot-cube">
        <CountdownBlock block-type="cube" />
      </div>

      <!-- water (40s click): body1/2/3 -->
      <div v-if="showWater" class="slot-water">
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useTimerStore } from "../stores/timer";
import { useSpeech } from "../composables/useSpeech";
import ModeTabBar from "../components/ModeTabBar.vue";
import MainTimer from "../components/MainTimer.vue";
import CubeAutoBlock from "../components/CubeAutoBlock.vue";
import CountdownBlock from "../components/CountdownBlock.vue";
import ResetBar from "../components/ResetBar.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";

const store = useTimerStore();
const { unlock } = useSpeech();
const showResetDialog = ref(false);

const showCubeAuto = computed(
  () => store.currentMode === "hand" || store.currentMode === "body1",
);
const showCube = computed(() => store.currentMode !== "hand");
const showWater = computed(() => store.currentMode !== "hand");

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

onMounted(() => {
  window.addEventListener("beforeunload", beforeUnloadHandler);
  window.addEventListener("touchstart", unlock, { once: true, passive: true });
  window.addEventListener("pointerdown", unlock, { once: true });
});
onUnmounted(() =>
  window.removeEventListener("beforeunload", beforeUnloadHandler),
);
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
  flex-direction: column;
  gap: 12px;
  flex: 1;

  .slot-cube-auto,
  .slot-cube,
  .slot-water {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    > * {
      flex: 1;
      min-height: 0;
    }

    &[style*="display: none"] {
      flex: 0;
      min-height: 0;
      padding: 0;
      margin: 0;
    }
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
    gap: 8px;
    flex: 1;

    // hand: cube-auto fills middle
    &:has(.slot-cube-auto):not(:has(.slot-cube)) {
      grid-template-areas:
        "tabs      tabs      tabs"
        "main      cube-auto cube-auto"
        "reset     reset     reset";
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: auto 1fr auto;
    }

    // body1: cube-auto + cube + water
    &:has(.slot-cube-auto):has(.slot-cube) {
      grid-template-areas:
        "tabs      tabs tabs  tabs"
        "main      cauto cube water"
        "reset     reset reset reset";
      grid-template-columns: 1fr 1fr 1fr 1fr;
      grid-template-rows: auto 1fr auto;
    }

    // body2/3: cube + water
    &:not(:has(.slot-cube-auto)):has(.slot-cube) {
      grid-template-areas:
        "tabs  tabs  tabs"
        "main  cube  water"
        "reset reset reset";
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: auto 1fr auto;
    }

    .slot-tabs {
      grid-area: tabs;
    }
    .slot-main {
      grid-area: main;
    }
    .slot-cube-auto {
      grid-area: cauto;
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
  }
}
</style>
