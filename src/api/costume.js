import request from './request'

// 获取所有服饰
export function getCostumes() {
    return request.get('/costumes')
}

// 获取单个服饰
export function getCostumeById(id) {
    return request.get(`/costumes/${id}`)
}

// 创建服饰
export function createCostume(data) {
    return request.post('/costume', data)
}

// 更新服饰
export function updateCostume(id, data) {
    return request.put(`/costumes/${id}`, data)
}

// 删除服饰
export function deleteCostume(id) {
    return request.delete(`/costumes/${id}`)
}