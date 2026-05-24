import request from '@/utils/http'
import type { AppRouteRecord } from '@/types/router'

/** 获取菜单树 */
export function fetchGetMenuTree(params?: Api.Menu.MenuTreeSearchParams) {
  return request.get<Api.Menu.IMenu[]>({
    url: '/menu/tree',
    params
  })
}

/** 获取当前用户菜单（路由格式） */
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/menu/user/list'
  })
}

/** 获取菜单详情 */
export function fetchGetMenuDetail(id: number | string) {
  return request.get<Api.Menu.IMenu>({
    url: `/menu/detail/${id}`
  })
}

/** 创建菜单 */
export function fetchCreateMenu(params: Api.Menu.MenuFormParams) {
  return request.post({
    url: '/menu/create',
    params
  })
}

/** 更新菜单 */
export function fetchUpdateMenu(params: Api.Menu.MenuFormParams & { id: number }) {
  return request.post({
    url: '/menu/update',
    params
  })
}

/** 删除菜单 */
export function fetchDeleteMenu(id: number | string) {
  return request.del({
    url: `/menu/delete/${id}`
  })
}
