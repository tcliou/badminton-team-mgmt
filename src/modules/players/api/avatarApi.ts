import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import { QK } from '@/shared/utils/queryKeys';

/**
 * 把已裁切好的 Blob 上傳到 avatars bucket，並把公開 URL 寫回 profile.avatar_url。
 * 路徑格式：${profileId}/avatar.<ext>，永遠覆蓋同一個檔，避免無限累積舊頭像。
 */
export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { profileId: string; blob: Blob; ext?: string }) => {
      const ext = input.ext ?? 'jpg';
      const path = `${input.profileId}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, input.blob, {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          upsert: true,
          cacheControl: '0',
        });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      // 加 cache buster 避免瀏覽器顯示舊版
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', input.profileId);
      if (profErr) throw profErr;

      return publicUrl;
    },
    onSuccess: (_url, vars) => {
      void qc.invalidateQueries({ queryKey: QK.profile.detail(vars.profileId) });
      void qc.invalidateQueries({ queryKey: QK.profile.list });
      void qc.invalidateQueries({ queryKey: QK.profile.me });
    },
  });
}

/** 把選擇的圖片 + crop 區域產出方形 JPEG Blob */
export async function cropImageToBlob(
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number },
  size = 256,
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      'image/jpeg',
      0.9,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
