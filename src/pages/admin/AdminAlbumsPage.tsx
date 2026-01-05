import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, Save, Images, X, GripVertical } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UploadDropzone } from '@/components/UploadDropzone';
import { useMediaUpload } from '@/hooks/useMediaUpload';
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

function SortablePhotoCard({ photo, onDelete }: { photo: AlbumPhoto; onDelete: () => void }) {
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

  return (
    <div ref={setNodeRef} style={style} className="relative aspect-square group">
      <img src={photo.url} alt="" className="w-full h-full object-cover rounded-lg" />
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

  const handlePhotoUpload = async (files: File[]) => {
    if (!selectedAlbumId || files.length === 0) return;
    try {
      for (const file of files) {
        const url = await uploadFile(file, selectedAlbumId);
        await supabase.from('album_photos').insert({
          album_id: selectedAlbumId,
          url,
          display_order: (albumPhotos?.length || 0) + 1,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['album-photos', selectedAlbumId] });
      toast.success('تصاویر آپلود شد');
    } catch {
      toast.error('خطا در آپلود');
    }
  };

  const handleCoverUpload = async (files: File[]) => {
    if (!editingAlbum || files.length === 0) return;
    try {
      const url = await uploadFile(files[0], editingAlbum.id || 'new');
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
            <UploadDropzone onFilesSelected={handlePhotoUpload} isUploading={isUploading} accept="image/*" />
            <p className="text-xs text-muted-foreground">برای تغییر ترتیب، تصاویر را بکشید و رها کنید</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePhotoDragEnd}>
              <SortableContext items={albumPhotos?.map(p => p.id) || []} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {albumPhotos?.map((photo) => (
                    <SortablePhotoCard
                      key={photo.id}
                      photo={photo}
                      onDelete={() => deletePhotoMutation.mutate(photo.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
