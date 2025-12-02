<script setup lang="ts">
// Tasks 页面
</script>

<template>
  <div>
    <el-card class="panel-card" shadow="never">
      <template #header>
        <div class="panel-header">
          <span class="panel-title">任务管理</span>
        </div>
      </template>
      <div class="panel-body text-center text-medium-emphasis">
        功能开发中，敬请期待…
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.panel-card :deep(.el-card__header) {
  padding: 12px 16px;
}

.panel-card :deep(.el-card__body) {
  padding: 32px 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 16px;
  font-weight: 500;
}

.text-center {
  text-align: center;
}

.text-medium-emphasis {
  color: #6b7280;
}
</style>

