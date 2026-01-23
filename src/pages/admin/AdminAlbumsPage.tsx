import React, { useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Loader2, Save, Images, X, GripVertical, RotateCw, MessageSquare, Check } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UploadDropzone } from '@/components/UploadDropzone';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { ImageRotator } from '@/components/ImageRotator';
import { compressImage } from '@/utils/imageCompressor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  display_order: number;
}

interface AlbumPhoto {
  id: string;
  album_id: string;
  url: string;
  caption: string | null;
  display_order: number;
}

function SortableAlbumCard({ album, onEdit, onDelete, onManagePhotos }: {
  album: Album;
  onEdit: () => void;
  onDelete: () => void;
  onManagePhotos: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: album.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <GlassCard className="overflow-hidden group">
        <div className="aspect-video relative">
          {album.cover_image_url ? (
            <img src={album.cover_image_url} alt={album.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Images className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2">{album.title}</h3>
          {album.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{album.description}</p>
          )}
          <div className="flex gap-2">
            <GoldButton variant="outline" size="sm" onClick={onManagePhotos}>
              <Images className="h-4 w-4 ml-1" />
              تصاویر
            </GoldButton>
            <GoldButton variant="ghost" size="sm" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </GoldButton>
            <GoldButton variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </GoldButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function SortablePhotoCard({ photo, onDelete, onCaptionChange }: { 
  photo: AlbumPhoto; 
  onDelete: () => void;
  onCaptionChange: (caption: string) => void;
}) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState(photo.caption || '');
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveCaption = () => {
    onCaptionChange(captionValue);
    setIsEditingCaption(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="aspect-square">
        <img src={photo.url} alt="" className="w-full h-full object-cover rounded-lg" />
      </div>
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-white" />
      </div>
      <button
        onClick={onDelete}
        className="absolute top-2 left-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
      >
        <X className="h-4 w-4 text-white" />
      </button>
      
      {/* Caption button */}
      <button
        onClick={() => setIsEditingCaption(true)}
        className="absolute bottom-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary"
        title="ویرایش کپشن"
      >
        <MessageSquare className="h-4 w-4 text-white" />
      </button>
      
      {/* Show caption if exists */}
      {photo.caption && !isEditingCaption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg truncate">
          {photo.caption}
        </div>
      )}
      
      {/* Caption editor */}
      {isEditingCaption && (
        <div className="absolute inset-0 bg-black/80 rounded-lg flex flex-col items-center justify-center p-2 gap-2">
          <input
            type="text"
            value={captionValue}
            onChange={(e) => setCaptionValue(e.target.value)}
            placeholder="کپشن تصویر..."
            className="w-full p-2 text-sm rounded bg-background/90 border border-border/50 focus:border-primary focus:outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveCaption();
              if (e.key === 'Escape') setIsEditingCaption(false);
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditingCaption(false)}
              className="p-1.5 bg-muted rounded-full hover:bg-muted/80"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleSaveCaption}
              className="p-1.5 bg-primary rounded-full hover:bg-primary/80"
            >
              <Check className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAlbumsPage() {
  const queryClient = useQueryClient();
  const { uploadFile, isUploading } = useMediaUpload();
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [fileToRotate, setFileToRotate] = useState<File | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: albums, isLoading } = useQuery({
    queryKey: ['admin-albums'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Album[];
    },
  });

  const { data: albumPhotos } = useQuery({
    queryKey: ['album-photos', selectedAlbumId],
    queryFn: async () => {
      if (!selectedAlbumId) return [];
      const { data, error } = await supabase
        .from('album_photos')
        .select('*')
        .eq('album_id', selectedAlbumId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as AlbumPhoto[];
    },
    enabled: !!selectedAlbumId,
  });

  const saveMutation = useMutation({
    mutationFn: async (album: Partial<Album> & { id?: string }) => {
      if (album.id) {
        const { error } = await supabase.from('albums').update({
          title: album.title,
          description: album.description,
          cover_image_url: album.cover_image_url,
          display_order: album.display_order,
        }).eq('id', album.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('albums').insert({
          title: album.title!,
          description: album.description,
          cover_image_url: album.cover_image_url,
          display_order: album.display_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-albums'] });
      setIsDialogOpen(false);
      setEditingAlbum(null);
      toast.success('ذخیره شد');
    },
    onError: () => toast.error('خطا در ذخیره'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('albums').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-albums'] });
      toast.success('حذف شد');
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('album_photos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album-photos', selectedAlbumId] });
      toast.success('تصویر حذف شد');
    },
  });

  const updateCaptionMutation = useMutation({
    mutationFn: async ({ id, caption }: { id: string; caption: string }) => {
      const { error } = await supabase.from('album_photos').update({ caption }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album-photos', selectedAlbumId] });
      toast.success('کپشن ذخیره شد');
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (items: { id: string; display_order: number }[]) => {
      for (const item of items) {
        await supabase.from('albums').update({ display_order: item.display_order }).eq('id', item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-albums'] });
    },
  });

  const updatePhotoOrderMutation = useMutation({
    mutationFn: async (items: { id: string; display_order: number }[]) => {
      for (const item of items) {
        await supabase.from('album_photos').update({ display_order: item.display_order }).eq('id', item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album-photos', selectedAlbumId] });
    },
  });

  const handleAlbumDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !albums) return;

    const oldIndex = albums.findIndex((a) => a.id === active.id);
    const newIndex = albums.findIndex((a) => a.id === over.id);
    const newAlbums = arrayMove(albums, oldIndex, newIndex);

    const updates = newAlbums.map((album, index) => ({
      id: album.id,
      display_order: index + 1,
    }));

    updateOrderMutation.mutate(updates);
  };

  const handlePhotoDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !albumPhotos) return;

    const oldIndex = albumPhotos.findIndex((p) => p.id === active.id);
    const newIndex = albumPhotos.findIndex((p) => p.id === over.id);
    const newPhotos = arrayMove(albumPhotos, oldIndex, newIndex);

    const updates = newPhotos.map((photo, index) => ({
      id: photo.id,
      display_order: index + 1,
    }));

    updatePhotoOrderMutation.mutate(updates);
  };

  const handleAdd = () => {
    setEditingAlbum({
      id: '',
      title: '',
      description: '',
      cover_image_url: '',
      display_order: (albums?.length || 0) + 1,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingAlbum?.title) {
      toast.error('عنوان الزامی است');
      return;
    }
    saveMutation.mutate(editingAlbum);
  };

  // Handle files selected - show rotation option for first file if multiple
  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return;
    
    if (files.length === 1) {
      // Single file - show rotator
      setFileToRotate(files[0]);
      setPendingFiles([]);
    } else {
      // Multiple files - show rotator for first, queue rest
      setFileToRotate(files[0]);
      setPendingFiles(files.slice(1));
    }
  };

  // Upload a single file with compression
  const uploadSingleFile = useCallback(async (file: File): Promise<boolean> => {
    if (!selectedAlbumId) return false;
    
    try {
      // فشرده‌سازی تصویر قبل از آپلود
      const compressedFile = await compressImage(file, 1920, 1080, 0.85);
      const currentCount = albumPhotos?.length || 0;
      const url = await uploadFile(compressedFile, selectedAlbumId, 'album-media');
      await supabase.from('album_photos').insert({
        album_id: selectedAlbumId,
        url,
        display_order: currentCount + 1,
        caption: null,
      });
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    }
  }, [selectedAlbumId, albumPhotos?.length, uploadFile]);

  // آپلود موازی - ۳ فایل همزمان
  const uploadFilesInParallel = useCallback(async (files: File[]): Promise<{ success: number; error: number }> => {
    const BATCH_SIZE = 3;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(f => uploadSingleFile(f)));
      successCount += results.filter(Boolean).length;
      errorCount += results.filter(r => !r).length;
    }

    return { success: successCount, error: errorCount };
  }, [uploadSingleFile]);

  // Handle rotated file save
  const handleRotatedFileSave = useCallback(async (rotatedFile: File) => {
    setUploadingCount(1 + pendingFiles.length);
    
    // فشرده‌سازی فایل چرخانده شده
    const compressedFile = await compressImage(rotatedFile, 1920, 1080, 0.85);
    
    // آپلود فایل چرخانده
    const firstSuccess = await uploadSingleFile(compressedFile);
    
    // آپلود موازی بقیه فایل‌ها
    const { success: restSuccess, error: restError } = await uploadFilesInParallel(pendingFiles);
    
    const successCount = (firstSuccess ? 1 : 0) + restSuccess;
    const errorCount = (firstSuccess ? 0 : 1) + restError;
    
    // Reset states
    setFileToRotate(null);
    setPendingFiles([]);
    setUploadingCount(0);
    
    queryClient.invalidateQueries({ queryKey: ['album-photos', selectedAlbumId] });
    
    if (successCount > 0) {
      toast.success(`${successCount} تصویر آپلود شد`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} تصویر آپلود نشد`);
    }
  }, [pendingFiles, uploadSingleFile, uploadFilesInParallel, queryClient, selectedAlbumId]);

  // Skip rotation and upload directly
  const handleSkipRotation = useCallback(async () => {
    if (!fileToRotate) return;
    
    setUploadingCount(1 + pendingFiles.length);
    
    // همه فایل‌ها را یکجا آپلود می‌کنیم
    const allFiles = [fileToRotate, ...pendingFiles];
    const { success: successCount, error: errorCount } = await uploadFilesInParallel(allFiles);
    
    // Reset states
    setFileToRotate(null);
    setPendingFiles([]);
    setUploadingCount(0);
    
    queryClient.invalidateQueries({ queryKey: ['album-photos', selectedAlbumId] });
    
    if (successCount > 0) {
      toast.success(`${successCount} تصویر آپلود شد`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} تصویر آپلود نشد`);
    }
  }, [fileToRotate, pendingFiles, uploadFilesInParallel, queryClient, selectedAlbumId]);

  const handleCoverUpload = async (files: File[]) => {
    if (!editingAlbum || files.length === 0) return;
    try {
      const url = await uploadFile(files[0], editingAlbum.id || 'new', 'album-media');
      setEditingAlbum({ ...editingAlbum, cover_image_url: url });
      toast.success('تصویر آپلود شد');
    } catch {
      toast.error('خطا در آپلود');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gold">مدیریت آلبوم‌ها</h1>
        <GoldButton onClick={handleAdd}>
          <Plus className="h-5 w-5 ml-2" />
          افزودن آلبوم
        </GoldButton>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAlbumDragEnd}>
        <SortableContext items={albums?.map(a => a.id) || []} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums?.map((album) => (
              <SortableAlbumCard
                key={album.id}
                album={album}
                onEdit={() => { setEditingAlbum(album); setIsDialogOpen(true); }}
                onDelete={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(album.id); }}
                onManagePhotos={() => { setSelectedAlbumId(album.id); setPhotosDialogOpen(true); }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingAlbum?.id ? 'ویرایش آلبوم' : 'افزودن آلبوم'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">عنوان آلبوم</label>
              <input
                className="w-full p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                value={editingAlbum?.title || ''}
                onChange={(e) => setEditingAlbum(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">توضیحات</label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                value={editingAlbum?.description || ''}
                onChange={(e) => setEditingAlbum(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">تصویر کاور</label>
              {editingAlbum?.cover_image_url ? (
                <div className="relative w-full aspect-video">
                  <img src={editingAlbum.cover_image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    onClick={() => setEditingAlbum(prev => prev ? { ...prev, cover_image_url: '' } : null)}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <UploadDropzone onFilesSelected={handleCoverUpload} isUploading={isUploading} accept="image/*" multiple={false} />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <GoldButton variant="outline" onClick={() => setIsDialogOpen(false)}>انصراف</GoldButton>
              <GoldButton onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                ذخیره
              </GoldButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photos Dialog */}
      <Dialog open={photosDialogOpen} onOpenChange={setPhotosDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>مدیریت تصاویر آلبوم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex-1">
                <UploadDropzone 
                  onFilesSelected={handleFilesSelected} 
                  isUploading={isUploading || uploadingCount > 0} 
                  accept="image/*" 
                />
              </div>
            </div>
            
            {uploadingCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال آپلود {uploadingCount} تصویر...
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RotateCw className="h-4 w-4" />
              <span>پس از انتخاب تصویر، امکان چرخش قبل از آپلود وجود دارد</span>
            </div>
            
            <p className="text-xs text-muted-foreground">برای تغییر ترتیب، تصاویر را بکشید و رها کنید • برای ویرایش کپشن روی آیکون پیام کلیک کنید</p>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePhotoDragEnd}>
              <SortableContext items={albumPhotos?.map(p => p.id) || []} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {albumPhotos?.map((photo) => (
                    <SortablePhotoCard
                      key={photo.id}
                      photo={photo}
                      onDelete={() => deletePhotoMutation.mutate(photo.id)}
                      onCaptionChange={(caption) => updateCaptionMutation.mutate({ id: photo.id, caption })}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Rotator */}
      {fileToRotate && (
        <ImageRotator
          file={fileToRotate}
          onSave={handleRotatedFileSave}
          onCancel={handleSkipRotation}
        />
      )}
    </div>
  );
}
