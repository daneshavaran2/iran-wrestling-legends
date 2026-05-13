import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, History, Users, Building2, BookOpen, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { GlassCard } from '@/components/ui/GlassCard';
import { getTable } from '@/lib/contentSnapshot';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'wrestler' | 'history' | 'building' | 'book';
  path: string;
}

const typeIcons = {
  wrestler: Users,
  history: History,
  building: Building2,
  book: BookOpen,
};

const typeLabels = {
  wrestler: 'کشتی‌گیر',
  history: 'تاریخچه',
  building: 'بنا',
  book: 'کتاب',
};

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const allResults: SearchResult[] = [];
    const q = searchQuery.toLowerCase();
    const m = (s: any) => typeof s === 'string' && s.toLowerCase().includes(q);

    try {
      const [wrestlers, history, buildings, books] = await Promise.all([
        getTable<any>('wrestlers'),
        getTable<any>('history_sections'),
        getTable<any>('buildings'),
        getTable<any>('books'),
      ]);

      wrestlers
        .filter((w: any) => (w.is_visible ?? true) && (m(w.name) || m(w.bio)))
        .slice(0, 5)
        .forEach((w: any) => allResults.push({
          id: w.id, title: w.name,
          subtitle: w.bio?.substring(0, 60),
          type: 'wrestler', path: `/wrestler/${w.id}`,
        }));

      history
        .filter((h: any) => m(h.title) || m(h.content))
        .slice(0, 5)
        .forEach((h: any) => allResults.push({
          id: h.id, title: h.title,
          subtitle: h.highlighted_quote || undefined,
          type: 'history', path: `/history/${h.slug}`,
        }));

      buildings
        .filter((b: any) => m(b.name) || m(b.description))
        .slice(0, 5)
        .forEach((b: any) => allResults.push({
          id: b.id, title: b.name,
          subtitle: b.description?.substring(0, 60),
          type: 'building', path: `/buildings/${b.id}`,
        }));

      books
        .filter((b: any) => m(b.title) || m(b.author))
        .slice(0, 5)
        .forEach((b: any) => allResults.push({
          id: b.id, title: b.title,
          subtitle: b.author,
          type: 'book', path: `/books`,
        }));

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    onClose();
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border/50">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="جستجو در کشتی‌گیران، تاریخچه، بناها و کتاب‌ها..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-lg"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-muted rounded">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : query.length < 2 ? (
            <div className="text-center py-8 text-muted-foreground">
              حداقل ۲ کاراکتر وارد کنید
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              نتیجه‌ای یافت نشد
            </div>
          ) : (
            Object.entries(groupedResults).map(([type, items]) => {
              const Icon = typeIcons[type as keyof typeof typeIcons];
              const label = typeLabels[type as keyof typeof typeLabels];

              return (
                <div key={type} className="mb-4">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </div>
                  {items.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className="w-full text-right px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="font-medium">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {result.subtitle}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
