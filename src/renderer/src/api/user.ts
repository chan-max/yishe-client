import request from './request'
 
export function saveTokenToClient(token: string) {
  return (window.api as any).saveToken(token)
}

export function getTokenFromClient() {
  return (window.api as any).getToken()
}

export function isClientAuthorized() {
  return (window.api as any).isTokenExist()
}

export function logoutToken(): Promise<boolean> {
  return fetch('http://localhost:1519/api/logoutToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) return true
      return Promise.reject(new Error(data.message || '退出授权失败'))
    })
}

// 社交媒体登录状态检测
export function checkSocialMediaLogin() {
  return request.get({
    url: '/checkSocialMediaLogin'
  })
}
 