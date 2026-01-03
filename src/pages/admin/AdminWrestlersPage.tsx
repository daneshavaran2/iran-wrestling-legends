import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchInput } from '@/components/ui/GlassInput';
import { GoldButton } from '@/components/ui/GoldButton';
import { SkeletonTable } from '@/components/ui/skeleton-cards';
import { EmptyState, ErrorState } from '@/components/ui/StateComponents';
import { useWrestlers } from '@/contexts/WrestlerContext';
import { wrestlingStyles } from '@/data/wrestlers';
import { cn } from '@/lib/utils';

export default function AdminWrestlersPage() {
  const { wrestlers, isLoading, error, deleteWrestler } = useWrestlers();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredWrestlers = wrestlers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`آیا از حذف "${name}" اطمینان دارید؟`)) {
      setDeletingId(id);
      try {
        await deleteWrestler(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gold mb-2">مدیریت کشتی‌گیرها</h1>
          <p className="text-muted-foreground">
            {wrestlers.length} کشتی‌گیر در سیستم ثبت شده است
          </p>
        </div>
        <Link to="/admin/wrestlers/new">
          <GoldButton className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            افزودن کشتی‌گیر
          </GoldButton>
        </Link>
      </div>

      {/* Search */}
      <GlassCard className="p-4">
        <SearchInput
          placeholder="جستجوی کشتی‌گیر..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </GlassCard>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable />
      ) : filteredWrestlers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-16 w-16" />}
          title={searchQuery ? 'نتیجه‌ای یافت نشد' : 'کشتی‌گیری ثبت نشده'}
          description={searchQuery ? 'عبارت جستجو را تغییر دهید' : 'اولین کشتی‌گیر را اضافه کنید'}
          action={
            !searchQuery && (
              <Link to="/admin/wrestlers/new">
                <GoldButton>
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن کشتی‌گیر
                </GoldButton>
              </Link>
            )
          }
        />
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                    نام
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                    سبک
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                    وزن
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                    استان
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredWrestlers.map((wrestler, index) => (
                  <tr 
                    key={wrestler.id}
                    className={cn(
                      'border-b border-border/30 hover:bg-muted/30 transition-colors animate-fade-in',
                      deletingId === wrestler.id && 'opacity-50'
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {wrestler.image_url ? (
                            <img 
                              src={wrestler.image_url} 
                              alt={wrestler.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              —
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{wrestler.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                        {wrestlingStyles[wrestler.style]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {wrestler.weight_class || '—'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {wrestler.province || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/wrestlers/${wrestler.id}`}>
                          <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </Link>
                        <button 
                          onClick={() => handleDelete(wrestler.id, wrestler.name)}
                          disabled={deletingId === wrestler.id}
                          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
