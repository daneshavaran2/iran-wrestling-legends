import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, Save, Images, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UploadDropzone } from '@/components/UploadDropzone';
import { useMediaUpload } from '@/hooks/useMediaUpload';

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  display_order: number;
}

export default function AdminAlbumsPage() {
  const queryClient = useQueryClient();
  const { uploadFile, isUploading } = useMediaUpload();
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

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
      return data;
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {albums?.map((album) => (
          <GlassCard key={album.id} className="overflow-hidden">
            <div className="aspect-video relative">
              {album.cover_image_url ? (
                <img src={album.cover_image_url} alt={album.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Images className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{album.title}</h3>
              {album.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{album.description}</p>
              )}
              <div className="flex gap-2">
                <GoldButton
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectedAlbumId(album.id); setPhotosDialogOpen(true); }}
                >
                  <Images className="h-4 w-4 ml-1" />
                  تصاویر
                </GoldButton>
                <GoldButton variant="ghost" size="sm" onClick={() => { setEditingAlbum(album); setIsDialogOpen(true); }}>
                  <Edit2 className="h-4 w-4" />
                </GoldButton>
                <GoldButton
                  variant="ghost"
                  size="sm"
                  onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(album.id); }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </GoldButton>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

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
            <div>
              <label className="block text-sm font-medium mb-2">ترتیب نمایش</label>
              <input
                type="number"
                className="w-full p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                value={editingAlbum?.display_order?.toString() || '0'}
                onChange={(e) => setEditingAlbum(prev => prev ? { ...prev, display_order: parseInt(e.target.value) || 0 } : null)}
              />
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
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {albumPhotos?.map((photo) => (
                <div key={photo.id} className="relative aspect-square group">
                  <img src={photo.url} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    onClick={() => deletePhotoMutation.mutate(photo.id)}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
