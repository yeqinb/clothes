<template>
  <div class="upload-file">
    <el-upload
      :show-file-list="false"
      :before-upload="beforeUpload"
      :http-request="handleUpload"
      :accept="accept"
      class="file-uploader"
    >
      <div class="upload-area" @click="triggerUpload">
        <div v-if="fileData" class="file-preview">
          <div class="file-info">
            <el-icon class="file-icon"><Document /></el-icon>
            <div class="file-details">
              <div class="file-name">{{ fileName || '已上传文件' }}</div>
              <div class="file-hint">点击替换文件</div>
            </div>
          </div>
        </div>
        <div v-else class="upload-placeholder">
          <el-icon class="upload-icon"><Upload /></el-icon>
          <div class="upload-text">上传文件</div>
          <div class="upload-hint">支持 {{ acceptText }} 格式</div>
          <div class="upload-size-hint">最大支持 {{ maxSize }}MB</div>
        </div>
      </div>
    </el-upload>
    
    <div v-if="fileData" class="file-actions">
      <el-tooltip content="下载文件" placement="top">
        <el-button size="small" @click="downloadFile">
          <el-icon><Download /></el-icon>下载
        </el-button>
      </el-tooltip>
      <el-tooltip content="验证文件完整性" placement="top">
        <el-button size="small" type="info" @click="validateFileData">
          <el-icon><Document /></el-icon>验证
        </el-button>
      </el-tooltip>
      <el-tooltip content="删除文件" placement="top">
        <el-button size="small" type="danger" @click="removeFile">
          <el-icon><Delete /></el-icon>删除
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Document, Download, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  value: {
    type: String,
    default: ''
  },
  accept: {
    type: String,
    default: '.ai,.eps,.pdf'
  },
  maxSize: {
    type: Number,
    default: 100 // MB - 调整为100MB以支持大型AI文件
  }
})

const emit = defineEmits(['update', 'update:value'])

const fileData = ref(props.value)
const fileName = ref('')

// 计算 accept 文本
const acceptText = computed(() => {
  if (!props.accept) return '所有'
  return props.accept.replace(/\./g, '').replace(/,/g, '、').toUpperCase()
})

// 监听 props 变化
watch(() => props.value, (newValue) => {
  fileData.value = newValue
}, { immediate: true })

// 监听 fileData 变化，向父组件发送更新
watch(fileData, (newValue) => {
  emit('update', newValue)
  emit('update:value', newValue)
})

// 上传前验证
const beforeUpload = (file) => {
  // 检查文件类型
  if (props.accept) {
    const acceptTypes = props.accept.split(',')
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    const isValidType = acceptTypes.some(type => type.trim() === fileExtension)
    
    if (!isValidType) {
      ElMessage.error(`上传文件只能是 ${acceptText.value} 格式!`)
      return false
    }
  }
  
  // 检查文件大小
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize
  if (!isLtMaxSize) {
    ElMessage.error(`上传文件大小不能超过 ${props.maxSize}MB!`)
    return false
  }
  
  return true
}

