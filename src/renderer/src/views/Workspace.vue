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
  <div>
    <!-- 工作目录设置 -->
    <v-card variant="outlined" class="mb-3">
      <v-card-title class="text-subtitle-1 py-2 px-3">
        <v-icon size="18" class="mr-2">mdi-folder-outline</v-icon>
        工作目录设置
      </v-card-title>
      <v-divider class="mx-3" />
      <v-card-text class="pa-3">
        <div class="mb-3">
          <div class="text-caption text-medium-emphasis mb-2">
            当前工作目录用于存储应用生成的文件和临时数据。选择后会自动保存，下次启动时无需重新设置。
          </div>
          <v-text-field
            v-model="workspaceDirectory"
            label="工作目录路径"
            readonly
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-folder"
            class="mb-2"
            hide-details
          >
            <template v-slot:append>
              <v-btn
                variant="text"
                size="small"
                @click="selectWorkspaceDirectory"
                :loading="selectingDirectory"
              >
                选择文件夹
              </v-btn>
            </template>
          </v-text-field>
          <div v-if="workspaceDirectory" class="d-flex align-center ga-2">
            <v-chip
              color="success"
              size="x-small"
              prepend-icon="mdi-check-circle"
            >
              已设置
            </v-chip>
            <v-btn
              variant="text"
              size="x-small"
              color="error"
              prepend-icon="mdi-delete-outline"
              @click="clearWorkspaceDirectory"
            >
              清除
            </v-btn>
          </div>
          <div v-else class="d-flex align-center">
            <v-chip
              color="warning"
              size="x-small"
              prepend-icon="mdi-alert-outline"
            >
              未设置
            </v-chip>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 文件查询功能 -->
    <v-card variant="outlined" class="mb-3">
      <v-card-title class="text-subtitle-1 py-2 px-3">
        <v-icon size="18" class="mr-2">mdi-magnify</v-icon>
        文件查询
      </v-card-title>
      <v-divider class="mx-3" />
      <v-card-text class="pa-3">
        <div class="mb-3">
          <div class="text-caption text-medium-emphasis mb-2">
            输入文件下载链接，查询该文件是否已下载。如果已下载，将显示文件的绝对路径。
          </div>
          <v-text-field
            v-model="queryUrl"
            label="文件下载链接"
            placeholder="https://example.com/file.zip"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-link"
            class="mb-2"
            :disabled="querying"
            @keyup.enter="handleQuery"
            hide-details
          >
            <template v-slot:append>
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                @click="handleQuery"
                :loading="querying"
                :disabled="!queryUrl.trim() || !workspaceDirectory"
                prepend-icon="mdi-magnify"
              >
                查询
              </v-btn>
            </template>
          </v-text-field>
          <div v-if="!workspaceDirectory" class="d-flex align-center ga-2 mb-2">
            <v-alert
              type="warning"
              variant="tonal"
              density="compact"
              class="grow text-caption py-2"
            >
              请先设置工作目录才能使用查询功能
            </v-alert>
          </div>
          
          <!-- 查询结果 -->
          <div v-if="queryResult" class="mt-2">
            <v-alert
              :type="queryResult.found ? 'success' : 'info'"
              variant="tonal"
              :icon="queryResult.found ? 'mdi-check-circle' : 'mdi-information'"
              class="mb-2 text-caption py-2"
            >
              {{ queryResult.message }}
            </v-alert>
            
            <v-card v-if="queryResult.found && queryResult.filePath" variant="outlined" class="mt-2">
              <v-card-text class="pa-2">
                <div class="text-caption mb-1 font-weight-medium">文件信息</div>
                <v-text-field
                  :model-value="queryResult.filePath"
                  label="文件绝对路径"
                  readonly
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-file"
                  class="mb-1"
                  hide-details
                >
                  <template v-slot:append>
                    <v-btn
                      variant="text"
                      size="x-small"
                      @click="copyToClipboard(queryResult.filePath, '文件路径')"
                      prepend-icon="mdi-content-copy"
                    >
                      复制
                    </v-btn>
                  </template>
                </v-text-field>
                <div v-if="queryResult.fileSize" class="text-caption text-medium-emphasis">
                  文件大小: {{ formatFileSize(queryResult.fileSize) }}
                </div>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- 文件下载功能 -->
    <v-card variant="outlined" class="mb-3">
      <v-card-title class="text-subtitle-1 py-2 px-3">
        <v-icon size="18" class="mr-2">mdi-download-outline</v-icon>
        文件下载
      </v-card-title>
      <v-divider class="mx-3" />
      <v-card-text class="pa-3">
        <div class="mb-3">
          <div class="text-caption text-medium-emphasis mb-2">
            输入文件下载链接，文件将保存到工作目录下的 <code>files</code> 目录。如果文件已存在，将自动跳过下载。
          </div>
          <v-text-field
            v-model="downloadUrl"
            label="文件下载链接"
            placeholder="https://example.com/file.zip"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-link"
            class="mb-2"
            :disabled="downloading"
            @keyup.enter="handleDownload"
            hide-details
          >
            <template v-slot:append>
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                @click="handleDownload"
                :loading="downloading"
                :disabled="!downloadUrl.trim() || !workspaceDirectory"
                prepend-icon="mdi-download"
              >
                下载
              </v-btn>
            </template>
          </v-text-field>
          <div v-if="!workspaceDirectory" class="d-flex align-center ga-2 mb-2">
            <v-alert
              type="warning"
              variant="tonal"
              density="compact"
              class="grow text-caption py-2"
            >
              请先设置工作目录才能使用下载功能
            </v-alert>
          </div>
        </div>
        
        <!-- 下载历史 -->
        <div v-if="downloadHistory.length > 0" class="mt-2">
          <div class="text-caption mb-1 font-weight-medium">下载历史</div>
          <v-list density="compact" variant="outlined" rounded="sm" style="max-height: 200px; overflow-y: auto;">
            <v-list-item
              v-for="(item, index) in downloadHistory.slice().reverse()"
              :key="index"
              :title="item.url"
              :subtitle="formatDownloadResult(item.result)"
              class="py-1"
              style="min-height: auto;"
            >
              <template v-slot:prepend>
                <v-icon
                  size="16"
                  :color="item.result.success ? (item.result.skipped ? 'warning' : 'success') : 'error'"
                >
                  {{ item.result.success 
                    ? (item.result.skipped ? 'mdi-skip-next' : 'mdi-check-circle') 
                    : 'mdi-alert-circle' }}
                </v-icon>
              </template>
              <template v-slot:append>
                <v-chip
                  :color="item.result.success ? (item.result.skipped ? 'warning' : 'success') : 'error'"
                  size="x-small"
                  variant="tonal"
                >
                  {{ item.result.success 
                    ? (item.result.skipped ? '已跳过' : '成功') 
                    : '失败' }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

