<template>
  <div class="pattern-list">
    <!-- 操作栏 -->
    <el-card class="search-card">
      <div class="search-bar">
        <div class="search-input">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入纹样名称"
            clearable
            size="default"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-tooltip content="搜索纹样" placement="top">
                <el-button size="default" @click="handleSearch">
                  <el-icon><Search /></el-icon>搜索
                </el-button>
              </el-tooltip>
            </template>
          </el-input>
        </div>
      </div>
    </el-card>

    <!-- 表格 -->
    <el-card class="table-card">
      <el-table
        :data="tableData"
        border
        stripe
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
        size="default"
      >
        <el-table-column prop="id" label="ID" width="100" align="center" />
        <el-table-column prop="name" label="纹样名称" min-width="250" />
        <el-table-column prop="description" label="描述" min-width="250" show-overflow-tooltip />
        <el-table-column prop="costume_name" label="所属服饰" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip content="查看纹样详情" placement="top">
                <el-button size="small" type="primary" @click="handleView(row)">
                  <el-icon><View /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="编辑纹样" placement="top">
                <el-button size="small" type="warning" @click="handleEdit(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除纹样" placement="top">
                <el-button size="small" type="danger" @click="handleDelete(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
          @current-change="handlePageChange"
          background
        />
      </div>
    </el-card>

    <!-- 纹样详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
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
                {{ currentPattern.costume_name || '未知服饰' }}
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
                <span v-if="currentPattern.description">{{ currentPattern.description }}</span>
                <span v-else class="empty-description">暂无描述</span>
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
                  @error="handleImageError"
                  @load="handleImageLoad"
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
                @click="downloadPatternFile(currentPattern.ai_file, currentPattern.name)"
                class="download-btn"
              >
                <el-icon><Download /></el-icon>下载AI文件
              </el-button>
            </el-tooltip>
          </div>
        </el-card>
      </div>
    </el-dialog>

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

    <!-- 编辑纹样表单弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editDialogTitle"
      width="550px"
    >
      <PatternForm
        :costume-id="editPatternData?.costume_id"
        :pattern-id="editPatternData?.id"
        :initial-data="editPatternData"
        @success="handleEditSuccess"
        @cancel="editDialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, View, Edit, Delete, Picture, Download } from '@element-plus/icons-vue'
import request from '@/api/request'
import PatternForm from './PatternForm.vue'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')

const detailVisible = ref(false)
const currentPattern = ref(null)
const previewVisible = ref(false)
const previewImageSrc = ref('')

// 编辑功能相关状态
const editDialogVisible = ref(false)
const editPatternData = ref(null)
const editDialogTitle = ref('编辑纹样')

