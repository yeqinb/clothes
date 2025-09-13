import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import CostumeList from '../views/CostumeList.vue'
import CostumeDetail from '../views/CostumeDetail.vue'
import CostumeForm from '../views/CostumeForm.vue'
import PatternList from '../views/PatternList.vue'

const routes = [
    { path: '/', redirect: '/login' },
    {
        path: '/layout',
        component: Layout,
        children: [
            { path: '/costumes', component: CostumeList },
            { path: '/costumes/create', component: CostumeForm },
            { path: '/costumes/:id', component: CostumeDetail },
            { path: '/costumes/:id/edit', component: CostumeForm, props: true },
            { path: '/patterns', component: PatternList },
        ]
    },
    { path: '/login', component: Login }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 添加路由守卫
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('auth')

    // 如果访问根路径，重定向到登录页面
    if (to.path === '/') {
        next('/login')
        return
    }

    // 如果访问需要认证的页面但没有token，重定向到登录页面
    if (to.path !== '/login' && !token) {
        next('/login')
    }
    // 如果已登录但访问登录页面，重定向到主页
    else if (to.path === '/login' && token) {
        next('/costumes')
    }
    // 其他情况正常导航
    else {
        next()
    }
})

export default router