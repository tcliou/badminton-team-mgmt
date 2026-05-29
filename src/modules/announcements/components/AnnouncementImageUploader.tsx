import { useState, useRef } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { supabase } from '@/core/supabase/client';

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

export function AnnouncementImageUploader({ value, onChange, disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // 縮小邏輯 (最大寬高 1024)
        const MAX_SIZE = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        }, 'image/jpeg', 0.8);
      };
      img.onerror = reject;
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (!file) continue;
        if (!file.type.startsWith('image/')) continue;

        // 壓縮
        const blob = await compressImage(file);
        
        // 上傳到 announcements bucket
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        
        const { error: upErr } = await supabase.storage
          .from('announcements')
          .upload(path, blob, { contentType: 'image/jpeg' });
          
        if (upErr) throw upErr;

        const { data } = supabase.storage.from('announcements').getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }

      onChange([...value, ...newUrls]);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('上傳失敗，請稍後再試。');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const next = [...value];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium">公告圖片 (可選)</label>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          💡 提醒：上傳的圖片將會自動壓縮以節省空間，請務必自行保留原始檔案！
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {value.map((url, i) => (
          <div key={url} className="group relative aspect-video overflow-hidden rounded-md border bg-muted">
            <img src={url} alt={`img-${i}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              disabled={disabled || uploading}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-0"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        <label className={`flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-input bg-background hover:bg-accent ${disabled || uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <UploadCloud className="h-5 w-5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{uploading ? '上傳中...' : '新增圖片'}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>
    </div>
  );
}