// 搜索功能
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    
    // 添加搜索参数 - 修复搜索功能
    if (searchKeyword.value.trim()) {
      params.name = searchKeyword.value.trim()  // 使用name参数而不是search
    }
    
    const res = await request.get('/patterns', { params })
    console.log('获取纹样数据:', res)
    
    // 获取所有服饰信息，用于显示服饰名称
    const costumesRes = await request.get('/costumes')
    const costumeMap = {}
    if (Array.isArray(costumesRes)) {
      costumesRes.forEach(costume => {
        costumeMap[costume.id] = costume
      })
    }
    
    if (Array.isArray(res)) {
      // 为每个纹样添加服饰名称
      tableData.value = res.map(pattern => ({
        ...pattern,
        costume_name: pattern.costume_id && costumeMap[pattern.costume_id] 
          ? costumeMap[pattern.costume_id].name 
          : '未知服饰'
      }))
      total.value = res.length
      console.log('纹样数据格式: 数组, 数量:', res.length)
      // 打印第一个纹样的详细信息
      if (res.length > 0) {
        console.log('第一个纹样详情:', res[0])
      }
    } else {
      // 为每个纹样添加服饰名称
      const patternData = res.data || []
      tableData.value = patternData.map(pattern => ({
        ...pattern,
        costume_name: pattern.costume_id && costumeMap[pattern.costume_id] 
          ? costumeMap[pattern.costume_id].name 
          : '未知服饰'
      }))
      total.value = res.total || res.data?.length || 0
      console.log('纹样数据格式: 对象, 数量:', res.total)
      // 打印第一个纹样的详细信息
      if (patternData.length > 0) {
        console.log('第一个纹样详情:', patternData[0])
      }
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载数据失败')
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 分页
const handlePageChange = (page) => {
  currentPage.value = page
  loadData()
}

// 查看详情
const handleView = async (row) => {
  console.log('查看纹样详情:', row)
  console.log('纹样数据结构:', {
    id: row.id,
    name: row.name,
    description: row.description,
    pattern_image: row.pattern_image,
    ai_file: row.ai_file,
    costume_name: row.costume_name,
    costume_id: row.costume_id,
    created_at: row.created_at,
    updated_at: row.updated_at
  })
  
  // 检查关键字段是否为空
  if (!row.description) {
    console.warn('纹样描述为空')
  }
  if (!row.pattern_image) {
    console.warn('纹样图片为空')
  }
  if (!row.costume_name) {
    console.warn('所属服饰名称为空')
  }
  
  // 如果没有costume_name但有costume_id，尝试获取服饰信息
  let patternData = { ...row }
  if (!row.costume_name && row.costume_id) {
    try {
      const costumeRes = await request.get(`/costumes/${row.costume_id}`)
      if (costumeRes && costumeRes.name) {
        patternData.costume_name = costumeRes.name
      }
    } catch (e) {
      console.error('获取服饰信息失败:', e)
    }
  }
  
  currentPattern.value = patternData
  detailVisible.value = true
}

// 编辑纹样
const handleEdit = (row) => {
  console.log('编辑纹样:', row)
  editDialogTitle.value = '编辑纹样'
  editPatternData.value = { ...row }
  editDialogVisible.value = true
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除纹样 "${row.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      // 修复删除纹样的URL，确保与后端API匹配
      await request.delete(`/costumes/${row.costume_id}/patterns/${row.id}`)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      console.error(e)
      ElMessage.error('删除失败')
    }
  })
}

// 预览图片
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

// 图片数据验证和格式化
const validateAndFormatImageSrc = (src) => {
  console.log('验证图片数据:', src?.substring(0, 100) + '...')
  
  if (!src) {
    console.log('图片数据为空')
    return null
  }
  
  // 如果已经是完整的URL或base64，直接返回
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
    console.log('图片数据已经是有效格式')
    return src
  }
  
  // 如果是纯 base64 数据，添加 data URL 前缀
  if (src.match(/^[A-Za-z0-9+/]+=*$/) && src.length > 10) {
    console.log('图片数据是base64格式，添加前缀')
    return `data:image/png;base64,${src}`
  }
  
  console.warn('未知的图片数据格式:', src.substring(0, 50))
  // 对于未知格式，返回null
  return null
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

// 图片加载成功处理
const handleImageLoad = () => {
  console.log('纹样图片加载成功')
}

