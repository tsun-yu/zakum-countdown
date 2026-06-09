<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-backdrop" @click.self="$emit('cancel')">
      <div class="dialog">
        <p class="dialog-msg">確定要重置所有計時器嗎？</p>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="$emit('cancel')">取消</button>
          <button class="btn-confirm" @click="$emit('confirm')">確定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({ visible: Boolean })
defineEmits(['confirm', 'cancel'])
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: 28px 24px 20px;
  width: min(320px, 88vw);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dialog-msg {
  font-size: 17px;
  font-weight: 600;
  color: $text-primary;
  text-align: center;
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  gap: 12px;

  button {
    flex: 1;
    padding: 12px;
    border-radius: $radius-md;
    font-size: 15px;
    font-weight: 700;
  }
}

.btn-cancel {
  background: $accent-secondary;
  color: $text-secondary;
}

.btn-confirm {
  background: $reset-btn;
  color: #fff;

  &:active {
    background: $reset-btn-hover;
  }
}
</style>
