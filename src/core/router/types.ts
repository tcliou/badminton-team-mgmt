import type { LazyExoticComponent, ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { PermissionKey } from '../acl/permissions';

/** 模組對外的描述子。新增功能模組只需匯出一份。 */
export interface ModuleDescriptor {
  /** 唯一識別字，亦作為 i18n namespace */
  id: string;
  /** 顯示在側邊/底部選單的 i18n key（含 namespace），如 'common:nav.home' */
  navLabelKey: string;
  /** lucide-react 圖示名（傳入 LucideIcon 字串） */
  navIcon?: string;
  /** 進入此模組需要的權限鍵；不填代表所有登入者皆可 */
  permissionKey?: PermissionKey | string;
  /** 在底部導航的顯示順序；數字越小越靠左 */
  order?: number;
  /** 是否要在側邊/底部主選單顯示 */
  showInNav?: boolean;
  /** 模組底下的路由定義（會被掛在 / 之下） */
  routes: RouteEntry[];
}

export interface RouteEntry {
  path: string;
  element: LazyExoticComponent<ComponentType<unknown>> | ComponentType<unknown>;
  /** 可選擇覆寫整個 route 物件的其他欄位 */
  index?: boolean;
  children?: RouteObject[];
}
