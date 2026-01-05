import React, { useState, useEffect } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UploadDropzone } from '@/components/UploadDropzone';
import { useMediaUpload } from '@/hooks/useMediaUpload';

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

      <GlassCard className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">عنوان صفحه</label>
            <input
              className="w-full p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
              value={formData.about_title}
              onChange={(e) => setFormData(prev => ({ ...prev, about_title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">تصویر</label>
            {formData.about_image_url ? (
              <div className="relative w-48 aspect-square">
                <img src={formData.about_image_url} alt="" className="w-full h-full object-contain rounded-lg bg-muted" />
                <button
                  onClick={() => setFormData(prev => ({ ...prev, about_image_url: '' }))}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/80"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : (
              <div className="max-w-md">
                <UploadDropzone onFilesSelected={handleImageUpload} isUploading={isUploading} accept="image/*" multiple={false} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">محتوای صفحه</label>
            <textarea
              className="w-full min-h-[400px] p-4 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none leading-relaxed"
              value={formData.about_content}
              onChange={(e) => setFormData(prev => ({ ...prev, about_content: e.target.value }))}
              placeholder="متن معرفی موزه کشتی ایران را اینجا بنویسید..."
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
