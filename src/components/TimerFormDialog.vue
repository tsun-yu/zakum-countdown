<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-backdrop" @click.self="$emit('cancel')">
      <div class="dialog">
        <h2 class="dialog-title">
          {{ isEdit ? "編輯計時器" : "新增計時器" }}
        </h2>

        <div class="form-row">
          <label class="form-label">
            名稱
            <span v-if="isBuiltin" class="hint">（內建，無法修改）</span>
          </label>
          <input
            v-model="form.name"
            class="form-input"
            type="text"
            maxlength="20"
            :disabled="isBuiltin"
            placeholder="計時器名稱"
          />
        </div>

        <div class="form-row">
          <label class="form-label">倒數時間</label>
          <div class="duration-inputs">
            <input
              v-model.number="form.minutes"
              class="form-input num"
              type="number"
              min="0"
              max="99"
              inputmode="numeric"
            />
            <span class="sep">分</span>
            <input
              v-model.number="form.seconds"
              class="form-input num"
              type="number"
              min="0"
              max="59"
              inputmode="numeric"
            />
            <span class="sep">秒</span>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">
            語音文字
            <span v-if="isBuiltin" class="hint">（內建音檔，無法修改）</span>
          </label>
          <input
            v-model="form.speechText"
            class="form-input"
            type="text"
            maxlength="50"
            :disabled="isBuiltin"
            placeholder="計時警告時要播放的語音"
          />
        </div>

        <div class="dialog-actions">
          <button class="btn-cancel" @click="$emit('cancel')">取消</button>
          <button class="btn-confirm" @click="onSave">儲存</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  visible: Boolean,
  timer: { type: Object, default: null },
});

const emit = defineEmits(["save", "cancel"]);

const isEdit = computed(() => !!props.timer);
const isBuiltin = computed(() => !!props.timer?.isBuiltin);

const form = ref({
  name: "",
  minutes: 1,
  seconds: 0,
  speechText: "",
});

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return;
    if (props.timer) {
      form.value = {
        name: props.timer.name || "",
        minutes: Math.floor((props.timer.durationSec || 0) / 60),
        seconds: (props.timer.durationSec || 0) % 60,
        speechText: props.timer.speechText || "",
      };
    } else {
      form.value = { name: "", minutes: 1, seconds: 0, speechText: "" };
    }
  },
);

function onSave() {
  const min = Math.max(0, Math.min(99, Number(form.value.minutes) || 0));
  const sec = Math.max(0, Math.min(59, Number(form.value.seconds) || 0));
  const total = Math.max(1, min * 60 + sec);
  const name = (form.value.name || "").trim() || "計時器";
  const speechText = (form.value.speechText || "").trim();

  emit("save", {
    name,
    durationSec: total,
    speechText,
  });
}
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.dialog {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: 24px 22px 18px;
  width: min(360px, 100%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 90dvh;
  overflow-y: auto;
}

.dialog-title {
  font-size: 18px;
  font-weight: 700;
  color: $text-primary;
  text-align: center;
  letter-spacing: 2px;
  margin: 0;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  color: $text-secondary;
  font-weight: 600;

  .hint {
    margin-left: 4px;
    font-size: 11px;
    color: $text-muted;
    font-weight: 500;
  }
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: $radius-sm;
  border: 1px solid $border-color;
  background: $bg-dark;
  color: $text-primary;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: $accent-gold;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.num {
    width: 70px;
    text-align: center;
    font-weight: 700;
  }
}

.duration-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sep {
  font-size: 13px;
  font-weight: 600;
  color: $text-secondary;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  margin-top: 6px;

  button {
    flex: 1;
    padding: 12px;
    border-radius: $radius-md;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 1px;
  }
}

.btn-cancel {
  background: $accent-secondary;
  color: $text-secondary;
}

.btn-confirm {
  background: $accent-gold;
  color: $bg-dark;

  &:active {
    opacity: 0.85;
  }
}
</style>
