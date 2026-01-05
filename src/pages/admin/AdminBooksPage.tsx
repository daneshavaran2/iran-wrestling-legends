import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, Save, BookOpen, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UploadDropzone } from '@/components/UploadDropzone';
import { useMediaUpload } from '@/hooks/useMediaUpload';

interface Book {
  id: string;
  title: string;
  author: string;
  summary: string | null;
  cover_image_url: string | null;
  display_order: number;
}

export default function AdminBooksPage() {
  const queryClient = useQueryClient();
  const { uploadFile, isUploading } = useMediaUpload();
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: books, isLoading } = useQuery({
    queryKey: ['admin-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Book[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (book: Partial<Book> & { id?: string }) => {
      if (book.id) {
        const { error } = await supabase.from('books').update({
          title: book.title,
          author: book.author,
          summary: book.summary,
          cover_image_url: book.cover_image_url,
          display_order: book.display_order,
        }).eq('id', book.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('books').insert({
          title: book.title!,
          author: book.author!,
          summary: book.summary,
          cover_image_url: book.cover_image_url,
          display_order: book.display_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      setIsDialogOpen(false);
      setEditingBook(null);
      toast.success('ذخیره شد');
    },
    onError: () => toast.error('خطا در ذخیره'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      toast.success('حذف شد');
    },
  });

  const handleAdd = () => {
    setEditingBook({
      id: '',
      title: '',
      author: '',
      summary: '',
      cover_image_url: '',
      display_order: (books?.length || 0) + 1,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingBook?.title || !editingBook?.author) {
      toast.error('عنوان و نویسنده الزامی است');
      return;
    }
    saveMutation.mutate(editingBook);
  };

  const handleCoverUpload = async (files: File[]) => {
    if (!editingBook || files.length === 0) return;
    try {
      const url = await uploadFile(files[0], editingBook.id || 'new');
      setEditingBook({ ...editingBook, cover_image_url: url });
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
        <h1 className="text-2xl font-bold text-gold">مدیریت کتاب‌ها</h1>
        <GoldButton onClick={handleAdd}>
          <Plus className="h-5 w-5 ml-2" />
          افزودن کتاب
        </GoldButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {books?.map((book) => (
          <GlassCard key={book.id} className="overflow-hidden">
            <div className="aspect-[3/4] relative">
              {book.cover_image_url ? (
                <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold mb-1 line-clamp-1">{book.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{book.author}</p>
              <div className="flex gap-2">
                <GoldButton variant="ghost" size="sm" onClick={() => { setEditingBook(book); setIsDialogOpen(true); }}>
                  <Edit2 className="h-4 w-4" />
                </GoldButton>
                <GoldButton
                  variant="ghost"
                  size="sm"
                  onClick={() => { if (confirm('حذف شود؟')) deleteMutation.mutate(book.id); }}
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
            <DialogTitle>{editingBook?.id ? 'ویرایش کتاب' : 'افزودن کتاب'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">عنوان کتاب</label>
              <input
                className="w-full p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                value={editingBook?.title || ''}
                onChange={(e) => setEditingBook(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">نویسنده</label>
              <input
                className="w-full p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                value={editingBook?.author || ''}
                onChange={(e) => setEditingBook(prev => prev ? { ...prev, author: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">خلاصه</label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                value={editingBook?.summary || ''}
                onChange={(e) => setEditingBook(prev => prev ? { ...prev, summary: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">تصویر جلد</label>
              {editingBook?.cover_image_url ? (
                <div className="relative w-32 aspect-[3/4]">
                  <img src={editingBook.cover_image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    onClick={() => setEditingBook(prev => prev ? { ...prev, cover_image_url: '' } : null)}
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
                value={editingBook?.display_order?.toString() || '0'}
                onChange={(e) => setEditingBook(prev => prev ? { ...prev, display_order: parseInt(e.target.value) || 0 } : null)}
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
    </div>
  );
}
