<template>
  <div class="upload-image">
    <el-upload
      :show-file-list="false"
      :before-upload="beforeUpload"
      :http-request="handleUpload"
      accept="image/*"
      class="image-uploader"
    >
      <div class="upload-area" @click="triggerUpload">
        <div v-if="imageUrl" class="image-preview">
          <img :src="imageUrl" alt="预览图片" />
          <div class="image-overlay">
            <el-icon class="upload-icon"><Picture /></el-icon>
            <span>点击替换图片</span>
          </div>
        </div>
        <div v-else class="upload-placeholder">
          <el-icon class="upload-icon"><Plus /></el-icon>
          <div class="upload-text">上传图片</div>
          <div class="upload-hint">支持 JPG、PNG 格式</div>
          <div class="upload-ratio">建议尺寸 4:3 (如 400x300)</div>
        </div>
      </div>
    </el-upload>
    
    <div v-if="imageUrl" class="image-actions">
      <el-tooltip content="预览图片" placement="top">
        <el-button size="small" @click="previewImage">
          <el-icon><View /></el-icon>预览
        </el-button>
      </el-tooltip>
      <el-tooltip content="删除图片" placement="top">
        <el-button size="small" type="danger" @click="removeImage">
          <el-icon><Delete /></el-icon>删除
        </el-button>
      </el-tooltip>
    </div>

    <!-- 图片预览弹窗 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="600px">
      <img :src="imageUrl" style="width: 100%; border-radius: 4px;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Picture, View, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  value: {
    type: String,
    default: ''
  },
  preview: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update', 'update:value'])

const imageUrl = ref(props.value)
const previewVisible = ref(false)

// 监听 props 变化
watch(() => props.value, (newValue) => {
  imageUrl.value = newValue
}, { immediate: true })

// 监听 imageUrl 变化，向父组件发送更新
watch(imageUrl, (newValue) => {
  emit('update', newValue)
  emit('update:value', newValue)
})

// 上传前验证
const beforeUpload = (file) => {
  const isImage = /^image\//i.test(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('上传文件只能是图片格式!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('上传图片大小不能超过 5MB!')
    return false
  }
  
  // 验证图片尺寸比例
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const width = img.width
        const height = img.height
        const ratio = width / height
        
        // 检查长宽比例是否接近 4:3 (1.33)
        if (Math.abs(ratio - 1.33) > 0.1) {
          ElMessage.warning('建议上传长宽比例为 4:3 的图片以获得最佳显示效果')
        }
        resolve(true)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// 处理文件上传
const handleUpload = ({ file }) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    imageUrl.value = e.target.result
    ElMessage.success('图片上传成功')
  }
  reader.readAsDataURL(file)
}

// 触发上传
const triggerUpload = () => {
  // 由 el-upload 组件处理
}

// 预览图片
const previewImage = () => {
  if (props.preview && imageUrl.value) {
    previewVisible.value = true
  }
}

// 删除图片
const removeImage = () => {
  imageUrl.value = ''
  ElMessage.success('图片已删除')
}
</script>

<style scoped>
.upload-image {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  position: relative;
  z-index: 10;
}

.image-uploader {
  width: 100%;
  position: relative;
  z-index: 5;
}

:deep(.el-upload) {
  width: 100%;
  border: none;
}

.upload-area {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 75%; /* 4:3 比例 (3/4 * 100%) */
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
  background-color: #fafafa;
  z-index: 1;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c939d;
  z-index: 2;
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
  margin-bottom: 4px;
}

.upload-ratio {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}

.image-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
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
  transition: opacity 0.3s;
  z-index: 4;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.image-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
  position: relative;
  z-index: 10;
}

.image-actions .el-button {
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.image-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-image {
    max-width: 400px;
  }
  
  .upload-icon {
    font-size: 28px;
  }
  
  .upload-text {
    font-size: 15px;
  }
  
  .upload-hint,
  .upload-ratio {
    font-size: 13px;
  }
  
  .image-actions {
    gap: 10px;
    margin-top: 14px;
  }
}

@media (max-width: 480px) {
  .upload-image {
    max-width: 350px;
  }
  
  .upload-area {
    border-radius: 10px;
  }
  
  .upload-icon {
    font-size: 24px;
    margin-bottom: 14px;
  }
  
  .upload-text {
    font-size: 14px;
    margin-bottom: 6px;
  }
  
  .upload-hint,
  .upload-ratio {
    font-size: 12px;
  }
  
  .image-actions {
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }
  
  .image-actions .el-button {
    width: 100%;
  }
}
</style>