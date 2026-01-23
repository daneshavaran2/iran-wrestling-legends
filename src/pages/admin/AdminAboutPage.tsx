import React, { useState, useEffect } from 'react';
import { Loader2, Save, X, Image as ImageIcon, Video } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { UploadDropzone } from '@/components/UploadDropzone';
import { useMediaUpload } from '@/hooks/useMediaUpload';

interface AboutMedia {
  id: string;
  type: string;
  url: string;
  title: string | null;
  display_order: number;
}

export default function AdminAboutPage() {
  const queryClient = useQueryClient();
  const { uploadFile, isUploading } = useMediaUpload();
  const [formData, setFormData] = useState({
    about_title: '',
    about_content: '',
    about_image_url: '',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'main')
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: media } = useQuery({
    queryKey: ['about-media'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('about_media')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as AboutMedia[];
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        about_title: settings.about_title || 'درباره موزه کشتی ایران',
        about_content: settings.about_content || '',
        about_image_url: settings.about_image_url || '',
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('app_settings')
        .update(formData)
        .eq('id', 'main');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-app-settings'] });
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success('ذخیره شد');
    },
    onError: () => toast.error('خطا در ذخیره'),
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('about_media').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['about-media'] });
      toast.success('رسانه حذف شد');
    },
  });

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;
    try {
      const url = await uploadFile(files[0], 'about');
      setFormData(prev => ({ ...prev, about_image_url: url }));
      toast.success('تصویر آپلود شد');
    } catch {
      toast.error('خطا در آپلود');
    }
  };

  const handleMediaUpload = async (files: File[], type: 'image' | 'video') => {
    if (files.length === 0) return;
    try {
      for (const file of files) {
        const url = await uploadFile(file, 'about-gallery');
        await supabase.from('about_media').insert({
          type,
          url,
          display_order: (media?.length || 0) + 1,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['about-media'] });
      toast.success('آپلود شد');
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
        <h1 className="text-2xl font-bold text-gold">مدیریت درباره موزه</h1>
        <GoldButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
          ذخیره تغییرات
        </GoldButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Content */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-bold mb-4">محتوای اصلی</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">عنوان صفحه</label>
              <input
                className="w-full p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                value={formData.about_title}
                onChange={(e) => setFormData(prev => ({ ...prev, about_title: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">لوگو / تصویر اصلی</label>
              {formData.about_image_url ? (
                <div className="relative w-32 aspect-square">
                  <img src={formData.about_image_url} alt="" className="w-full h-full object-contain rounded-lg bg-muted" />
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, about_image_url: '' }))}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/80"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="max-w-xs">
                  <UploadDropzone onFilesSelected={handleImageUpload} isUploading={isUploading} accept="image/*" multiple={false} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">محتوای صفحه</label>
              <textarea
                className="w-full min-h-[300px] p-4 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none leading-relaxed"
                value={formData.about_content}
                onChange={(e) => setFormData(prev => ({ ...prev, about_content: e.target.value }))}
                placeholder="متن معرفی موزه کشتی ایران را اینجا بنویسید..."
              />
            </div>
          </div>
        </GlassCard>

        {/* Media Gallery */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-bold mb-4">گالری رسانه</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
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

          <div className="grid grid-cols-3 gap-3">
            {media?.map((item) => (
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
        </GlassCard>
      </div>
    </div>
  );
}
