<script setup lang="ts">
// Dashboard 页面内容将从 App.vue 中提取
// 这里先创建一个基础结构
</script>

<template>
  <div>
    <el-card class="panel-card" shadow="never">
      <template #header>
        <div class="panel-header">
          <span class="panel-title">仪表盘</span>
        </div>
      </template>
      <div class="panel-body">
        <div class="text-center placeholder">
          Dashboard 内容待迁移...
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.panel-card :deep(.el-card__header) {
  padding: 12px 16px;
}

.panel-card :deep(.el-card__body) {
  padding: 16px;
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

.placeholder {
  padding: 40px 0;
  color: #6b7280;
  font-size: 13px;
}
</style>

