import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('auth') || ''
    }),
    actions: {
        setToken(token) {
            this.token = token
            localStorage.setItem('auth', token)
        },
        logout() {
            this.token = ''
            localStorage.removeItem('auth')
            localStorage.removeItem('token') // 兼容性清理
            window.location.href = '/login'
        },
        // 检查是否已登录
        isAuthenticated() {
            return !!this.token
        }
    }
})