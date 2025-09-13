<template>
  <el-tooltip :content="`删除${label}`" placement="top">
    <el-button
      v-if="showButton"
      size="small"
      type="danger"
      class="clear-field-button"
      @click="handleClear"
      :loading="loading"
    >
      <el-icon><Delete /></el-icon>
      删除{{ label }}
    </el-button>
  </el-tooltip>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import request from '@/api/request'

const props = defineProps({
  costumeId: {
    type: [String, Number],
    required: true
  },
  field: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  value: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['success'])

const loading = ref(false)

// 是否显示删除按钮
const showButton = computed(() => {
  return props.value && props.value.trim() !== ''
})

// 处理清除操作
const handleClear = () => {
  ElMessageBox.confirm(
    `确定要删除${props.label}吗？此操作不可恢复。`,
    '删除确认',
    {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    loading.value = true
    try {
      await request.delete(`/costumes/${props.costumeId}/clear/${props.field}`)
      
      ElMessage.success(`${props.label}删除成功`)
      emit('success')
    } catch (e) {
      console.error('删除失败:', e)
      ElMessage.error(`删除${props.label}失败: ${e.response?.data?.message || e.message}`)
    } finally {
      loading.value = false
    }
  }).catch(() => {
    // 用户取消删除
  })
}
</script>

<style scoped>
.clear-field-button {
  margin-top: 8px;
  width: 100%;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.clear-field-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.clear-field-button:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .clear-field-button {
    font-size: 12px;
    padding: 8px 12px;
    min-height: 36px;
  }
}
</style>
```
