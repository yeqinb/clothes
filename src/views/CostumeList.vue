<template>
  <div class="costume-list">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <div class="search-bar">
        <el-tooltip content="新增服饰" placement="top">
          <el-button type="primary" size="default" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增服饰
          </el-button>
        </el-tooltip>
        <div class="search-input">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入服饰名称或民族"
            clearable
            size="default"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-tooltip content="搜索服饰" placement="top">
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
        :empty-text="emptyText"
        size="default"
      >
        <el-table-column prop="id" label="ID" width="100" align="center" />
        <el-table-column prop="name" label="服饰名称" min-width="250" />
        <el-table-column prop="ethnicity" label="民族" width="150" />
        <el-table-column prop="link" label="链接" width="250">
          <template #default="{ row }">
            <el-link
              v-if="row.link"
              :href="row.link"
              target="_blank"
              type="primary"
            >
              {{ formatLink(row.link) }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip content="查看详情" placement="top">
                <el-button size="small" type="primary" @click="handleView(row)">
                  <el-icon><View /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="编辑服饰" placement="top">
                <el-button size="small" type="warning" @click="handleEdit(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除服饰" placement="top">
                <el-button size="small" type="danger" @click="handleDelete(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container" v-if="total > pageSize">
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, View, Edit, Delete } from '@element-plus/icons-vue'
import request from '@/api/request'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')

// 空状态文本
const emptyText = computed(() => {
  if (loading.value) return '加载中...'
  if (searchKeyword.value) return '没有找到匹配的服饰'
  return '暂无服饰数据'
})

// 加载数据
const loadData = async () => {
  // 检查认证
  const token = localStorage.getItem('auth')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  loading.value = true
  try {
    console.log('开始请求服饰列表...')
    
    const params = {}
    if (searchKeyword.value?.trim()) {
      params.search = searchKeyword.value.trim()
    }
    
    const res = await request.get('/costumes', { params })
    console.log('收到响应:', res)
    
    // 处理不同格式的响应
    if (Array.isArray(res)) {
      tableData.value = res
      total.value = res.length
      console.log('处理为数组格式:', res.length, '条数据')
    } else if (res && typeof res === 'object') {
      if (Array.isArray(res.data)) {
        tableData.value = res.data
        total.value = res.total || res.data.length
        console.log('处理为 data 格式:', res.data.length, '条数据')
      } else if (Array.isArray(res.items)) {
        tableData.value = res.items
        total.value = res.total || res.items.length
        console.log('处理为 items 格式:', res.items.length, '条数据')
      } else if (Object.keys(res).length > 0) {
        tableData.value = [res]
        total.value = 1
        console.log('处理为单对象格式')
      } else {
        tableData.value = []
        total.value = 0
        console.log('空响应')
      }
    } else {
      tableData.value = []
      total.value = 0
      console.log('无效响应格式')
    }
    
    console.log('最终表格数据:', tableData.value)
  } catch (e) {
    console.error('加载数据失败:', e)
    ElMessage.error('加载数据失败: ' + (e.message || '未知错误'))
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadData()
}

const handleAdd = () => {
  router.push('/costumes/create')
}

const handleView = (row) => {
  router.push(`/costumes/${row.id}`)
}

const handleEdit = (row) => {
  router.push(`/costumes/${row.id}/edit`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除服饰 "${row.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await request.delete(`/costumes/${row.id}`)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      console.error(e)
      ElMessage.error('删除失败: ' + (e.message || '未知错误'))
    }
  }).catch(() => {
    // 用户取消删除
  })
}

const formatLink = (link) => {
  if (!link) return '-'
  try {
    const url = new URL(link)
    return url.hostname + url.pathname
  } catch {
    return link.length > 30 ? link.substring(0, 30) + '...' : link
  }
}

onMounted(() => {
  console.log('服饰列表组件挂载')
  loadData()
})
</script>

<style scoped>
.costume-list {
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
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 350px;
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

/* 响应式设计 - 更多适配点 */
@media (max-width: 1200px) {
  .action-buttons .el-button {
    width: 32px;
    height: 32px;
  }
  
  .action-buttons .el-button .el-icon {
    font-size: 14px;
  }
  
  .search-input {
    min-width: 300px;
  }
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .search-input {
    min-width: auto;
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
  
  .costume-list {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .costume-list {
    padding: 15px;
  }
  
  .action-buttons .el-button {
    width: 28px;
    height: 28px;
  }
  
  .action-buttons .el-button .el-icon {
    font-size: 11px;
  }
  
  .search-bar {
    gap: 12px;
  }
}
</style>