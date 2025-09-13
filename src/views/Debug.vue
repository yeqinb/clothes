<template>
  <div class="debug-container">
    <h2>API 调试页面</h2>
    
    <div class="debug-section">
      <el-tooltip content="检查用户认证状态" placement="top">
        <el-button @click="testAuth" type="primary">1. 测试认证</el-button>
      </el-tooltip>
      <el-tooltip content="获取服饰列表数据" placement="top">
        <el-button @click="testCostumes" type="success">2. 测试获取服饰列表</el-button>
      </el-tooltip>
      <el-tooltip content="清空所有调试结果" placement="top">
        <el-button @click="clearAll" type="warning">清空结果</el-button>
      </el-tooltip>
    </div>
    
    <div class="result-section">
      <h3>认证状态:</h3>
      <pre>{{ authStatus }}</pre>
      
      <h3>服饰列表响应:</h3>
      <pre>{{ costumesResponse }}</pre>
      
      <h3>解析后的表格数据:</h3>
      <pre>{{ tableData }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '@/api/request'

const authStatus = ref('未测试')
const costumesResponse = ref('未测试')
const tableData = ref([])

const testAuth = async () => {
  try {
    const token = localStorage.getItem('auth')
    if (token) {
      authStatus.value = `已认证: ${token.substring(0, 20)}...`
    } else {
      authStatus.value = '未认证'
    }
  } catch (e) {
    authStatus.value = `错误: ${e.message}`
  }
}

const testCostumes = async () => {
  try {
    authStatus.value = '正在请求...'
    const response = await request.get('/costumes')
    
    costumesResponse.value = JSON.stringify(response, null, 2)
    
    // 尝试解析数据
    let parsedData = []
    if (Array.isArray(response)) {
      parsedData = response
    } else if (response && typeof response === 'object') {
      if (Array.isArray(response.data)) {
        parsedData = response.data
      } else if (Array.isArray(response.items)) {
        parsedData = response.items
      }
    }
    
    tableData.value = JSON.stringify(parsedData, null, 2)
    authStatus.value = '请求成功'
    
    console.log('原始响应:', response)
    console.log('解析数据:', parsedData)
  } catch (e) {
    costumesResponse.value = `错误: ${e.message}`
    tableData.value = '解析失败'
    authStatus.value = `请求失败: ${e.message}`
    console.error('请求错误:', e)
  }
}

const clearAll = () => {
  authStatus.value = '已清空'
  costumesResponse.value = '已清空'
  tableData.value = []
}
</script>

<style scoped>
.debug-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.debug-section {
  margin-bottom: 30px;
}

.debug-section .el-button {
  margin-right: 10px;
  margin-bottom: 10px;
}

.result-section {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 4px;
}

.result-section h3 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #333;
}

pre {
  background: white;
  padding: 15px;
  border-radius: 4px;
  overflow: auto;
  max-height: 300px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>