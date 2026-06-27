<template>
  <div class="buff-wrapper">
    <header class="page-header">
      <h1 class="page-title">計時器</h1>
      <button class="add-btn" @click="openAddDialog">＋ 新增計時器</button>
    </header>

    <div class="timer-list">
      <TimerCard
        v-for="t in timers"
        :key="t.id"
        :timer="t"
        @edit="openEditDialog(t)"
        @delete="confirmDelete(t)"
      />
    </div>

    <TimerFormDialog
      :visible="dialogVisible"
      :timer="editingTimer"
      @save="handleSave"
      @cancel="closeDialog"
    />

    <ConfirmDialog
      :visible="!!deletingTimer"
      :message="deleteMessage"
      @confirm="handleDelete"
      @cancel="deletingTimer = null"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useSpeech } from "../composables/useSpeech";
import TimerCard from "../components/TimerCard.vue";
import TimerFormDialog from "../components/TimerFormDialog.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";

const STORAGE_KEY = "buff-view-timers-v1";

// Built-in Buff timer — preserves the original audio + UI text.
const BUILTIN_BUFF = Object.freeze({
  id: "buff-default",
  name: "Buff",
  durationSec: 180,
  speechText: "給我狀態", // maps to /sounds/buff_warn_wayne.m4a
  displayText: "施放Buff",
  startText: "開始施放Buff",
  isBuiltin: true,
});

const { unlock } = useSpeech();

// State ─────────────────────────────────────────────────────
const timers = ref([{ ...BUILTIN_BUFF }]);
const dialogVisible = ref(false);
const editingTimer = ref(null);
const deletingTimer = ref(null);
let storageReady = false;

const deleteMessage = computed(() =>
  deletingTimer.value ? `確定要刪除「${deletingTimer.value.name}」嗎？` : "",
);

// Dialog handlers ───────────────────────────────────────────
function openAddDialog() {
  editingTimer.value = null;
  dialogVisible.value = true;
}

function openEditDialog(t) {
  editingTimer.value = t;
  dialogVisible.value = true;
}

function closeDialog() {
  dialogVisible.value = false;
  editingTimer.value = null;
}

function handleSave(formData) {
  if (editingTimer.value) {
    const idx = timers.value.findIndex((x) => x.id === editingTimer.value.id);
    if (idx >= 0) {
      const t = timers.value[idx];
      if (t.isBuiltin) {
        // Only duration is mutable for the built-in entry.
        timers.value[idx] = { ...t, durationSec: formData.durationSec };
      } else {
        timers.value[idx] = {
          ...t,
          name: formData.name,
          durationSec: formData.durationSec,
          speechText: formData.speechText,
        };
      }
    }
  } else {
    timers.value.push({
      id: generateId(),
      name: formData.name,
      durationSec: formData.durationSec,
      speechText: formData.speechText,
      isBuiltin: false,
    });
  }
  closeDialog();
}

function confirmDelete(t) {
  if (t.isBuiltin) return;
  deletingTimer.value = t;
}

function handleDelete() {
  if (!deletingTimer.value || deletingTimer.value.isBuiltin) {
    deletingTimer.value = null;
    return;
  }
  timers.value = timers.value.filter((x) => x.id !== deletingTimer.value.id);
  deletingTimer.value = null;
}

// Helpers ───────────────────────────────────────────────────
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return "t-" + crypto.randomUUID();
  }
  return "t-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

// Persistence ───────────────────────────────────────────────
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return;

    const storedBuiltin = data.find((x) => x?.id === BUILTIN_BUFF.id);
    const custom = data
      .filter((x) => x && x.id !== BUILTIN_BUFF.id && !x.isBuiltin)
      .map((x) => ({
        id: String(x.id || generateId()),
        name: String(x.name || "計時器").slice(0, 40),
        durationSec: Math.max(1, Number(x.durationSec) || 1),
        speechText: String(x.speechText || "").slice(0, 100),
        isBuiltin: false,
      }));

    const builtinDuration =
      Math.max(1, Number(storedBuiltin?.durationSec) || 0) ||
      BUILTIN_BUFF.durationSec;

    timers.value = [
      { ...BUILTIN_BUFF, durationSec: builtinDuration },
      ...custom,
    ];
  } catch (_) {
    /* ignore corrupt data */
  }
}

watch(
  timers,
  (newVal) => {
    if (!storageReady) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
    } catch (_) {
      /* ignore */
    }
  },
  { deep: true },
);

onMounted(() => {
  loadFromStorage();
  storageReady = true;
  window.addEventListener("touchstart", unlock, { once: true, passive: true });
  window.addEventListener("pointerdown", unlock, { once: true });
});
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.buff-wrapper {
  width: 100%;
  max-width: 480px;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  gap: 14px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: $text-primary;
  letter-spacing: 3px;
  margin: 0;
}

.add-btn {
  padding: 10px 14px;
  border-radius: $radius-md;
  background: $accent-gold;
  color: $bg-dark;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.85;
  }
}

.timer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 16px;
}
</style>
