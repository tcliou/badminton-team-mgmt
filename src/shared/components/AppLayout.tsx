import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { BottomNav } from './BottomNav';

/**
 * 應用主 Layout：
 *  - 手機（< md）: 上方 TopBar + 中央內容 + 底部 BottomNav
 *  - 桌機（>= md）: 左側 SideNav + 上方 TopBar + 中央內容
 */
export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <SideNav className="hidden md:flex" />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4 md:px-8 md:pb-8">
          <Outlet />
        </main>
        <BottomNav className="md:hidden" />
      </div>
    </div>
  );
}
