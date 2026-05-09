import type { ModuleDescriptor } from './types';

/**
 * 自動掃描 src/modules/<name>/index.ts，匯出 default 為 ModuleDescriptor 即被自動註冊。
 * 嚴格的型別 + 一致的命名讓「新增頁面 = 新增資料夾」成為事實。
 */
// 注意：import.meta.glob 必須用相對於本檔案的路徑，不可用 @/ alias
const moduleFiles = import.meta.glob('../../modules/*/index.ts', { eager: true }) as Record<
  string,
  { default?: ModuleDescriptor; module?: ModuleDescriptor }
>;

export const registeredModules: ModuleDescriptor[] = Object.values(moduleFiles)
  .map((m) => m.default ?? m.module)
  .filter((m): m is ModuleDescriptor => Boolean(m))
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));

/** 取得所有要顯示在主選單的模組（按 order 排序） */
export function navModules(): ModuleDescriptor[] {
  return registeredModules.filter((m) => m.showInNav !== false);
}
