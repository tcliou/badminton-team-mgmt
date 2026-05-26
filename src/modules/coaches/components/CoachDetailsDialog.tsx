import type { CoachProfile } from '@/core/supabase/types';
import { Button } from '@/shared/components/Button';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  coach?: CoachProfile;
}

export function CoachDetailsDialog({ open, onClose, coach }: Props) {
  if (!open || !coach) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="absolute right-4 top-4 z-10 h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/40"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="relative h-48 sm:h-64 w-full bg-muted overflow-hidden shrink-0">
          {coach.avatar_url ? (
            <img src={coach.avatar_url} alt={coach.name} className="h-full w-full object-cover" />
          ) : (
             <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                <span className="text-8xl font-bold text-primary/30">{coach.name[0]}</span>
             </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-1">
             <h2 className="text-3xl font-bold tracking-tight text-foreground">{coach.name}</h2>
             {coach.title && (
                <p className="text-sm font-medium text-primary">{coach.title}</p>
             )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-3">教練介紹</h3>
          <div className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {coach.cv || '目前尚未提供詳細介紹。'}
          </div>
        </div>
      </div>
    </div>
  );
}
