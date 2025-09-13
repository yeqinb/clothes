<template>
  <div class="pattern-form-container">
    <el-form
      :model="form"
      :rules="rules"
      ref="formRef"
      label-width="100px"
      class="pattern-form"
    >
      <div class="form-content">
        <!-- 纹样名称 -->
        <div class="form-item">
          <el-form-item label="纹样名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入纹样名称" />
          </el-form-item>
        </div>
        
        <!-- 描述 -->
        <div class="form-item">
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="6"
              placeholder="请输入纹样描述"
            />
          </el-form-item>
        </div>
        
        <!-- 纹样图片 -->
        <div class="form-item">
          <el-form-item label="纹样图片">
            <div class="image-upload-container">
              <div class="image-upload-wrapper">
                <UploadImage 
                  :value="form.pattern_image" 
                  @update="(val) => form.pattern_image = val"
                  :preview="true"
                />
              </div>
              <el-alert
                type="info"
                :closable="false"
                class="ratio-alert image-ratio-guide"
              >
                <template #default>
                  <div class="ratio-info">
                    <el-icon><InfoFilled /></el-icon>
                    <span>建议上传4:3比例的图片以获得最佳显示效果</span>
                  </div>
                </template>
              </el-alert>
            </div>
          </el-form-item>
        </div>
        
        <!-- AI文件 -->
        <div class="form-item">
          <el-form-item label="AI文件">
            <UploadFile 
              :value="form.ai_file" 
              @update="(val) => form.ai_file = val"
              accept=".ai,.eps,.pdf"
              :max-size="200"
            />
          </el-form-item>
        </div>
      </div>
      
      <div class="form-actions">
        <el-tooltip content="保存纹样信息" placement="top">
          <el-button type="primary" @click="submitForm">保存</el-button>
        </el-tooltip>
        <el-tooltip content="取消操作" placement="top">
          <el-button @click="$emit('cancel')">取消</el-button>
        </el-tooltip>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import request from '@/api/request'
import UploadImage from '@/components/UploadImage.vue'
import UploadFile from '@/components/UploadFile.vue'

const props = defineProps({
  costumeId: Number,
  patternId: Number,
  initialData: Object
})

const emit = defineEmits(['success', 'cancel'])

const formRef = ref(null)

const form = reactive({
  name: '',
  description: '',
  pattern_image: '',
  ai_file: '',
  ...props.initialData
})

const rules = {
  name: [
    { required: true, message: '请输入纹样名称', trigger: 'blur' },
    { min: 1, max: 255, message: '长度在 1 到 255 个字符', trigger: 'blur' }
  ]
}

const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const submitData = { ...form }
      if (props.patternId) {
        await request.put(`/costumes/${props.costumeId}/patterns/${props.patternId}`, submitData)
        ElMessage.success('更新成功')
      } else {
        await request.post(`/costumes/${props.costumeId}/pattern`, submitData)
        ElMessage.success('创建成功')
      }
      emit('success')
    } catch (e) {
      console.error(e)
      ElMessage.error('操作失败')
    }
  })
}

onMounted(() => {
  if (props.initialData) {
    Object.assign(form, props.initialData)
  }
})
</script>

<style scoped>
.pattern-form-container {
  padding: 40px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  margin: 30px auto;
  border: 1px solid #e4e7ed;
  max-width: 800px;
  position: relative;
  z-index: 1;
}

.pattern-form-container:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.pattern-form {
  padding: 0;
}

/* 纵向布局容器 */
.form-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* 统一表单项样式 */
.form-item {
  width: 100%;
}

/* 表单元素间距统一 */
.form-item :deep(.el-form-item) {
  margin-bottom: 0;
}

/* 重新设计的图片上传容器 */
.image-upload-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  position: relative;
  z-index: 10;
}

.image-upload-wrapper {
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 5;
}

.image-ratio-guide {
  width: 100%;
}

.ratio-alert {
  border-radius: 8px;
  border: 1px solid #d0e6ff;
  background-color: #f0f8ff;
}

.ratio-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #409eff;
}

.ratio-info .el-icon {
  font-size: 16px;
}

.form-actions {
  text-align: center;
  padding: 40px 0 20px;
  display: flex;
  justify-content: center;
  gap: 30px;
}

.form-actions .el-button {
  min-width: 120px;
  font-size: 16px;
  padding: 14px 28px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.form-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pattern-form-container {
    padding: 30px 20px;
    margin: 20px 15px;
    max-width: 100%;
  }
  
  .form-content {
    gap: 25px;
  }
  
  .form-actions {
    padding: 30px 0 15px;
    gap: 20px;
  }
  
  .form-actions .el-button {
    min-width: 100px;
    font-size: 15px;
    padding: 12px 24px;
  }
}

@media (max-width: 480px) {
  .pattern-form-container {
    padding: 25px 15px;
    margin: 15px 10px;
  }
  
  .form-content {
    gap: 20px;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 15px;
  }
  
  .form-actions .el-button {
    width: 100%;
    min-width: auto;
  }
}
</style>