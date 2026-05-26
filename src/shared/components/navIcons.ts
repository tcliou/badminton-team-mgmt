import {
  Home,
  Users,
  CalendarOff,
  CreditCard,
  Dumbbell,
  Megaphone,
  Wallet,
  Shield,
  Circle,
  UsersRound,
  CalendarDays,
  CheckSquare,
  FileText,
  type LucideIcon,
} from 'lucide-react';

/**
 * 主選單可用的 icon 白名單。
 * 模組的 ModuleDescriptor.navIcon 只能用這裡的 key，
 * 這樣 lucide-react 才能正確 tree-shake，避免整包 ~1MB icon 都被打進 bundle。
 *
 * 新增 icon 時：先在這裡 import + 加進 map，再到模組 descriptor 引用。
 */
export const NAV_ICONS = {
  Home,
  Users,
  CalendarOff,
  CreditCard,
  Dumbbell,
  Megaphone,
  Wallet,
  Shield,
  UsersRound,
  CalendarDays,
  CheckSquare,
  FileText,
} as const satisfies Record<string, LucideIcon>;

export type NavIconKey = keyof typeof NAV_ICONS;

export const FALLBACK_NAV_ICON: LucideIcon = Circle;

/** 安全取得 icon 元件，找不到回傳 fallback */
export function resolveNavIcon(key: string | undefined): LucideIcon {
  if (!key) return FALLBACK_NAV_ICON;
  return (NAV_ICONS as Record<string, LucideIcon>)[key] ?? FALLBACK_NAV_ICON;
}
