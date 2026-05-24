/**
 * Query Key 工厂
 *
 * 统一管理 TanStack Query 的 queryKey，便于缓存失效与类型推导。
 *
 * @module utils/query/keys
 */

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    captcha: () => [...queryKeys.auth.all, 'captcha'] as const,
    userInfo: () => [...queryKeys.auth.all, 'userInfo'] as const
  },
  menu: {
    all: ['menu'] as const,
    list: (params: { userId?: number | string; mode: string }) =>
      [...queryKeys.menu.all, 'list', params] as const
  },
  system: {
    all: ['system'] as const,
    users: (params?: Api.SystemManage.UserSearchParams) =>
      [...queryKeys.system.all, 'users', params] as const,
    roles: (params?: Api.SystemManage.RoleSearchParams) =>
      [...queryKeys.system.all, 'roles', params] as const,
    menus: () => [...queryKeys.system.all, 'menus'] as const,
    depts: () => [...queryKeys.system.all, 'depts'] as const,
    dicts: () => [...queryKeys.system.all, 'dicts'] as const
  }
} as const
