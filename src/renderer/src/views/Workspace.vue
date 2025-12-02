<script setup lang="ts">
import { ref, onMounted } from 'vue'

const workspaceDirectory = ref('')
const selectingDirectory = ref(false)
const downloadUrl = ref('')
const downloading = ref(false)
const downloadHistory = ref<Array<{ url: string; result: any; timestamp: number }>>([])
const queryUrl = ref('')
const querying = ref(false)
const queryResult = ref<{ found: boolean; filePath?: string | null; fileSize?: number; message: string } | null>(null)

// 加载工作目录
const loadWorkspaceDirectory = async () => {
  try {
    const path = await window.api.getWorkspaceDirectory()
    workspaceDirectory.value = path || ''
  } catch (error) {
    console.error('加载工作目录失败:', error)
  }
}

// 选择工作目录
const selectWorkspaceDirectory = async () => {
  try {
    selectingDirectory.value = true
    const selectedPath = await window.api.selectWorkspaceDirectory()
    if (selectedPath) {
      workspaceDirectory.value = selectedPath
      showToast({
        color: 'success',
        icon: 'mdi-check-circle',
        message: '工作目录设置成功'
      })
    }
  } catch (error) {
    console.error('选择工作目录失败:', error)
    showToast({
      color: 'error',
      icon: 'mdi-alert-circle-outline',
      message: '选择工作目录失败，请稍后重试'
    })
  } finally {
    selectingDirectory.value = false
  }
}

// 清除工作目录
const clearWorkspaceDirectory = async () => {
  try {
    await window.api.setWorkspaceDirectory('')
    workspaceDirectory.value = ''
    showToast({
      color: 'success',
      icon: 'mdi-check-circle',
      message: '工作目录已清除'
    })
  } catch (error) {
    console.error('清除工作目录失败:', error)
    showToast({
      color: 'error',
      icon: 'mdi-alert-circle-outline',
      message: '清除工作目录失败，请稍后重试'
    })
  }
}

// 处理文件下载
const handleDownload = async () => {
  if (!downloadUrl.value.trim()) {
    showToast({
      color: 'warning',
      icon: 'mdi-alert-outline',
      message: '请输入下载链接'
    })
    return
  }

  if (!workspaceDirectory.value) {
    showToast({
      color: 'warning',
      icon: 'mdi-alert-outline',
      message: '请先设置工作目录'
    })
    return
  }

  try {
    downloading.value = true
    const result = await window.api.downloadFile(downloadUrl.value.trim())
    
    // 添加到下载历史
    downloadHistory.value.push({
      url: downloadUrl.value.trim(),
      result: result,
      timestamp: Date.now()
    })
    
    // 只保留最近 10 条记录
    if (downloadHistory.value.length > 10) {
      downloadHistory.value = downloadHistory.value.slice(-10)
    }

    if (result.success) {
      if (result.skipped) {
        showToast({
          color: 'info',
          icon: 'mdi-information',
          message: result.message || '文件已存在，跳过下载'
        })
      } else {
        showToast({
          color: 'success',
          icon: 'mdi-check-circle',
          message: result.message || '下载完成'
        })
        downloadUrl.value = ''
      }
    } else {
      showToast({
        color: 'error',
        icon: 'mdi-alert-circle-outline',
        message: result.message || '下载失败'
      })
    }
  } catch (error: any) {
    console.error('下载失败:', error)
    showToast({
      color: 'error',
      icon: 'mdi-alert-circle-outline',
      message: error.message || '下载失败，请稍后重试'
    })
    
    downloadHistory.value.push({
      url: downloadUrl.value.trim(),
      result: {
        success: false,
        message: error.message || '下载失败'
      },
      timestamp: Date.now()
    })
  } finally {
    downloading.value = false
  }
}

// 处理文件查询
const handleQuery = async () => {
  if (!queryUrl.value.trim()) {
    showToast({
      color: 'warning',
      icon: 'mdi-alert-outline',
      message: '请输入查询链接'
    })
    return
  }

  if (!workspaceDirectory.value) {
    showToast({
      color: 'warning',
      icon: 'mdi-alert-outline',
      message: '请先设置工作目录'
    })
    return
  }

  try {
    querying.value = true
    queryResult.value = null
    
    const result = await window.api.checkFileDownloaded(queryUrl.value.trim())
    queryResult.value = result

    if (result.found) {
      showToast({
        color: 'success',
        icon: 'mdi-check-circle',
        message: '文件已找到'
      })
    } else {
      showToast({
        color: 'info',
        icon: 'mdi-information',
        message: result.message || '文件未找到'
      })
    }
  } catch (error: any) {
    console.error('查询失败:', error)
    showToast({
      color: 'error',
      icon: 'mdi-alert-circle-outline',
      message: error.message || '查询失败，请稍后重试'
    })
    queryResult.value = {
      found: false,
      message: error.message || '查询失败',
      filePath: null
    }
  } finally {
    querying.value = false
  }
}

