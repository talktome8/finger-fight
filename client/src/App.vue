<template>
  <div class="app-container">
    <router-view v-slot="{ Component, route }">
      <transition :name="route.meta.transition as string || 'fade'" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
// App root — no game logic here
</script>

<style scoped>
.app-container {
  height: 100%;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from {
  transform: translateX(100%);
}
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
