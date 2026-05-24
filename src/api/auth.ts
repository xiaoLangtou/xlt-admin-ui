import request from '@/utils/http'
import { encryptPassword } from '@/utils/crypto'

/** 将后端用户信息映射为前端格式 */
function mapUserInfo(info: Api.Auth.IUserInfo): Api.Auth.UserInfo {
  return {
    userId: info.id,
    userName: info.username,
    email: info.email ?? '',
    avatar: info.headPic,
    nickname: info.nickname,
    roles: Array.isArray(info.roles) ? info.roles.map(String) : [],
    buttons: info.permissions ?? []
  }
}

/**
 * 用户登录
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return request.post<Api.Auth.LoginResponse>({
    url: '/auth/login',
    params: {
      ...params,
      password: encryptPassword(params.password)
    }
  })
}

/**
 * 获取当前用户信息
 */
export async function fetchGetUserInfo() {
  const data = await request.get<{ userInfo: Api.Auth.IUserInfo }>({
    url: '/auth/info'
  })
  return mapUserInfo(data.userInfo)
}

/**
 * 获取当前用户菜单
 */
export function fetchGetUserMenuList() {
  return request.get<Api.Menu.IMenu[]>({
    url: '/menu/user/list'
  })
}

/**
 * 退出登录
 */
export function fetchLogout() {
  return request.post<Api.Auth.LogoutResponse>({
    url: '/auth/logout'
  })
}

/**
 * 获取图片验证码
 */
export function fetchCaptcha() {
  return request.get<Api.Auth.CaptchaResponse>({
    url: '/captcha/image'
  })
}
