import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Cropper, { type Area } from 'react-easy-crop';
import { Camera } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { cropImageToBlob, useUploadAvatar } from '../api/avatarApi';

interface Props {
  open: boolean;
  onClose: () => void;
  profileId: string;
}

/**
 * 頭像上傳：選檔 → 預覽 + 拖曳裁切（react-easy-crop） → 上傳到 Storage。
 */
export function AvatarUploadDialog({ open, onClose, profileId }: Props) {
  const { t } = useTranslation();
  const upload = useUploadAvatar();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    if (!open) {
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [open]);

  const onCropComplete = useCallback((_area: Area, areaPx: Area) => {
    setCroppedAreaPixels(areaPx);
  }, []);

  const onPickFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const blob = await cropImageToBlob(imageSrc, croppedAreaPixels, 256);
    await upload.mutateAsync({ profileId, blob, ext: 'jpg' });
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-3 rounded-xl border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Camera className="h-4 w-4" aria-hidden />
          {t('players:avatar.title')}
        </h3>

        {!imageSrc ? (
          <label className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-background text-sm text-muted-foreground hover:bg-accent">
            <Camera className="h-6 w-6" aria-hidden />
            <span>{t('players:avatar.choose')}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
          </label>
        ) : (
          <>
            <div className="relative h-64 w-full overflow-hidden rounded-md bg-black/5">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">{t('players:avatar.zoom')}</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => void onUpload()}
            disabled={!imageSrc || !croppedAreaPixels || upload.isPending}
          >
            {upload.isPending ? t('common.loading') : t('players:avatar.upload')}
          </Button>
        </div>
      </div>
    </div>
  );
}