// 处理文件上传
const handleUpload = ({ file }) => {
  // 保存原始文件名（包括扩展名）
  fileName.value = file.name
  
  // 对于AI文件等二进制文件，使用更可靠的ArrayBuffer处理方式
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const arrayBuffer = e.target.result
      
      // 使用更高效的方式转换ArrayBuffer到base64
      const bytes = new Uint8Array(arrayBuffer)
      const chunkSize = 0x8000 // 32KB chunks to avoid call stack issues
      let binary = ''
      
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize)
        binary += String.fromCharCode.apply(null, chunk)
      }
      
      const base64 = btoa(binary)
      
      // 设置正确的MIME类型
      let mimeType = 'application/octet-stream'
      const ext = file.name.split('.').pop().toLowerCase()
      
      switch(ext) {
        case 'ai':
          mimeType = 'application/illustrator' // 更准确的AI文件MIME类型
          break
        case 'eps':
          mimeType = 'application/postscript'
          break
        case 'pdf':
          mimeType = 'application/pdf'
          break
      }
      
      fileData.value = `data:${mimeType};base64,${base64}`
      
      // 验证文件完整性
      const originalSize = file.size
      const base64Size = Math.ceil(originalSize * 4 / 3) // base64编码后约为原文件的4/3
      const actualBase64Size = base64.length
      
      console.log('文件处理信息:', {
        原始文件名: file.name,
        原始大小: originalSize,
        期望base64大小: base64Size,
        实际base64大小: actualBase64Size,
        完整性: Math.abs(actualBase64Size - base64Size) / base64Size < 0.1 ? '良好' : '可能有问题'
      })
      
      ElMessage.success('文件上传成功')
    } catch (error) {
      console.error('文件处理失败:', error)
      ElMessage.error('文件处理失败: ' + error.message)
    }
  }
  
  reader.onerror = (error) => {
    console.error('文件读取失败:', error)
    ElMessage.error('文件读取失败')
  }
  
  // 使用ArrayBuffer读取文件以保持二进制完整性
  reader.readAsArrayBuffer(file)
}

// 触发上传
const triggerUpload = () => {
  // 由 el-upload 组件处理
}

// 下载文件
const downloadFile = () => {
  if (!fileData.value) {
    ElMessage.warning('文件数据为空')
    return
  }
  
  try {
    // 验证base64数据格式
    if (!fileData.value.startsWith('data:')) {
      ElMessage.error('文件数据格式错误')
      return
    }
    
    // 确保文件名有正确的扩展名
    let downloadFileName = fileName.value || 'file'
    
    // 如果文件名没有扩展名，根据accept属性添加默认扩展名
    if (!downloadFileName.includes('.')) {
      if (props.accept.includes('.ai')) {
        downloadFileName += '.ai'
      } else if (props.accept.includes('.eps')) {
        downloadFileName += '.eps'
      } else if (props.accept.includes('.pdf')) {
        downloadFileName += '.pdf'
      } else {
        // 使用第一个允许的扩展名
        const firstExt = props.accept.split(',')[0].trim()
        downloadFileName += firstExt
      }
    }
    
    // 使用Blob对象来确保文件完整性
    const base64Data = fileData.value.split(',')[1]
    const mimeType = fileData.value.split(';')[0].split(':')[1]
    
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
    
    // 添加下载事件监听
    link.addEventListener('click', () => {
      console.log('开始下载文件:', downloadFileName)
      console.log('文件大小:', blob.size, 'bytes')
      console.log('MIME类型:', mimeType)
    })
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理URL对象
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
    
    ElMessage.success('文件下载开始')
    
    // 添加详细的调试信息
    console.log('下载文件信息:', {
      fileName: downloadFileName,
      mimeType: mimeType,
      blobSize: blob.size,
      base64Size: base64Data.length,
      原始文件名: fileName.value
    })
    
  } catch (e) {
    console.error('下载失败:', e)
    ElMessage.error('文件下载失败: ' + e.message)
  }
}

// 删除文件
const removeFile = () => {
  fileData.value = ''
  fileName.value = ''
  ElMessage.success('文件已删除')
}

