import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, Save, Image as ImageIcon, Video, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadDropzone } from '@/components/UploadDropzone';
import { useMediaUpload } from '@/hooks/useMediaUpload';

interface Building {
  id: string;
  name: string;
  description: string | null;
  hero_image_url: string | null;
  map_link: string | null;
  display_order: number;
}

interface BuildingMedia {
  id: string;
  building_id: string;
  type: string;
  url: string;
  title: string | null;
  display_order: number;
}

export default function AdminBuildingsPage() {
  const queryClient = useQueryClient();
  const { uploadFile, isUploading } = useMediaUpload();
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  const { data: buildings, isLoading } = useQuery({
    queryKey: ['admin-buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Building[];
    },
  });

  const { data: buildingMedia } = useQuery({
    queryKey: ['building-media', selectedBuildingId],
    queryFn: async () => {
      if (!selectedBuildingId) return [];
      const { data, error } = await supabase
        .from('building_images')
        .select('*')
        .eq('building_id', selectedBuildingId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as BuildingMedia[];
    },
    enabled: !!selectedBuildingId,
  });

  const saveMutation = useMutation({
    mutationFn: async (building: Partial<Building> & { id?: string }) => {
      if (building.id) {
        const { error } = await supabase.from('buildings').update({
          name: building.name,
          description: building.description,
          hero_image_url: building.hero_image_url,
          map_link: building.map_link,
          display_order: building.display_order,
        }).eq('id', building.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('buildings').insert({
          name: building.name!,
          description: building.description,
          hero_image_url: building.hero_image_url,
          map_link: building.map_link,
          display_order: building.display_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-buildings'] });
      setIsDialogOpen(false);
      setEditingBuilding(null);
      toast.success('ذخیره شد');
    },
    onError: () => toast.error('خطا در ذخیره'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('buildings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-buildings'] });
      toast.success('حذف شد');
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('building_images').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building-media', selectedBuildingId] });
      toast.success('رسانه حذف شد');
    },
  });

  const handleAdd = () => {
    setEditingBuilding({
      id: '',
      name: '',
      description: '',
      hero_image_url: '',
      map_link: '',
      display_order: (buildings?.length || 0) + 1,
    });
    setSelectedBuildingId(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (building: Building) => {
    setEditingBuilding(building);
    setSelectedBuildingId(building.id);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingBuilding?.name) {
      toast.error('نام الزامی است');
      return;
    }
    saveMutation.mutate(editingBuilding);
  };

  const handleMediaUpload = async (files: File[], type: 'image' | 'video') => {
    if (!selectedBuildingId || files.length === 0) return;
    try {
      for (const file of files) {
        const url = await uploadFile(file, selectedBuildingId);
        await supabase.from('building_images').insert({
          building_id: selectedBuildingId,
          type,
          url,
          display_order: (buildingMedia?.length || 0) + 1,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['building-media', selectedBuildingId] });
      toast.success('آپلود شد');
    } catch {
      toast.error('خطا در آپلود');
    }
  };

  const handleHeroImageUpload = async (files: File[]) => {
    if (!editingBuilding || files.length === 0) return;
    try {
      const url = await uploadFile(files[0], editingBuilding.id || 'new');
      setEditingBuilding({ ...editingBuilding, hero_image_url: url });
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
        <h1 className="text-2xl font-bold text-gold">مدیریت بناها</h1>
        <GoldButton onClick={handleAdd}>
          <Plus className="h-5 w-5 ml-2" />
          افزودن بنا
        </GoldButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buildings?.map((building) => (
          <GlassCard key={building.id} className="overflow-hidden">
            <div className="aspect-video relative">
              {building.hero_image_url ? (
                <img src={building.hero_image_url} alt={building.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{building.name}</h3>
              <div className="flex gap-2">
                <GoldButton variant="ghost" size="sm" onClick={() => handleEdit(building)}>
                  <Edit2 className="h-4 w-4" />
                </GoldButton>
                <GoldButton
                  variant="ghost"
                  size="sm"
                  onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(building.id); }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </GoldButton>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Edit Dialog with Tabs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBuilding?.id ? 'ویرایش بنا' : 'افزودن بنا'}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">اطلاعات</TabsTrigger>
              <TabsTrigger value="media" disabled={!editingBuilding?.id}>رسانه‌ها</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">نام</label>
                <input
                  className="w-full p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                  value={editingBuilding?.name || ''}
                  onChange={(e) => setEditingBuilding(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">توضیحات</label>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                  value={editingBuilding?.description || ''}
                  onChange={(e) => setEditingBuilding(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">تصویر اصلی</label>
                {editingBuilding?.hero_image_url ? (
                  <div className="relative w-full aspect-video">
                    <img src={editingBuilding.hero_image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button
                      onClick={() => setEditingBuilding(prev => prev ? { ...prev, hero_image_url: '' } : null)}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <UploadDropzone onFilesSelected={handleHeroImageUpload} isUploading={isUploading} accept="image/*" multiple={false} />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">لینک نقشه</label>
                <input
                  className="w-full p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                  value={editingBuilding?.map_link || ''}
                  onChange={(e) => setEditingBuilding(prev => prev ? { ...prev, map_link: e.target.value } : null)}
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ترتیب نمایش</label>
                <input
                  type="number"
                  className="w-full p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                  value={editingBuilding?.display_order?.toString() || '0'}
                  onChange={(e) => setEditingBuilding(prev => prev ? { ...prev, display_order: parseInt(e.target.value) || 0 } : null)}
                />
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> آپلود تصویر
                  </label>
                  <UploadDropzone
                    onFilesSelected={(files) => handleMediaUpload(files, 'image')}
                    isUploading={isUploading}
                    accept="image/*"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Video className="h-4 w-4" /> آپلود فیلم
                  </label>
                  <UploadDropzone
                    onFilesSelected={(files) => handleMediaUpload(files, 'video')}
                    isUploading={isUploading}
                    accept="video/*"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {buildingMedia?.map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden group">
                    {item.type === 'video' ? (
                      <video src={item.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => deleteMediaMutation.mutate(item.id)}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                    {item.type === 'video' && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                        فیلم
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/30">
            <GoldButton variant="outline" onClick={() => setIsDialogOpen(false)}>انصراف</GoldButton>
            <GoldButton onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
              ذخیره
            </GoldButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
