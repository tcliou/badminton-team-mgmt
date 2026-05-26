import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ExternalLink, Edit2, Trash2, FileText } from 'lucide-react';
import { useDocuments, useDeleteDocument } from '../api/documentsApi';
import type { DocumentRow } from '@/core/supabase/types';
import { DocumentFormDialog } from '../components/DocumentFormDialog';
import { useAuthStore } from '@/core/store/authStore';
import { hasPermission } from '@/core/acl/permissions';
import { Button } from '@/shared/components/Button';

export function DocumentsPage() {
  const { t } = useTranslation();
  const { data: documents, isLoading } = useDocuments();
  const deleteDoc = useDeleteDocument();
  
  const profile = useAuthStore((s) => s.profile);
  const canManage = hasPermission(profile?.permission_keys ?? [], 'action:documents:manage');

  const [formOpen, setFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentRow | undefined>(undefined);

  const handleCreate = () => {
    setEditingDoc(undefined);
    setFormOpen(true);
  };

  const handleEdit = (doc: DocumentRow) => {
    setEditingDoc(doc);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('common:confirm') + ' ' + t('common:delete') + '?')) {
      await deleteDoc.mutateAsync(id);
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('common:nav.documents')}</h1>
          <p className="text-muted-foreground mt-1">管理與查看球隊相關文件</p>
        </div>
        {canManage && (
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            新增文件
          </Button>
        )}
      </header>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('common:loading')}</div>
      ) : documents?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
          {t('common:empty')}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents?.map((doc) => (
            <div key={doc.id} className="flex flex-col border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between p-4 border-b">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-semibold text-lg truncate" title={doc.title}>{doc.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {doc.visible_to_role_ids.length === 0 ? '全體可見' : `限定角色可見 (${doc.visible_to_role_ids.length})`}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => handleEdit(doc)}
                      className="p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded-md transition-colors"
                      title={t('common:edit')}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-destructive/80 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
                      title={t('common:delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm text-foreground/80 line-clamp-3 mb-4 flex-1">
                  {doc.description || '無描述'}
                </p>
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center w-full gap-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 transition-colors"
                >
                  前往觀看 <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <DocumentFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        document={editingDoc}
      />
    </div>
  );
}
