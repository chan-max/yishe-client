<script setup lang="ts">
import { ref, onMounted } from 'vue'

const appVersion = ref('')

onMounted(async () => {
  try {
    appVersion.value = await window.api.getAppVersion()
  } catch (error) {
    console.error('获取版本信息失败:', error)
  }
})
</script>

<template>
  <div>
    <v-card border="sm" class="about-card mx-auto" max-width="480">
      <v-card-text class="d-flex flex-column align-center py-8 ga-2">
        <v-avatar size="72" rounded="sm">
          <v-img src="/src/renderer/src/assets/icon.png" cover alt="logo" />
        </v-avatar>
        <div class="about-title">衣设客户端</div>
        <div class="about-version">版本 v{{ appVersion || "--" }}</div>
        <div class="about-desc">最具创意的设计工具</div>
        <v-btn
          variant="text"
          color="primary"
          href="https://github.com/chan-max"
          target="_blank"
          rel="noopener noreferrer"
          prepend-icon="mdi-github"
        >
          Jackie Chan
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.about-card {
  margin: 0 auto;
}

.about-title {
  font-size: 24px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

.about-version {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}

.about-desc {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 8px;
}
</style>

