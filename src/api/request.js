import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const request = axios.create({
    baseURL: '/api', // 使用相对路径，通过Vercel代理转发到实际API
    timeout: 15000, // 增加超时时间
})

// 请求拦截器
request.interceptors.request.use(config => {
    console.log('发送请求:', config.method?.toUpperCase(), config.url, config.params)

    const token = localStorage.getItem('auth')
    if (token) {
        config.headers.Authorization = `Basic ${token}`
    }

    return config
})

// 响应拦截器
request.interceptors.response.use(
    response => {
        console.log('收到响应:', response.config.url, response.status, response.data)
        return response.data
    },
    error => {
        console.error('请求错误:', error.response?.status, error.response?.data || error.message)

        // 显示用户友好的错误信息
        let message = '请求失败'
        if (error.response?.data?.message) {
            message = error.response.data.message
        } else if (error.message) {
            message = error.message
        }

        ElMessage.error(message)
        return Promise.reject(error)
    }
)

// 添加下载方法
request.download = function (url, filename) {
    return this({
        method: 'GET',
        url: url,
        responseType: 'blob'
    }).then(response => {
        // 创建下载链接
        const blob = new Blob([response])
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename
        link.click()
        URL.revokeObjectURL(link.href)
        return response
    })
}

// 添加带重试机制的请求方法
request.retryableRequest = async function (config, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await this(config);
            return response;
        } catch (error) {
            console.log(`请求失败，第${i + 1}次重试:`, error.message);

            // 如果是最后一次重试，抛出错误
            if (i === maxRetries - 1) {
                throw error;
            }

            // 对于网络错误，等待一段时间后重试
            if (error.code === 'NETWORK_ERROR' || !error.response || error.code === 'ECONNABORTED') {
                // 指数退避策略
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
                continue;
            }

            // 对于其他错误，直接抛出
            throw error;
        }
    }
}

export default request