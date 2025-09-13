<template>
  <div class="costume-detail" v-if="costume">
    <!-- 基础信息 -->
    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <span>服饰信息</span>
          <div class="header-actions">
            <el-tooltip content="编辑服饰信息" placement="top">
              <el-button size="default" @click="handleEdit">编辑</el-button>
            </el-tooltip>
            <el-tooltip content="删除服饰" placement="top">
              <el-button type="danger" size="default" @click="handleDelete">删除</el-button>
            </el-tooltip>
          </div>
        </div>
      </template>
      
      <el-descriptions :column="2" border size="default">
        <el-descriptions-item label="ID">{{ costume.id }}</el-descriptions-item>
        <el-descriptions-item label="名称">{{ costume.name }}</el-descriptions-item>
        <el-descriptions-item label="民族">{{ costume.ethnicity || '-' }}</el-descriptions-item>
        <el-descriptions-item label="链接">{{ costume.link || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(costume.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDate(costume.updated_at) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ costume.description || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 图片预览 -->
    <el-card class="image-card">
      <template #header>
        <div class="card-header">
          <span>图片预览</span>
          <el-tooltip content="切换调试模式" placement="top">
            <el-button size="default" @click="toggleDebugMode">
              {{ debugMode ? '隐藏调试' : '显示调试' }}
            </el-button>
          </el-tooltip>
        </div>
      </template>
      
      <!-- 调试模式 -->
      <div v-if="debugMode">
        <ImageDebugger 
          v-for="item in imageFields" 
          :key="'debug-' + item.field"
          :image-data="costume[item.field]"
        />
      </div>
      
      <div class="image-grid">
        <div v-for="item in imageFields" :key="item.field" class="image-item">
          <div class="image-label">{{ item.label }}</div>
          <div class="image-container">
            <div class="image-preview">
              <img
                v-if="costume[item.field]"
                :src="validateAndFormatImageSrc(costume[item.field])"
                :alt="item.label"
                @click="previewImage(costume[item.field])"
                @error="handleImageError(item.field, $event)"
                @load="handleImageLoad(item.field)"
                loading="lazy"
              />
              <div v-else class="no-image">暂无图片</div>
            </div>
            
            <!-- 右上角删除按钮 -->
            <el-tooltip content="删除{{ item.label }}" placement="top">
              <el-button
                v-if="costume[item.field]"
                size="small"
                type="danger"
                class="delete-button"
                @click="clearImageField(item.field, item.label)"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
          
          <!-- 调试信息 -->
          <div v-if="debugMode && costume[item.field]" class="debug-info">
            <small style="color: #909399; font-size: 14px;">
              数据类型: {{ costume[item.field]?.startsWith('data:') ? 'Base64' : 'URL' }}
              | 数据长度: {{ costume[item.field]?.length || 0 }}
            </small>
          </div>
        </div>
      </div>
    </el-card>

    <!-- AI文件 -->
    <el-card class="file-card">
      <template #header>
        <div class="card-header">
          <span>AI文件</span>
        </div>
      </template>
      
      <el-table :data="aiFiles" border size="default">
        <el-table-column prop="label" label="文件类型" />
        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <div class="file-action-buttons">
              <template v-if="costume[row.field]">
                <el-tooltip content="下载{{ row.label }}" placement="top">
                  <el-button
                    size="small"
                    type="success"
                    @click="downloadAiFile(row.field, `${costume.name}_${row.label}.ai`)"
                  >
                    <el-icon><Download /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="删除{{ row.label }}" placement="top">
                  <el-button
                    size="small"
                    type="danger"
                    @click="clearField(row.field, row.label)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-tooltip>
              </template>
              <span v-else class="no-file-text">无文件</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 纹样管理 -->
    <el-card class="pattern-card">
      <template #header>
        <div class="card-header">
          <span>纹样管理</span>
          <el-tooltip content="新增纹样" placement="top">
            <el-button type="primary" size="default" @click="addPattern">新增纹样</el-button>
          </el-tooltip>
        </div>
      </template>
      
      <el-table :data="costume.patterns" border size="default">
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="name" label="纹样名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip content="查看纹样详情" placement="top">
                <el-button size="small" type="primary" @click="viewPatternDetail(row)">
                  <el-icon><View /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="编辑纹样" placement="top">
                <el-button size="small" type="warning" @click="editPattern(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除纹样" placement="top">
                <el-button size="small" type="danger" @click="deletePattern(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 图片预览弹窗 -->
    <el-dialog 
      v-model="previewVisible" 
      title="图片预览" 
      width="85%"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      class="image-preview-dialog"
    >
      <div class="preview-image-container">
        <img 
          v-if="previewImageSrc" 
          :src="previewImageSrc" 
          alt="预览图片"
          class="preview-image"
          @error="handlePreviewImageError"
          @load="handlePreviewImageLoad"
        />
        <div v-else class="preview-error">
          图片加载失败
        </div>
      </div>
    </el-dialog>

    <!-- 纹样表单弹窗 -->
    <el-dialog
      v-model="patternDialogVisible"
      :title="patternDialogTitle"
      width="550px"
    >
      <PatternForm
        :costume-id="costume.id"
        :pattern-id="editPatternData?.id"
        :initial-data="editPatternData"
        @success="handlePatternSuccess"
        @cancel="patternDialogVisible = false"
      />
    </el-dialog>

    <!-- 纹样详情弹窗 -->
    <el-dialog
      v-model="patternDetailVisible"
      title="纹样详情"
      width="850px"
      class="pattern-detail-dialog"
    >
      <div v-if="currentPattern" class="pattern-detail">
        <!-- 基本信息 -->
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">基本信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="ID">{{ currentPattern.id }}</el-descriptions-item>
            <el-descriptions-item label="纹样名称">{{ currentPattern.name }}</el-descriptions-item>
            <el-descriptions-item label="所属服饰" :span="2">
              <el-tag type="primary" size="default" class="costume-tag">
                {{ costume.name || '未知服饰' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间" v-if="currentPattern.created_at">
              {{ formatDate(currentPattern.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间" v-if="currentPattern.updated_at">
              {{ formatDate(currentPattern.updated_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              <div class="description-text">
                {{ currentPattern.description || '暂无描述' }}
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 纹样图片 -->
        <el-card class="image-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">纹样图片</span>
            </div>
          </template>
          <div class="pattern-image-container">
            <div v-if="currentPattern.pattern_image" class="image-display">
              <div class="image-preview-wrapper">
                <img 
                  :src="validateAndFormatImageSrc(currentPattern.pattern_image)" 
                  alt="纹样图片" 
                  @click="previewImage(currentPattern.pattern_image)"
                  @error="handleImageError('pattern_image', $event)"
                  @load="handleImageLoad('pattern_image')"
                  class="pattern-image"
                />
                <div class="image-overlay">
                  <el-icon class="preview-icon"><View /></el-icon>
                  <span>点击放大</span>
                </div>
              </div>
              <div class="image-info">
                <span class="image-size-text">点击图片查看大图</span>
              </div>
              <!-- 纹样图片删除按钮 -->
              <div class="pattern-image-actions">
                <el-tooltip content="删除纹样图片" placement="top">
                  <el-button
                    size="default"
                    type="danger"
                    class="pattern-delete-button"
                    @click="clearPatternField('pattern_image', '纹样图片')"
                  >
                    <el-icon><Close /></el-icon>删除图片
                  </el-button>
                </el-tooltip>
              </div>
            </div>
            <div v-else class="no-image-placeholder">
              <el-icon class="placeholder-icon"><Picture /></el-icon>
              <span>暂无纹样图片</span>
            </div>
          </div>
        </el-card>

        <!-- AI文件 -->
        <el-card v-if="currentPattern.ai_file" class="file-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">AI文件</span>
            </div>
          </template>
          <div class="file-actions">
            <el-tooltip content="下载AI文件" placement="top">
              <el-button 
                type="success"
                size="default"
                @click="downloadPatternAiFile(currentPattern.ai_file, currentPattern.name)"
                class="download-btn"
              >
                <el-icon><Download /></el-icon>下载AI文件
              </el-button>
            </el-tooltip>
            <el-tooltip content="删除AI文件" placement="top">
              <el-button
                size="default"
                type="danger"
                @click="clearPatternField('ai_file', 'AI文件')"
                class="delete-file-btn"
              >
                <el-icon><Delete /></el-icon>删除文件
              </el-button>
            </el-tooltip>
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View, Edit, Delete, Download, Close, Picture } from '@element-plus/icons-vue'
import request from '@/api/request'
import PatternForm from './PatternForm.vue'
import ClearFieldButton from '@/components/ClearFieldButton.vue'
import PatternClearFieldButton from '@/components/PatternClearFieldButton.vue'
import ImageDebugger from '@/components/ImageDebugger.vue'

const route = useRoute()
const router = useRouter()

const costume = ref(null)
const previewVisible = ref(false)
const previewImageSrc = ref('')
const patternDialogVisible = ref(false)
const patternDialogTitle = ref('')
const editPatternData = ref(null)
const patternDetailVisible = ref(false)
const currentPattern = ref(null)
const debugMode = ref(false) // 调试模式

const imageFields = [
  { field: 'color_diagram', label: '颜色图表' },
  { field: 'size_diagram', label: '尺寸图表' },
  { field: 'original_image', label: '原始图片' },
  { field: 'blurred_image', label: '模糊图片' },
  { field: 'summary_image', label: '摘要图片' }
]

const aiFiles = [
  { field: 'color_diagram_ai', label: '颜色AI文件' },
  { field: 'size_diagram_ai', label: '尺寸AI文件' },
  { field: 'original_image_ai', label: '原始AI文件' },
  { field: 'summary_image_ai', label: '摘要AI文件' }
]

const loadData = async () => {
  try {
    const id = route.params.id
    console.log('正在加载服饰详情，ID:', id)
    const data = await request.get(`/costumes/${id}`)
    console.log('收到服饰数据:', data)
    
    // 检查图片字段
    const imageFieldsToCheck = ['color_diagram', 'size_diagram', 'original_image', 'blurred_image', 'summary_image']
    imageFieldsToCheck.forEach(field => {
      if (data[field]) {
        console.log(`${field} 图片数据:`, data[field].substring(0, 50) + '...')
        // 检查是否是有效的base64或URL
        if (!data[field].startsWith('data:') && !data[field].startsWith('http')) {
          console.warn(`${field} 图片数据格式可能不正确`)
          // 尝试修复数据格式
          data[field] = validateAndFormatImageSrc(data[field])
          console.log(`${field} 修复后:`, data[field].substring(0, 50) + '...')
        }
      } else {
        console.log(`${field} 图片数据: 无`)
      }
    })
    
    costume.value = data
    console.log('服饰数据设置完成')
  } catch (e) {
    console.error('加载服饰详情失败:', e)
    ElMessage.error('加载服饰详情失败: ' + (e.response?.data?.message || e.message))
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

// 图片数据验证和格式化
const validateAndFormatImageSrc = (src) => {
  if (!src) return null
  
  // 如果已经是完整的URL或base64，直接返回
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
    return src
  }
  
  // 如果是纯 base64 数据，添加 data URL 前缀
  if (src.match(/^[A-Za-z0-9+/]+=*$/)) {
    return `data:image/png;base64,${src}`
  }
  
  console.warn('未知的图片数据格式:', src.substring(0, 50))
  // 对于未知格式，尝试作为base64处理
  return `data:image/png;base64,${src}`
}

const previewImage = (src) => {
  console.log('点击预览图片:', src?.substring(0, 50) + '...')
  if (!src) {
    ElMessage.warning('图片数据为空')
    return
  }
  
  const formattedSrc = validateAndFormatImageSrc(src)
  console.log('格式化后的图片地址:', formattedSrc?.substring(0, 50) + '...')
  
  previewImageSrc.value = formattedSrc
  previewVisible.value = true
}

// 图片加载成功处理
const handleImageLoad = (field) => {
  console.log(`图片加载成功: ${field}`)
}

// 图片加载失败处理
const handleImageError = (field, event) => {
  console.error(`图片加载失败: ${field}`, event)
  ElMessage.error(`${field} 图片加载失败`)
}

// 预览图片加载成功
const handlePreviewImageLoad = () => {
  console.log('预览图片加载成功')
}

// 预览图片加载失败
const handlePreviewImageError = (event) => {
  console.error('预览图片加载失败:', event)
  ElMessage.error('预览图片加载失败')
}

// 切换调试模式
const toggleDebugMode = () => {
  debugMode.value = !debugMode.value
  console.log('调试模式:', debugMode.value)
}

// 清除图片字段
const clearImageField = async (field, label) => {
  ElMessageBox.confirm(
    `确定要删除${label}吗？此操作不可恢复。`,
    '删除确认',
    {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    try {
      await request.delete(`/costumes/${costume.value.id}/clear/${field}`)
      
      ElMessage.success(`${label}删除成功`)
      loadData()
    } catch (e) {
      console.error('删除失败:', e)
      ElMessage.error(`删除${label}失败: ${e.response?.data?.message || e.message}`)
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 清除文件字段 - 使用DELETE方法
const clearField = async (field, label) => {
  ElMessageBox.confirm(
    `确定要删除${label}吗？此操作不可恢复。`,
    '删除确认',
    {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    try {
      await request.delete(`/costumes/${costume.value.id}/clear/${field}`)
      
      ElMessage.success(`${label}删除成功`)
      loadData()
    } catch (e) {
      console.error('删除失败:', e)
      ElMessage.error(`删除${label}失败: ${e.response?.data?.message || e.message}`)
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 清除纹样字段 - 使用DELETE方法
const clearPatternField = async (field, label) => {
  ElMessageBox.confirm(
    `确定要删除纹样的${label}吗？此操作不可恢复。`,
    '删除确认',
    {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    try {
      await request.delete(`/costumes/${costume.value.id}/clear/pattern/${currentPattern.value.id}/${field}`)
      
      ElMessage.success(`纹样${label}删除成功`)
      loadData()
      // 更新当前纹样数据
      currentPattern.value[field] = null
    } catch (e) {
      console.error('删除失败:', e)
      ElMessage.error(`删除纹样${label}失败: ${e.response?.data?.message || e.message}`)
    }
  }).catch(() => {
    // 用户取消删除
  })
}

const downloadFile = (fileData, fileName) => {
  if (!fileData) {
    ElMessage.warning('文件数据为空')
    return
  }
  
  try {
    // 确保文件名有正确的.ai扩展名
    let downloadFileName = fileName.endsWith('.ai') ? fileName : `${fileName}.ai`
    
    // 如果是base64数据，使用Blob对象来确保文件完整性
    if (fileData.startsWith('data:')) {
      const base64Data = fileData.split(',')[1]
      const mimeType = fileData.split(';')[0].split(':')[1]
      
      // 将base64转换回二进制数据
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // 创建Blob对象
      const blob = new Blob([bytes], { type: mimeType })
      
      // 创建下载链接
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = downloadFileName
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 清理URL对象
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 100)
      
      console.log('下载AI文件:', {
        fileName: downloadFileName,
        fileSize: blob.size + ' bytes',
        mimeType: mimeType
      })
    } else {
      // 兼容传统的直接URL下载
      const link = document.createElement('a')
      link.href = fileData
      link.download = downloadFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    ElMessage.success('AI文件下载开始')
  } catch (e) {
    console.error('下载失败:', e)
    ElMessage.error('文件下载失败: ' + e.message)
  }
}

const downloadPatternFile = (fileData, fileName) => {
  if (!fileData) {
    ElMessage.warning('文件数据为空')
    return
  }
  
  try {
    // 确保文件名有正确的.ai扩展名
    let downloadFileName = fileName.endsWith('.ai') ? fileName : `${fileName}.ai`
    
    // 检查是否是完整的Data URL格式
    if (fileData.startsWith('data:')) {
      const base64Data = fileData.split(',')[1]
      const mimeType = fileData.split(';')[0].split(':')[1]
      
      // 将base64转换回二进制数据
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // 创建Blob对象
      const blob = new Blob([bytes], { type: mimeType })
      
      // 创建下载链接
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = downloadFileName
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 清理URL对象
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 100)
      
      console.log('下载AI文件:', {
        fileName: downloadFileName,
        fileSize: blob.size + ' bytes',
        mimeType: mimeType
      })
    } 
    // 检查是否是纯Base64数据（没有data:前缀）
    else if (/^[A-Za-z0-9+/]*={0,2}$/.test(fileData)) {
      // 将base64转换回二进制数据
      const binaryString = atob(fileData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // 创建Blob对象，AI文件通常为application/postscript类型
      const blob = new Blob([bytes], { type: 'application/postscript' })
      
      // 创建下载链接
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = downloadFileName
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 清理URL对象
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 100)
      
      console.log('下载AI文件:', {
        fileName: downloadFileName,
        fileSize: blob.size + ' bytes',
        mimeType: 'application/postscript'
      })
    }
    // 兼容传统的直接URL下载
    else {
      const link = document.createElement('a')
      link.href = fileData
      link.download = downloadFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    ElMessage.success('AI文件下载开始')
  } catch (e) {
    console.error('下载失败:', e)
    ElMessage.error('文件下载失败: ' + e.message)
  }
}

// 添加下载队列控制，防止并发下载过多导致网络错误
let downloadQueue = Promise.resolve();

// 添加新的下载AI文件方法
const downloadAiFile = async (fileField, fileName) => {
  try {
    // 调用后端下载接口
    const response = await request({
      method: 'GET',
      url: `/download/costume/${costume.value.id}/file/${fileField}`,
      responseType: 'blob'
    })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理URL对象
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 100)
    
    ElMessage.success('AI文件下载成功')
  } catch (e) {
    console.error('下载失败:', e)
    // 检查是否是网络错误
    if (e.code === 'NETWORK_ERROR' || !e.response) {
      ElMessage.error('网络连接失败，请检查网络连接后重试')
    } else {
      ElMessage.error('AI文件下载失败: ' + (e.response?.data?.message || e.message))
    }
  }
}

// 添加纹样AI文件下载方法
const downloadPatternAiFile = async (fileData, fileName) => {
  if (!currentPattern.value || !currentPattern.value.id) {
    ElMessage.warning('纹样信息不完整')
    return
  }
  
  try {
    // 调用后端下载接口
    const response = await request({
      method: 'GET',
      url: `/download/pattern/${currentPattern.value.id}/ai`,
      responseType: 'blob'
    })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response], { type: 'application/illustrator' }))

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${fileName}.ai`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理URL对象
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 100)
    
    ElMessage.success('AI文件下载成功')
  } catch (e) {
    console.error('下载失败:', e)
    // 检查是否是网络错误
    if (e.code === 'NETWORK_ERROR' || !e.response) {
      ElMessage.error('网络连接失败，请检查网络连接后重试')
    } else {
      ElMessage.error('文件下载失败: ' + (e.response?.data?.message || e.message))
    }
  }
}

const handleEdit = () => {
  router.push(`/costumes/${costume.value.id}/edit`)
}

const handleDelete = () => {
  ElMessageBox.confirm(`确定要删除服饰 "${costume.value.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await request.delete(`/costumes/${costume.value.id}`)
      ElMessage.success('删除成功')
      router.push('/costumes')
    } catch (e) {
      console.error(e)
      ElMessage.error('删除失败: ' + (e.message || '未知错误'))
    }
  })
}

const addPattern = () => {
  patternDialogTitle.value = '新增纹样'
  editPatternData.value = null
  patternDialogVisible.value = true
}

// 修复：将函数名改为 viewPatternDetail 以避免冲突
const viewPatternDetail = (row) => {
  currentPattern.value = { ...row }
  patternDetailVisible.value = true
}

const editPattern = (row) => {
  patternDialogTitle.value = '编辑纹样'
  editPatternData.value = { ...row }
  patternDialogVisible.value = true
}

const deletePattern = (row) => {
  ElMessageBox.confirm(`确定要删除纹样 "${row.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await request.delete(`/costumes/${costume.value.id}/patterns/${row.id}`)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      console.error(e)
    }
  })
}

const handlePatternSuccess = () => {
  patternDialogVisible.value = false
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.costume-detail {
  padding: 25px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 纹样详情弹窗样式 */
.pattern-detail-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.pattern-detail {
  display: flex;
  flex-direction: column;
  gap: 25px;
  padding: 25px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
}

/* 卡片样式优化 */
.info-card,
.image-card,
.file-card,
.pattern-card {
  margin-bottom: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.info-card:hover,
.image-card:hover,
.file-card:hover,
.pattern-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
  font-size: 18px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.header-actions .el-button {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  font-size: 15px;
  padding: 8px 16px;
}

.header-actions .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 图片网格优化 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 28px;
}

.image-item {
  text-align: center;
  background: #fafafa;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
}

.image-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.image-container {
  position: relative;
  display: inline-block;
  width: 100%;
}

/* 删除按钮样式 - 右上角位置 */
.delete-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 108, 108, 0.9);
  border: 1px solid #f56c6c;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
  transition: all 0.3s ease;
  z-index: 10;
}

.delete-button:hover {
  background: #f56c6c;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.5);
}

.delete-button .el-icon {
  font-size: 16px;
  color: white;
}

.image-label {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 15px;
}

/* 图片预览优化 - 根据用户偏好规范 */
.image-preview {
  height: 220px; /* 固定高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 15px;
  cursor: pointer;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 阴影效果 */
  transition: all 0.3s ease; /* 悬停动画 */
  position: relative;
}

.image-preview:hover {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保持比例适配 */
  transition: transform 0.3s ease;
}

.image-preview:hover img {
  transform: scale(1.05); /* 悬停放大效果 */
}

.no-image {
  color: #c0c4cc;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.no-image::before {
  content: '🖼️';
  font-size: 36px;
}

/* 调试信息样式 */
.debug-info {
  margin: 10px 0;
  padding: 6px 10px;
  background: #f0f0f0;
  border-radius: 4px;
  text-align: left;
}

/* 纹样卡片优化 */
.pattern-card {
  margin-top: 25px;
}

.pattern-detail {
  padding: 25px 0;
}

.pattern-images {
  margin-top: 25px;
}

.pattern-files {
  margin-top: 25px;
}

.pattern-images .image-preview,
.pattern-detail .image-preview {
  margin: 15px 0;
  text-align: center;
  width: 100%;
  max-width: 400px; /* 调整最大宽度以适应 4:3 比例 */
  height: 0;
  padding-bottom: 75%; /* 4:3 比例 (3/4 * 100%) */
  position: relative;
}

.pattern-images .image-preview img,
.pattern-detail .image-preview img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保持比例适配 */
  cursor: pointer;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.pattern-images .image-preview img:hover,
.pattern-detail .image-preview img:hover {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
  transform: translateY(-2px) scale(1.02);
}

/* 操作按钮组样式 */
.action-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.action-buttons .el-button {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.action-buttons .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-buttons .el-button .el-icon {
  font-size: 16px;
}

/* 文件操作按钮组 */
.file-action-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.file-action-buttons .el-button {
  width: 40px;
  height: 36px;
  padding: 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.file-action-buttons .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.file-action-buttons .el-icon {
  font-size: 16px;
}

.no-file-text {
  color: #c0c4cc;
  font-size: 14px;
}

/* 纹样操作样式 */
.pattern-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* 图片展示区域 */
.image-display {
  width: 100%;
  max-width: 400px; /* 调整最大宽度以适应 4:3 比例 */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.image-preview-wrapper {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 75%; /* 4:3 比例 (3/4 * 100%) */
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.image-preview-wrapper:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.pattern-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  gap: 10px;
}

.image-preview-wrapper:hover .image-overlay {
  opacity: 1;
}

.preview-icon {
  font-size: 28px;
}

.image-info {
  text-align: center;
}

.image-size-text {
  color: #909399;
  font-size: 14px;
}

/* 无图片占位符 */
.no-image-placeholder {
  width: 100%;
  max-width: 400px; /* 调整最大宽度以适应 4:3 比例 */
  height: 0;
  padding-bottom: 75%; /* 4:3 比例 (3/4 * 100%) */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  color: #c0c4cc;
  gap: 15px;
  transition: all 0.3s ease;
  position: relative;
}

.no-image-placeholder:hover {
  border-color: #c0c4cc;
  background: #f5f5f5;
}

.placeholder-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 36px;
}

.pattern-delete-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 108, 108, 0.9);
  border: 1px solid #f56c6c;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
  transition: all 0.3s ease;
  z-index: 10;
}

.pattern-delete-button:hover {
  background: #f56c6c;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.5);
}

.pattern-delete-button .el-icon {
  font-size: 16px;
  color: white;
}

.pattern-file-actions {
  display: flex;
  gap: 15px;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

.pattern-file-actions .el-button {
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  font-size: 15px;
  padding: 10px 20px;
}

.pattern-file-actions .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 表格优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

:deep(.el-table .el-table__cell) {
  border-color: #f0f0f0;
}

:deep(.el-table th.el-table__cell) {
  background-color: #fafafa;
  font-weight: 600;
  color: #303133;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 响应式设计 - 更多适配点 */
@media (max-width: 1200px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 25px;
  }
  
  .image-preview {
    height: 200px;
  }
  
  .card-header {
    font-size: 17px;
  }
  
  .image-label {
    font-size: 15px;
  }
}

@media (max-width: 992px) {
  .costume-detail {
    padding: 20px;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .image-preview {
    height: 180px;
  }
  
  .pattern-images .image-preview,
  .pattern-detail .image-preview {
    height: 300px;
  }
  
  .header-actions {
    gap: 8px;
  }
  
  .header-actions .el-button {
    font-size: 14px;
    padding: 7px 14px;
  }
}

@media (max-width: 768px) {
  .costume-detail {
    padding: 18px;
  }
  
  .image-grid {
    grid-template-columns: 1fr; /* 单列布局 */
    gap: 20px;
  }
  
  .image-preview {
    height: 200px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
    font-size: 16px;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  :deep(.el-descriptions) {
    font-size: 15px;
  }
  
  .pattern-images .image-preview,
  .pattern-detail .image-preview {
    height: 250px;
  }
  
  .pattern-file-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .pattern-file-actions .el-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .costume-detail {
    padding: 15px;
  }
  
  .image-preview {
    height: 180px;
  }
  
  .pattern-images .image-preview,
  .pattern-detail .image-preview {
    height: 220px;
  }
  
  :deep(.el-dialog) {
    width: 95%;
    margin: 5vh auto;
  }
  
  .card-header {
    font-size: 15px;
  }
  
  .image-label {
    font-size: 14px;
    margin-bottom: 12px;
  }
  
  .action-buttons .el-button {
    width: 32px;
    height: 32px;
  }
  
  .action-buttons .el-button .el-icon {
    font-size: 14px;
  }
  
  .file-action-buttons .el-button {
    width: 36px;
    height: 32px;
  }
  
  .file-action-buttons .el-icon {
    font-size: 14px;
  }
  
  .pattern-delete-button {
    width: 28px;
    height: 28px;
  }
  
  .pattern-delete-button .el-icon {
    font-size: 14px;
  }
  
  .delete-button {
    width: 28px;
    height: 28px;
  }
  
  .delete-button .el-icon {
    font-size: 14px;
  }
}
</style>