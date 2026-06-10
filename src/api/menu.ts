import request from '@/utils/http'
import type { AppRouteRecord } from '@/types/router'
import { normalizeMenuResponse } from '@/utils/menu/transformMenu'

/** 获取菜单树 */
export function fetchGetMenuTree(params?: Api.Menu.MenuTreeSearchParams) {
  return request.get<Api.Menu.IMenu[]>({
    url: '/menu/tree',
    params
  })
}

/** 获取当前用户菜单（路由格式） */
export async function fetchGetMenuList() {
  const list = await request.get<Array<Api.Menu.IMenu | AppRouteRecord>>({
    url: '/menu/user/list'
  })

  return normalizeMenuResponse(list)
}

/** 获取菜单详情 */
export function fetchGetMenuDetail(id: number | string) {
  return request.get<Api.Menu.IMenu>({
    url: `/menu/detail/${id}`
  })
}

/** 创建菜单 */
export function fetchCreateMenu(data: Api.Menu.MenuFormParams) {
  return request.post({
    url: '/menu/create',
    data
  })
}

/** 更新菜单 */
export function fetchUpdateMenu(data: Api.Menu.MenuFormParams & { id: number }) {
  return request.post({
    url: '/menu/update',
    data
  })
}

/** 删除菜单 */
export function fetchDeleteMenu(id: number | string) {
  return request.del({
    url: `/menu/delete/${id}`
  })
}
