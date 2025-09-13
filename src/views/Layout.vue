<template>
  <div class="layout-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-content">
        <h1 class="title">服饰纹样管理系统</h1>
        <div class="user-info">
          <span>欢迎使用</span>
          <el-tooltip content="退出系统" placement="bottom">
            <el-button type="danger" size="default" @click="handleLogout">
              退出登录
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </header>

    <div class="container-wrapper">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <el-menu
          :default-active="activeMenu"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/costumes">
            <el-icon><List /></el-icon>
            <span>服饰管理</span>
          </el-menu-item>
          <el-menu-item index="/patterns">
            <el-icon><Picture /></el-icon>
            <span>纹样管理</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <!-- 主内容区域 -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { List, Picture } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 检查用户是否已登录
onMounted(() => {
  const token = localStorage.getItem('auth')
  if (!token) {
    // 如果没有认证信息，重定向到登录页面
    router.push('/login')
  }
})

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('auth')
    localStorage.removeItem('token')
    router.push('/login')
    ElMessage.success('已退出登录')
  }).catch(() => {
    // 用户取消
  })
}
</script>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  background: linear-gradient(135deg, #409eff 0%, #1a7cff 100%);
  border-bottom: 1px solid #e4e7ed;
  z-index: 1000;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 65px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
  height: 100%;
}

.title {
  margin: 0;
  font-size: 24px;
  color: #fff;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
  color: #fff;
}

.user-info span {
  font-size: 16px;
  font-weight: 500;
}

.container-wrapper {
  display: flex;
  flex: 1;
  margin-top: 65px;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 65px;
  bottom: 0;
  width: 280px; /* 基础宽度280px */
  background: #fff;
  border-right: 1px solid #e4e7ed;
  z-index: 999;
  transition: width 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.sidebar-menu {
  border: none;
  height: 100%;
}

.sidebar-menu :deep(.el-menu-item) {
  transition: all 0.3s ease;
  border-radius: 6px;
  margin: 6px 10px;
  font-size: 16px;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: #ecf5ff;
  transform: translateX(4px);
  color: #409eff;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #ecf5ff;
  color: #409eff;
  font-weight: 600;
}

.main-content {
  flex: 1;
  margin-left: 280px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7f4 100%);
  padding: 25px;
  transition: margin-left 0.3s ease;
  height: calc(100vh - 65px);
  overflow: auto;
}

/* 响应式设计 - 更多适配点 */
@media (max-width: 1200px) {
  .sidebar {
    width: 220px; /* 最小可缩至220px */
  }
  
  .main-content {
    margin-left: 220px;
  }
  
  .title {
    font-size: 22px;
  }
}

@media (max-width: 992px) {
  .sidebar {
    width: 70px; /* 折叠为小宽度 */
  }
  
  .main-content {
    margin-left: 70px;
  }
  
  .sidebar-menu :deep(.el-menu-item span) {
    display: none; /* 隐藏文字 */
  }
  
  .header-content {
    padding: 0 20px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 0; /* 移动设备上隐藏侧边栏 */
    transform: translateX(-100%);
  }
  
  .main-content {
    margin-left: 0; /* 单列布局 */
    padding: 20px;
  }
  
  .header-content {
    padding: 0 20px;
  }
  
  .title {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 15px;
  }
  
  .header-content {
    padding: 0 15px;
  }
  
  .title {
    font-size: 18px;
  }
  
  .user-info {
    gap: 15px;
  }
  
  .user-info span {
    font-size: 14px;
  }
}
</style>