import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronLeft, Loader2, Save, Image as ImageIcon, Video, X, GripVertical } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HistorySection {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  highlighted_quote: string | null;
  parent_id: string | null;
  display_order: number;
}

interface HistoryMedia {
  id: string;
  section_id: string;
  type: string;
  url: string;
  title: string | null;
  display_order: number;
}

function SortableSectionRow({ section, children, hasChildren, isExpanded, onToggle, onAdd, onEdit, onDelete }: {
  section: HistorySection;
  children?: React.ReactNode;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 p-3 border-b border-border/30 hover:bg-muted/30 transition-colors group">
        <div
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {hasChildren ? (
          <button onClick={onToggle} className="p-1">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        ) : (
          <div className="w-6" />
        )}
        
        <span className="flex-1 font-medium">{section.title}</span>
        <span className="text-xs text-muted-foreground">/{section.slug}</span>
        
        <GoldButton variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </GoldButton>
        <GoldButton variant="ghost" size="sm" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </GoldButton>
        <GoldButton variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </GoldButton>
      </div>
      {children}
    </div>
  );
}

export default function AdminHistoryPage() {
  const queryClient = useQueryClient();
  const { uploadFile, isUploading } = useMediaUpload();
  const [editingSection, setEditingSection] = useState<HistorySection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const { data: sectionMedia } = useQuery({
    queryKey: ['history-media', selectedSectionId],
    queryFn: async () => {
      if (!selectedSectionId) return [];
      const { data, error } = await supabase
        .from('history_media')
        .select('*')
        .eq('section_id', selectedSectionId)
        .order('display_order');
      if (error) throw error;
      return data as HistoryMedia[];
    },
    enabled: !!selectedSectionId,
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

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('history_media').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history-media', selectedSectionId] });
      toast.success('رسانه حذف شد');
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (items: { id: string; display_order: number }[]) => {
      for (const item of items) {
        await supabase.from('history_sections').update({ display_order: item.display_order }).eq('id', item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-history'] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !sections) return;

    const rootSections = sections.filter(s => !s.parent_id);
    const oldIndex = rootSections.findIndex((s) => s.id === active.id);
    const newIndex = rootSections.findIndex((s) => s.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newSections = arrayMove(rootSections, oldIndex, newIndex);

    const updates = newSections.map((section, index) => ({
      id: section.id,
      display_order: index + 1,
    }));

    updateOrderMutation.mutate(updates);
  };

  const handleMediaUpload = async (files: File[], type: 'image' | 'video') => {
    if (!selectedSectionId || files.length === 0) return;
    try {
      for (const file of files) {
        const url = await uploadFile(file, selectedSectionId);
        await supabase.from('history_media').insert({
          section_id: selectedSectionId,
          type,
          url,
          display_order: (sectionMedia?.length || 0) + 1,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['history-media', selectedSectionId] });
      toast.success('آپلود شد');
    } catch {
      toast.error('خطا در آپلود');
    }
  };

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

  const handleEdit = (section: HistorySection) => {
    setEditingSection(section);
    setSelectedSectionId(section.id);
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
        <SortableSectionRow
          section={section}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggle={() => toggleExpand(section.id)}
          onAdd={() => handleAdd(section.id)}
          onEdit={() => handleEdit(section)}
          onDelete={() => {
            if (confirm('آیا از حذف مطمئن هستید؟')) {
              deleteMutation.mutate(section.id);
            }
          }}
        >
          {hasChildren && isExpanded && (
            <div className="border-r border-border/30">
              {children.map(child => renderSection(child, level + 1))}
            </div>
          )}
        </SortableSectionRow>
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

      <p className="text-xs text-muted-foreground mb-4">برای تغییر ترتیب، بخش‌ها را بکشید و رها کنید</p>

      <GlassCard>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rootSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {rootSections.length > 0 ? (
              rootSections.map(section => renderSection(section))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                بخشی وجود ندارد
              </div>
            )}
          </SortableContext>
        </DndContext>
      </GlassCard>

      {/* Edit Dialog with Tabs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSection?.id ? 'ویرایش بخش' : 'افزودن بخش جدید'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="content" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">محتوا</TabsTrigger>
              <TabsTrigger value="media" disabled={!editingSection?.id}>رسانه‌ها</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
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
                {sectionMedia?.map((item) => (
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
            <GoldButton variant="outline" onClick={() => setIsDialogOpen(false)}>
              انصراف
            </GoldButton>
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
