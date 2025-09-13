<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>服饰纹样管理系统</h2>
        <p>请登录您的账户</p>
      </div>
      
      <el-form
        :model="loginForm"
        :rules="loginRules"
        ref="loginFormRef"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-tooltip content="登录系统" placement="top">
            <el-button
              type="primary"
              class="login-button"
              :loading="loading"
              @click="handleLogin"
              native-type="submit"
            >
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-tooltip>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import request from '@/api/request'

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    const username = loginForm.username?.trim()
    const password = loginForm.password?.trim()
    
    if (!username || !password) {
      ElMessage.error('用户名和密码不能为空')
      return
    }
    
    loading.value = true
      try {
    const credentials = btoa(`${username}:${password}`)
    await request.post('/login', {}, {
      headers: { 'Authorization': `Basic ${credentials}` }
    })
    
    // 使用 store 保存认证信息
    authStore.setToken(credentials)
    router.push('/costumes')
    ElMessage.success('登录成功')
  } catch (e) {
      console.error('登录失败:', e)
      ElMessage.error(e.response?.data?.message || '登录失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #42b983 0%, #409eff 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 30px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(66, 185, 131, 0.3);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #409eff, #42b983);
}

.login-header {
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
}

.login-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.login-form {
  margin-top: 20px;
}

.login-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  margin-top: 10px;
  background: linear-gradient(135deg, #409eff 0%, #42b983 100%);
  border: none;
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(64, 158, 255, 0.3);
}

.login-button:active {
  transform: translateY(0);
}
</style>