// 格式化下载结果
const formatDownloadResult = (result: any): string => {
  if (!result) return ''
  
  if (result.success) {
    if (result.skipped) {
      return `已跳过 - ${result.message || '文件已存在'}`
    } else {
      const size = result.fileSize ? formatFileSize(result.fileSize) : ''
      return `下载成功${size ? ` - ${size}` : ''}`
    }
  } else {
    return `失败 - ${result.message || '未知错误'}`
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 复制到剪贴板
const copyToClipboard = async (value?: string, label?: string) => {
  if (!value) {
    showToast({
      color: 'warning',
      icon: 'mdi-alert-outline',
      message: '没有可复制的内容'
    })
    return
  }
  try {
    await navigator.clipboard.writeText(value)
    showToast({
      color: 'success',
      icon: 'mdi-content-copy',
      message: label ? `${label} 已复制` : '复制成功'
    })
  } catch (error) {
    console.error('复制失败', error)
    showToast({
      color: 'error',
      icon: 'mdi-alert-circle-outline',
      message: '复制失败，请稍后重试'
    })
  }
}

// 使用全局 toast
import { useToast } from '../composables/useToast'
const { showToast } = useToast()

onMounted(() => {
  loadWorkspaceDirectory()
})
</script>

<template>
  <div class="workspace-page">
    <!-- 工作目录设置 -->
    <el-card class="mb-3 workspace-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="card-header-left">
            <el-icon class="mr-2">
              <folder-opened />
            </el-icon>
            <span>工作目录设置</span>
          </div>
        </div>
      </template>

      <div class="mb-3">
        <div class="text-caption text-medium-emphasis mb-2">
          当前工作目录用于存储应用生成的文件和临时数据。选择后会自动保存，下次启动时无需重新设置。
        </div>
        <el-input
          v-model="workspaceDirectory"
          class="mb-2"
          readonly
          placeholder="请选择工作目录"
        >
          <template #prepend>
            <el-icon>
              <folder />
            </el-icon>
          </template>
          <template #append>
            <el-button
              type="primary"
              link
              size="small"
              @click="selectWorkspaceDirectory"
              :loading="selectingDirectory"
            >
              选择文件夹
            </el-button>
          </template>
        </el-input>

        <div v-if="workspaceDirectory" class="status-row">
          <el-tag type="success" size="small">已设置</el-tag>
          <el-button
            type="danger"
            link
            size="small"
            @click="clearWorkspaceDirectory"
          >
            清除
          </el-button>
        </div>
        <div v-else class="status-row">
          <el-tag type="warning" size="small">未设置</el-tag>
        </div>
      </div>
    </el-card>

    <!-- 文件查询功能 -->
    <el-card class="mb-3 workspace-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="card-header-left">
            <el-icon class="mr-2">
              <search />
            </el-icon>
            <span>文件查询</span>
          </div>
        </div>
      </template>

      <div class="mb-3">
        <div class="text-caption text-medium-emphasis mb-2">
          输入文件下载链接，查询该文件是否已下载。如果已下载，将显示文件的绝对路径。
        </div>

        <el-input
          v-model="queryUrl"
          class="mb-2"
          :disabled="querying"
          placeholder="https://example.com/file.zip"
          @keyup.enter="handleQuery"
        >
          <template #prepend>
            <el-icon>
              <link />
            </el-icon>
          </template>
          <template #append>
            <el-button
              type="primary"
              size="small"
              @click="handleQuery"
              :loading="querying"
              :disabled="!queryUrl.trim() || !workspaceDirectory"
            >
              查询
            </el-button>
          </template>
        </el-input>

        <el-alert
          v-if="!workspaceDirectory"
          type="warning"
          show-icon
          class="mb-2"
          :closable="false"
        >
          请先设置工作目录才能使用查询功能
        </el-alert>

        <!-- 查询结果 -->
        <div v-if="queryResult" class="mt-2">
          <el-alert
            :type="queryResult.found ? 'success' : 'info'"
            show-icon
            :closable="false"
            class="mb-2"
          >
            {{ queryResult.message }}
          </el-alert>

          <el-card
            v-if="queryResult.found && queryResult.filePath"
            class="mt-2 inner-card"
            shadow="never"
          >
            <div class="text-caption mb-1 font-weight-medium">文件信息</div>
            <el-input
              :model-value="queryResult.filePath"
              readonly
              class="mb-1"
            >
              <template #prepend>
                <el-icon>
                  <document />
                </el-icon>
              </template>
              <template #append>
                <el-button
                  link
                  size="small"
                  @click="copyToClipboard(queryResult.filePath, '文件路径')"
                >
                  复制
                </el-button>
              </template>
            </el-input>
            <div v-if="queryResult.fileSize" class="text-caption text-medium-emphasis">
              文件大小: {{ formatFileSize(queryResult.fileSize) }}
            </div>
          </el-card>
        </div>
      </div>
    </el-card>

    <!-- 文件下载功能 -->
    <el-card class="mb-3 workspace-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="card-header-left">
            <el-icon class="mr-2">
              <download />
            </el-icon>
            <span>文件下载</span>
          </div>
        </div>
      </template>

      <div class="mb-3">
        <div class="text-caption text-medium-emphasis mb-2">
          输入文件下载链接，文件将保存到工作目录下的 <code>files</code> 目录。如果文件已存在，将自动跳过下载。
        </div>

        <el-input
          v-model="downloadUrl"
          class="mb-2"
          :disabled="downloading"
          placeholder="https://example.com/file.zip"
          @keyup.enter="handleDownload"
        >
          <template #prepend>
            <el-icon>
              <link />
            </el-icon>
          </template>
          <template #append>
            <el-button
              type="primary"
              size="small"
              @click="handleDownload"
              :loading="downloading"
              :disabled="!downloadUrl.trim() || !workspaceDirectory"
            >
              下载
            </el-button>
          </template>
        </el-input>

        <el-alert
          v-if="!workspaceDirectory"
          type="warning"
          show-icon
          class="mb-2"
          :closable="false"
        >
          请先设置工作目录才能使用下载功能
        </el-alert>
      </div>

      <!-- 下载历史 -->
      <div v-if="downloadHistory.length > 0" class="mt-2">
        <div class="text-caption mb-1 font-weight-medium">下载历史</div>
        <div class="history-list">
          <div
            v-for="(item, index) in downloadHistory.slice().reverse()"
            :key="index"
            class="history-item"
          >
            <div class="history-main">
              <el-icon
                :class="['history-icon', item.result.success ? (item.result.skipped ? 'is-warning' : 'is-success') : 'is-error']"
              >
                <circle-check v-if="item.result.success && !item.result.skipped" />
                <minus v-else-if="item.result.success && item.result.skipped" />
                <warning-filled v-else />
              </el-icon>
              <div class="history-text">
                <div class="history-url" :title="item.url">
                  {{ item.url }}
                </div>
                <div class="history-sub">
                  {{ formatDownloadResult(item.result) }}
                </div>
              </div>
            </div>
            <el-tag
              size="small"
              :type="item.result.success ? (item.result.skipped ? 'warning' : 'success') : 'danger'"
            >
              {{
                item.result.success
                  ? item.result.skipped
                    ? '已跳过'
                    : '成功'
                  : '失败'
              }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.workspace-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workspace-card :deep(.el-card__header) {
  padding: 10px 16px;
}

.workspace-card :deep(.el-card__body) {
  padding: 12px 16px 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header-left {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
}

.mr-2 {
  margin-right: 8px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mt-2 {
  margin-top: 8px;
}

.text-caption {
  font-size: 12px;
}

.text-medium-emphasis {
  color: #6b7280;
}

.font-weight-medium {
  font-weight: 500;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid #f3f4f6;
}

.history-item:last-child {
  border-bottom: none;
}

.history-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.history-icon {
  font-size: 16px;
  color: #9ca3af;
}

.history-icon.is-success {
  color: #16a34a;
}

.history-icon.is-warning {
  color: #f59e0b;
}

.history-icon.is-error {
  color: #dc2626;
}

.history-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.history-url {
  font-size: 12px;
  color: #111827;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.history-sub {
  font-size: 11px;
  color: #6b7280;
}

.inner-card :deep(.el-card__body) {
  padding: 8px 10px 10px;
}
</style>

