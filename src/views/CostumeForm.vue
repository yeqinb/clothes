<template>
  <div class="costume-form">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="服饰名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入服饰名称" />
      </el-form-item>
      
      <el-form-item label="民族" prop="ethnicity">
        <el-input v-model="form.ethnicity" placeholder="请输入民族" />
      </el-form-item>
      
      <el-form-item label="链接" prop="link">
        <el-input v-model="form.link" placeholder="请输入相关链接" />
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入服饰描述"
        />
      </el-form-item>

      <!-- 图片上传 -->
      <div class="image-uploads">
        <el-form-item label="颜色图表">
          <UploadImage 
            :value="form.color_diagram" 
            @update="(val) => form.color_diagram = val"
            :preview="true"
          />
        </el-form-item>
        
        <el-form-item label="尺寸图表">
          <UploadImage 
            :value="form.size_diagram" 
            @update="(val) => form.size_diagram = val"
            :preview="true"
          />
        </el-form-item>
        
        <el-form-item label="原始图片">
          <UploadImage 
            :value="form.original_image" 
            @update="(val) => form.original_image = val"
            :preview="true"
          />
        </el-form-item>
        
        <el-form-item label="模糊图片">
          <UploadImage 
            :value="form.blurred_image" 
            @update="(val) => form.blurred_image = val"
            :preview="true"
          />
        </el-form-item>
        
        <el-form-item label="摘要图片">
          <UploadImage 
            :value="form.summary_image" 
            @update="(val) => form.summary_image = val"
            :preview="true"
          />
        </el-form-item>
      </div>

      <!-- AI文件上传 -->
      <div class="file-uploads">
        <el-form-item label="颜色AI文件">
          <UploadFile 
            :value="form.color_diagram_ai" 
            @update="(val) => form.color_diagram_ai = val"
            accept=".ai,.eps,.pdf"
            :max-size="200"
          />
        </el-form-item>
        
        <el-form-item label="尺寸AI文件">
          <UploadFile 
            :value="form.size_diagram_ai" 
            @update="(val) => form.size_diagram_ai = val"
            accept=".ai,.eps,.pdf"
            :max-size="200"
          />
        </el-form-item>
        
        <el-form-item label="原始AI文件">
          <UploadFile 
            :value="form.original_image_ai" 
            @update="(val) => form.original_image_ai = val"
            accept=".ai,.eps,.pdf"
            :max-size="200"
          />
        </el-form-item>
        
        <el-form-item label="摘要AI文件">
          <UploadFile 
            :value="form.summary_image_ai" 
            @update="(val) => form.summary_image_ai = val"
            accept=".ai,.eps,.pdf"
            :max-size="200"
          />
        </el-form-item>
      </div>
      
      <el-form-item>
        <el-tooltip :content="isEdit ? '更新服饰信息' : '创建新服饰'" placement="top">
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </el-tooltip>
        <el-tooltip content="取消操作" placement="top">
          <el-button @click="handleCancel">取消</el-button>
        </el-tooltip>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/api/request'
import UploadImage from '@/components/UploadImage.vue'
import UploadFile from '@/components/UploadFile.vue'

const props = defineProps({
  costumeId: {
    type: [String, Number],
    default: null
  },
  initialData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['success', 'cancel'])

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const loading = ref(false)

// 计算属性
const isEdit = computed(() => {
  return !!(props.costumeId || route.params.id)
})

const currentId = computed(() => {
  return props.costumeId || route.params.id
})

// 表单数据
const form = reactive({
  name: '',
  ethnicity: '',
  link: '',
  description: '',
  color_diagram: '',
  size_diagram: '',
  original_image: '',
  blurred_image: '',
  summary_image: '',
  color_diagram_ai: '',
  size_diagram_ai: '',
  original_image_ai: '',
  summary_image_ai: ''
})

// 验证规则
const rules = {
  name: [
    { required: true, message: '请输入服饰名称', trigger: 'blur' }
  ]
}

// 初始化表单数据
const initForm = (data = {}) => {
  Object.keys(form).forEach(key => {
    form[key] = data[key] || ''
  })
}

// 监听 props 变化
watch(() => props.initialData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    initForm(newData)
  }
}, { immediate: true, deep: true })

// 加载数据（用于编辑模式）
const loadData = async () => {
  if (!currentId.value) return
  
  try {
    const data = await request.get(`/costumes/${currentId.value}`)
    initForm(data)
  } catch (e) {
    console.error('加载数据失败:', e)
    ElMessage.error('加载数据失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      const data = { ...form }
      
      if (isEdit.value) {
        await request.put(`/costumes/${currentId.value}`, data)
        ElMessage.success('更新成功')
      } else {
        await request.post('/costume', data)
        ElMessage.success('创建成功')
      }
      
      emit('success')
      
      // 如果不是在弹窗中，则跳转到列表页
if (!props.costumeId) {
        router.push('/costumes')
      }
    } catch (e) {
      console.error('提交失败:', e)
      ElMessage.error('提交失败: ' + (e.response?.data?.message || e.message))
    } finally {
      loading.value = false
    }
  })
}

// 取消
const handleCancel = () => {
  emit('cancel')
  
  // 如果不是在弹窗中，则跳转到列表页
  if (!props.costumeId) {
    router.push('/costumes')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  if (isEdit.value && !props.initialData) {
    loadData()
  }
})
</script>

<style scoped>
.costume-form {
  padding: 20px;
}

.image-uploads {
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
  margin-top: 20px;
}

.file-uploads {
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
  margin-top: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-upload) {
  width: 100%;
}
</style>