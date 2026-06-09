<template>
  <div class="reset-bar">
    <button class="reset-btn" @click="$emit('reset')">重置</button>
  </div>
</template>

<script setup>
defineEmits(['reset'])
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.reset-bar {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 4px 0 8px;
}

.reset-btn {
  width: 100%;
  padding: 18px;
  border-radius: $radius-md;
  background: $reset-btn;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  transition: background 0.2s;

  &:active {
    background: $reset-btn-hover;
  }
}
</style>