// 图片加载失败处理
const handleImageError = (event) => {
  console.error('纹样图片加载失败:', event)
  ElMessage.error('图片加载失败')
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

// 下载纹样文件
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
        URL.revokeObjectURL(url)
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

// 编辑成功回调
const handleEditSuccess = () => {
  editDialogVisible.value = false
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.pattern-list {
  padding: 25px;
}

.search-card {
  margin-bottom: 25px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: none;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 25px;
}

.search-input {
  flex: 1;
  max-width: 450px;
}

.pattern-detail {
  padding: 25px 0;
}

.pattern-images {
  margin-top: 25px;
}

.image-preview {
  margin: 15px 0;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 350px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
}

.table-card {
  :deep(.el-table) {
    .el-button + .el-button {
      margin-left: 8px;
    }
  }
}

/* 操作按钮组样式 - 根据用户偏好规范 */
.action-buttons {
  display: flex;
  gap: 6px; /* 统一间距6px */
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap; /* 禁止换行 */
}

.action-buttons .el-button {
  width: 36px; /* 统一尺寸36x36像素 */
  height: 36px;
  padding: 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  margin: 0; /* 重置默认margin */
}

.action-buttons .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-buttons .el-button .el-icon {
  font-size: 16px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 25px;
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

/* 卡片样式 */
.info-card,
.image-card,
.file-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.info-card:hover,
.image-card:hover,
.file-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

/* 服饰标签样式 */
.costume-tag {
  font-size: 16px;
  padding: 10px 18px;
  border-radius: 20px;
  font-weight: 500;
}

/* 描述文本样式 */
.description-text {
  font-size: 16px;
  line-height: 1.5;
  color: #606266;
  min-height: 24px;
}

.empty-description {
  color: #909399;
  font-style: italic;
}

/* 纹样图片容器 */
.pattern-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 1;
}

/* 图片展示区域 */
.image-display {
  width: 100%;
  max-width: 400px; /* 调整最大宽度以适应 4:3 比例 */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  position: relative;
  z-index: 5;
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
  background-color: #fafafa;
  z-index: 10;
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
  z-index: 15;
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
  z-index: 20;
}

.image-preview-wrapper:hover .image-overlay {
  opacity: 1;
}

.preview-icon {
  font-size: 28px;
}

.image-info {
  text-align: center;
  z-index: 25;
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
  z-index: 5;
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
  z-index: 10;
}

/* 响应式设计 - 根据用户偏好规范 */
@media (max-width: 1200px) {
  .action-buttons .el-button {
    width: 32px;
    height: 32px;
  }
  
  .action-buttons .el-button .el-icon {
    font-size: 14px;
  }
  
  .pattern-detail-dialog {
    :deep(.el-dialog) {
      width: 90% !important;
      margin-top: 5vh;
    }
  }
  
  .image-preview-wrapper,
  .no-image-placeholder {
    max-width: 250px;
  }
  
  .pattern-image-container {
    gap: 15px;
  }
}

@media (max-width: 992px) {
  .pattern-detail {
    gap: 20px;
  }
  
  .card-title {
    font-size: 16px;
  }
  
  .costume-tag {
    font-size: 14px;
    padding: 8px 15px;
  }
  
  .description-text {
    font-size: 14px;
  }
  
  .image-preview-wrapper,
  .no-image-placeholder {
    max-width: 220px;
  }
  
  .image-size-text {
    font-size: 12px;
  }
  
  .preview-icon {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .search-input {
    max-width: none;
  }
  
  .action-buttons {
    gap: 4px;
  }
  
  .action-buttons .el-button {
    width: 30px;
    height: 30px;
  }
  
  .action-buttons .el-button .el-icon {
    font-size: 12px;
  }
  
  .pattern-detail-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 0;
      max-height: 100vh;
      border-radius: 0;
    }
    
    :deep(.el-dialog__body) {
      max-height: 80vh;
      padding: 20px;
    }
  }
  
  .pattern-detail {
    gap: 15px;
  }
  
  .image-preview-wrapper,
  .no-image-placeholder {
    max-width: 200px;
  }
  
  .placeholder-icon {
    font-size: 28px;
  }
  
  .download-btn {
    padding: 12px 24px;
    font-size: 15px;
  }
  
  .pattern-list {
    padding: 20px;
  }
  
  .search-card {
    margin-bottom: 20px;
  }
  
  .pagination-container {
    margin-top: 20px;
  }
}

@media (max-width: 480px) {
  .pattern-list {
    padding: 15px;
  }
  
  .action-buttons .el-button {
    width: 28px;
    height: 28px;
  }
  
  .action-buttons .el-button .el-icon {
    font-size: 11px;
  }
  
  .card-title {
    font-size: 14px;
  }
  
  .costume-tag {
    font-size: 12px;
    padding: 6px 12px;
  }
  
  .description-text {
    font-size: 12px;
  }
  
  .image-preview-wrapper,
  .no-image-placeholder {
    max-width: 180px;
  }
  
  .placeholder-icon {
    font-size: 24px;
  }
  
  .download-btn {
    padding: 10px 20px;
    font-size: 13px;
  }
  
  .preview-error {
    font-size: 14px;
    height: 150px;
  }
  
  .search-bar {
    gap: 12px;
  }
}
</style>