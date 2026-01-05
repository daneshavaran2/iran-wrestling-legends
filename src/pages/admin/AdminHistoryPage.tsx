import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronLeft, Loader2, Save } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HistorySection {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  highlighted_quote: string | null;
  parent_id: string | null;
  display_order: number;
}

export default function AdminHistoryPage() {
  const queryClient = useQueryClient();
  const [editingSection, setEditingSection] = useState<HistorySection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { data: sections, isLoading } = useQuery({
    queryKey: ['admin-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('history_sections')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as HistorySection[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (section: Partial<HistorySection> & { id?: string }) => {
      if (section.id) {
        const { error } = await supabase
          .from('history_sections')
          .update({
            title: section.title,
            slug: section.slug,
            content: section.content,
            highlighted_quote: section.highlighted_quote,
            parent_id: section.parent_id,
            display_order: section.display_order,
          })
          .eq('id', section.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('history_sections')
          .insert({
            title: section.title!,
            slug: section.slug!,
            content: section.content,
            highlighted_quote: section.highlighted_quote,
            parent_id: section.parent_id,
            display_order: section.display_order,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-history'] });
      setIsDialogOpen(false);
      setEditingSection(null);
      toast.success('ذخیره شد');
    },
    onError: () => toast.error('خطا در ذخیره'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('history_sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-history'] });
      toast.success('حذف شد');
    },
    onError: () => toast.error('خطا در حذف'),
  });

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedSections(newSet);
  };

  const rootSections = sections?.filter(s => !s.parent_id) || [];
  const getChildren = (parentId: string) => sections?.filter(s => s.parent_id === parentId) || [];

  const handleAdd = (parentId?: string) => {
    setEditingSection({
      id: '',
      title: '',
      slug: '',
      content: '',
      highlighted_quote: '',
      parent_id: parentId || null,
      display_order: (sections?.length || 0) + 1,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingSection?.title || !editingSection?.slug) {
      toast.error('عنوان و نشانی الزامی است');
      return;
    }
    saveMutation.mutate(editingSection);
  };

  const renderSection = (section: HistorySection, level = 0) => {
    const children = getChildren(section.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedSections.has(section.id);

    return (
      <div key={section.id} style={{ marginRight: level * 24 }}>
        <div className="flex items-center gap-2 p-3 border-b border-border/30 hover:bg-muted/30 transition-colors">
          {hasChildren ? (
            <button onClick={() => toggleExpand(section.id)} className="p-1">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}
          
          <span className="flex-1 font-medium">{section.title}</span>
          <span className="text-xs text-muted-foreground">/{section.slug}</span>
          
          <GoldButton
            variant="ghost"
            size="sm"
            onClick={() => handleAdd(section.id)}
          >
            <Plus className="h-4 w-4" />
          </GoldButton>
          <GoldButton
            variant="ghost"
            size="sm"
            onClick={() => { setEditingSection(section); setIsDialogOpen(true); }}
          >
            <Edit2 className="h-4 w-4" />
          </GoldButton>
          <GoldButton
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('آیا از حذف مطمئن هستید؟')) {
                deleteMutation.mutate(section.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </GoldButton>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="border-r border-border/30">
            {children.map(child => renderSection(child, level + 1))}
          </div>
        )}
      </div>
    );
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
        <h1 className="text-2xl font-bold text-gold">مدیریت تاریخچه</h1>
        <GoldButton onClick={() => handleAdd()}>
          <Plus className="h-5 w-5 ml-2" />
          افزودن بخش جدید
        </GoldButton>
      </div>

      <GlassCard>
        {rootSections.length > 0 ? (
          rootSections.map(section => renderSection(section))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            بخشی وجود ندارد
          </div>
        )}
      </GlassCard>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSection?.id ? 'ویرایش بخش' : 'افزودن بخش جدید'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">عنوان</label>
              <input
                className="w-full p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                value={editingSection?.title || ''}
                onChange={(e) => setEditingSection(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">نشانی (slug)</label>
              <input
                className="w-full p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                value={editingSection?.slug || ''}
                onChange={(e) => setEditingSection(prev => prev ? { ...prev, slug: e.target.value } : null)}
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">محتوا</label>
              <textarea
                className="w-full min-h-[200px] p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                value={editingSection?.content || ''}
                onChange={(e) => setEditingSection(prev => prev ? { ...prev, content: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">نقل قول برجسته</label>
              <input
                className="w-full p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                value={editingSection?.highlighted_quote || ''}
                onChange={(e) => setEditingSection(prev => prev ? { ...prev, highlighted_quote: e.target.value } : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ترتیب نمایش</label>
              <input
                type="number"
                className="w-full p-3 rounded-lg bg-background/50 border border-border/50 focus:border-primary focus:outline-none"
                value={editingSection?.display_order?.toString() || '0'}
                onChange={(e) => setEditingSection(prev => prev ? { ...prev, display_order: parseInt(e.target.value) || 0 } : null)}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <GoldButton variant="outline" onClick={() => setIsDialogOpen(false)}>
                انصراف
              </GoldButton>
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
