<template>
  <div v-if="notifications.length" class="notification-container">
    <div v-for="(notification, index) in notifications" :key="index" class="notification">
      <img :src="notificationIcon" class="notification-icon" />
      {{ notification.message }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { notification} from '../notification';
import notificationIcon from '@/assets/notification-icon.png';

export default defineComponent({
  setup() {
    const notifications = computed(() => notification.state);

    return { notifications, notificationIcon };
  }
});
</script>

<style>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}
.notification {
  max-width: 400px;
  min-height: 80px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  box-sizing: border-box;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  border-radius: 10px;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
}

.notification-icon {
  height: 30px;
  margin-right: 20px;
}
</style>