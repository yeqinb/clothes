import request from './request'

export function loginApi(username, password) {
    return request.post('/login', {}, {
        auth: { username, password }
    })
}