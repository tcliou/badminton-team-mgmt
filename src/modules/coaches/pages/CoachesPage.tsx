import { useState } from 'react';
import { Plus, Edit } from 'lucide-react';
import { useAuthStore } from '@/core/store/authStore';
import { useCoaches } from '../api/coachesApi';
import { CoachFormDialog } from '../components/CoachFormDialog';
import { CoachDetailsDialog } from '../components/CoachDetailsDialog';
import { Button } from '@/shared/components/Button';
import { Loading } from '@/shared/components/Loading';
import type { CoachProfile } from '@/core/supabase/types';

export function CoachesPage() {
  const { data: coaches, isLoading } = useCoaches();
  
  const currentUser = useAuthStore((s) => s.profile);
  const canManage = currentUser?.permission_keys?.includes('action:coaches:manage') ?? false;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<CoachProfile | undefined>();
  const [viewingCoach, setViewingCoach] = useState<CoachProfile | undefined>();

  const handleEdit = (coach: CoachProfile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingCoach(coach);
    setDialogOpen(true);
  };

  const handleView = (coach: CoachProfile) => {
    setViewingCoach(coach);
    setDetailsOpen(true);
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {coaches?.map((coach) => (
            <div 
              key={coach.id} 
              onClick={() => handleView(coach)}
              className="group cursor-pointer relative flex flex-col overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              {/* Image Section */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                {coach.avatar_url ? (
                  <img 
                    src={coach.avatar_url} 
                    alt={coach.name} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
                    <span className="text-6xl font-bold text-primary/40">{coach.name[0]}</span>
                  </div>
                )}
                {/* Gradient Overlay for Text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                
                {/* Status Badge */}
                {!coach.is_active && canManage && (
                  <div className="absolute top-3 right-3 rounded-full bg-destructive/90 px-2.5 py-0.5 text-xs font-semibold text-destructive-foreground backdrop-blur-md shadow-sm">
                    已停用
                  </div>
                )}

                {/* Info overlaid on image */}
                <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-2xl font-bold text-white tracking-tight">{coach.name}</h3>
                    {coach.title && (
                      <p className="text-sm font-medium text-white/90 bg-white/20 backdrop-blur-md w-fit px-2 py-0.5 rounded">
                        {coach.title}
                      </p>
                    )}
                  </div>
                  {canManage && (
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      onClick={(e) => handleEdit(coach, e)} 
                      className="h-8 w-8 rounded-full opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* CV Section */}
              <div className="flex-1 p-5 text-sm text-muted-foreground bg-card">
                <div className="line-clamp-6 whitespace-pre-wrap leading-relaxed">
                  {coach.cv || '目前尚未提供詳細介紹。'}
                </div>
              </div>
            </div>
          ))}
          {(!coaches || coaches.length === 0) && (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-medium text-muted-foreground">目前還沒有教練資料</p>
            </div>
          )}
        </div>
      )}

      <CoachFormDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        coach={editingCoach}
      />
      <CoachDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        coach={viewingCoach}
      />
    </div>
  );
}
