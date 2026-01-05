import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, User } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useKioskMode } from '@/hooks/useKioskMode';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { LazyImage } from '@/components/ui/LazyImage';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_url: string | null;
  summary: string | null;
  related_wrestler_id: string | null;
}

export default function BooksListPage() {
  useKioskMode();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center gap-4 mb-4 animate-fade-in shrink-0">
        <GoldButton
          variant="ghost"
          size="lg"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowRight className="h-5 w-5" />
          بازگشت
        </GoldButton>
        <div>
          <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold">
            <span className="text-gold">تألیفات</span>
          </h1>
        </div>
      </header>

      {/* Books Grid */}
      <main className="flex-1 flex items-center overflow-hidden">
        <div className="w-full max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <GlassCard className="p-12 text-center max-w-md mx-auto">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">محتوایی وجود ندارد</h3>
              <p className="text-muted-foreground">
                کتاب‌ها و تألیفات توسط مدیر اضافه خواهند شد
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {books.map((book, index) => (
                <div
                  key={book.id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <GlassCard className="overflow-hidden h-full group cursor-pointer hover:border-primary/40 transition-all">
                    {/* Cover Image */}
                    <div className="aspect-[3/4] bg-muted overflow-hidden">
                      {book.cover_image_url ? (
                        <LazyImage
                          src={book.cover_image_url}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <BookOpen className="h-12 w-12 text-primary/30" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-3">
                      <h2 className="text-sm md:text-base font-bold mb-1 line-clamp-2 group-hover:text-gold transition-colors">
                        {book.title}
                      </h2>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <User className="h-3 w-3" />
                        <span className="line-clamp-1">{book.author}</span>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