// 验证文件数据完整性
const validateFileData = () => {
  if (!fileData.value) {
    ElMessage.warning('没有文件数据')
    return false
  }
  
  try {
    // 验证base64格式
    if (!fileData.value.startsWith('data:')) {
      ElMessage.error('文件数据格式错误')
      return false
    }
    
    // 提取base64数据部分
    const base64Data = fileData.value.split(',')[1]
    if (!base64Data) {
      ElMessage.error('缺少base64数据')
      return false
    }
    
    // 验证base64格式
    let binaryData
    try {
      binaryData = atob(base64Data)
    } catch (e) {
      ElMessage.error('无效的base64数据')
      return false
    }
    
    // 验证文件头信息
    const mimeType = fileData.value.split(';')[0].split(':')[1]
    const bytes = new Uint8Array(binaryData.length)
    for (let i = 0; i < Math.min(4, binaryData.length); i++) {
      bytes[i] = binaryData.charCodeAt(i)
    }
    
    // 检查AI文件的文件头
    if (mimeType.includes('illustrator') || fileName.value.endsWith('.ai')) {
      // AI文件通常以%PDF开头（因为AI文件实际上是PDF格式的变体）
      const header = String.fromCharCode(...bytes.slice(0, 4))
      if (!header.startsWith('%PDF') && !header.startsWith('%!PS')) {
        console.warn('AI文件头验证警告:', header)
        ElMessage.warning('文件可能不是有效的AI格式，但数据完整')
      }
    }
    
    // 计算文件大小信息
    const fileSizeKB = Math.round(binaryData.length / 1024 * 100) / 100
    const base64SizeKB = Math.round(base64Data.length / 1024 * 100) / 100
    
    console.log('文件验证详情:', {
      文件名: fileName.value,
      MIME类型: mimeType,
      二进制大小: fileSizeKB + 'KB',
      base64大小: base64SizeKB + 'KB',
      数据完整性: '正常'
    })
    
    ElMessage.success(`文件数据验证通过 (${fileSizeKB}KB)`)
    return true
  } catch (e) {
    console.error('文件验证失败:', e)
    ElMessage.error('文件验证失败: ' + e.message)
    return false
  }
}
</script>

<style scoped>
.upload-file {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.file-uploader {
  width: 100%;
}

:deep(.el-upload) {
  width: 100%;
  border: none;
}

.upload-area {
  position: relative;
  width: 100%;
  min-height: 120px;
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c939d;
  text-align: center;
  padding: 20px;
}

.upload-icon {
  font-size: 32px;
  margin-bottom: 16px;
  color: #409eff;
}

.upload-text {
  font-size: 16px;
  margin-bottom: 8px;
  font-weight: 500;
}

.upload-hint {
  font-size: 14px;
  color: #c0c4cc;
}

.upload-size-hint {
  font-size: 14px;
  color: #409eff;
  margin-top: 4px;
  font-weight: 500;
}

.file-preview {
  width: 100%;
  padding: 20px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.file-icon {
  font-size: 36px;
  color: #409eff;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
  margin-bottom: 6px;
  word-break: break-all;
}

.file-hint {
  font-size: 14px;
  color: #909399;
}

.file-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
}

.file-actions .el-button {
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.file-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-file {
    max-width: 400px;
  }
  
  .upload-area {
    min-height: 110px;
    border-radius: 10px;
  }
  
  .upload-icon {
    font-size: 28px;
    margin-bottom: 14px;
  }
  
  .upload-text {
    font-size: 15px;
  }
  
  .upload-hint,
  .upload-size-hint {
    font-size: 13px;
  }
  
  .file-icon {
    font-size: 32px;
  }
  
  .file-name {
    font-size: 15px;
  }
  
  .file-hint {
    font-size: 13px;
  }
  
  .file-actions {
    flex-direction: column;
    gap: 10px;
    margin-top: 14px;
  }
  
  .file-actions .el-button {
    width: 100%;
  }
  
  .file-info {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .upload-file {
    max-width: 350px;
  }
  
  .upload-area {
    min-height: 100px;
    border-radius: 8px;
    padding: 15px;
  }
  
  .upload-icon {
    font-size: 24px;
    margin-bottom: 12px;
  }
  
  .upload-text {
    font-size: 14px;
  }
  
  .upload-hint,
  .upload-size-hint {
    font-size: 12px;
  }
  
  .file-icon {
    font-size: 28px;
  }
  
  .file-name {
    font-size: 14px;
  }
  
  .file-hint {
    font-size: 12px;
  }
  
  .file-actions {
    gap: 8px;
    margin-top: 12px;
  }
}
</style>
