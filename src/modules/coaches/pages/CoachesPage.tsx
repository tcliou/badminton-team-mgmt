import { useState } from 'react';
import { Plus, Edit } from 'lucide-react';
import { useAuthStore } from '@/core/store/authStore';
import { useCoaches } from '../api/coachesApi';
import { CoachFormDialog } from '../components/CoachFormDialog';
import { Button } from '@/shared/components/Button';
import { Loading } from '@/shared/components/Loading';
import type { CoachProfile } from '@/core/supabase/types';

export function CoachesPage() {
  const { data: coaches, isLoading } = useCoaches();
  
  const currentUser = useAuthStore((s) => s.profile);
  const canManage = currentUser?.permission_keys?.includes('action:coaches:manage') ?? false;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<CoachProfile | undefined>();

  const handleEdit = (coach: CoachProfile) => {
    setEditingCoach(coach);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCoach(undefined);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">教練團隊</h1>
          <p className="text-muted-foreground mt-1">認識我們專業的羽球教練</p>
        </div>
        {canManage && (
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            新增教練
          </Button>
        )}
      </header>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coaches?.map((coach) => (
            <div key={coach.id} className="relative rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
              <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center overflow-hidden">
                {coach.avatar_url ? (
                  <img src={coach.avatar_url} alt={coach.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-muted-foreground/50 font-bold">{coach.name[0]}</span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold">{coach.name}</h3>
                    {coach.title && <p className="text-sm font-medium text-primary mt-1">{coach.title}</p>}
                  </div>
                  {canManage && (
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(coach)} className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-2 flex-1">
                  {coach.cv || '尚未填寫介紹'}
                </div>
                {!coach.is_active && canManage && (
                  <div className="mt-4 text-xs font-semibold text-destructive bg-destructive/10 inline-block px-2 py-1 rounded w-fit">
                    已停用
                  </div>
                )}
              </div>
            </div>
          ))}
          {(!coaches || coaches.length === 0) && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              目前還沒有教練資料
            </div>
          )}
        </div>
      )}

      <CoachFormDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        coach={editingCoach}
      />
    </div>
  );
}
