<template>
  <div class="image-debugger">
    <h4>图片调试工具</h4>
    
    <!-- 测试base64图片 -->
    <div class="test-section">
      <h5>测试Base64图片</h5>
      <div class="test-image-container">
        <img 
          :src="testBase64Image" 
          alt="测试图片"
          class="test-image"
          @load="onTestImageLoad"
          @error="onTestImageError"
        />
      </div>
      <p>如果这个测试图片能显示，说明浏览器支持base64图片。</p>
    </div>
    
    <!-- 显示传入的图片数据信息 -->
    <div v-if="imageData" class="image-data-section">
      <h5>图片数据分析</h5>
      <div class="data-info">
        <p><strong>数据长度:</strong> {{ imageData.length }}</p>
        <p><strong>数据类型:</strong> {{ getImageDataType(imageData) }}</p>
        <p><strong>前50个字符:</strong> {{ imageData.substring(0, 50) }}...</p>
      </div>
      
      <!-- 显示实际图片 -->
      <div class="actual-image-container">
        <h6>实际图片显示:</h6>
        <img 
          :src="formatImageData(imageData)" 
          alt="实际图片"
          class="actual-image"
          @load="onActualImageLoad"
          @error="onActualImageError"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  imageData: {
    type: String,
    default: ''
  }
})

// 一个简单的1x1像素透明PNG图片的base64数据
const testBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const getImageDataType = (data) => {
  if (!data) return '无数据'
  if (data.startsWith('data:image/')) return 'Base64 Data URL'
  if (data.startsWith('data:')) return 'Data URL (非图片)'
  if (data.startsWith('http://') || data.startsWith('https://')) return 'HTTP URL'
  if (data.match(/^[A-Za-z0-9+/]+=*$/)) return '纯Base64数据'
  return '未知格式'
}

const formatImageData = (data) => {
  if (!data) return ''
  
  // 如果已经是完整的data URL，直接返回
  if (data.startsWith('data:')) return data
  
  // 如果是HTTP URL，直接返回
  if (data.startsWith('http')) return data
  
  // 如果是纯base64，添加data URL前缀
  if (data.match(/^[A-Za-z0-9+/]+=*$/)) {
    return `data:image/png;base64,${data}`
  }
  
  return data
}

const onTestImageLoad = () => {
  console.log('测试图片加载成功')
  ElMessage.success('测试图片加载成功，浏览器支持base64图片')
}

const onTestImageError = (event) => {
  console.error('测试图片加载失败:', event)
  ElMessage.error('测试图片加载失败')
}

const onActualImageLoad = () => {
  console.log('实际图片加载成功')
  ElMessage.success('实际图片加载成功')
}

const onActualImageError = (event) => {
  console.error('实际图片加载失败:', event)
  ElMessage.error('实际图片加载失败，数据格式可能有问题')
}
</script>

<style scoped>
.image-debugger {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  background: #fafafa;
}

.test-section,
.image-data-section {
  margin-bottom: 20px;
}

.test-image-container,
.actual-image-container {
  border: 1px solid #ddd;
  padding: 10px;
  background: white;
  border-radius: 4px;
  margin: 10px 0;
}

.test-image,
.actual-image {
  max-width: 200px;
  max-height: 200px;
  border: 1px solid #ccc;
}

.data-info {
  background: white;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.data-info p {
  margin: 5px 0;
}

h4, h5, h6 {
  margin: 10px 0;
  color: #303133;
}
</style>