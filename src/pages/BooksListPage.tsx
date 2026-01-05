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
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative py-8 px-6 2xl:py-12">
        <div className="container mx-auto">
          {/* Back Button & Title */}
          <div className="flex items-center gap-4 mb-8 animate-fade-in">
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
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold">
                <span className="text-gold">تألیفات</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                کتاب‌ها و آثار مکتوب درباره کشتی
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Books Grid */}
      <main className="container mx-auto px-6 pb-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-2xl" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <GlassCard className="p-12 text-center max-w-2xl mx-auto">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">محتوایی وجود ندارد</h3>
            <p className="text-muted-foreground">
              کتاب‌ها و تألیفات توسط مدیر اضافه خواهند شد
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {books.map((book, index) => (
              <div
                key={book.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <GlassCard className="overflow-hidden h-full">
                  {/* Cover Image */}
                  <div className="aspect-[3/4] bg-muted overflow-hidden">
                    {book.cover_image_url ? (
                      <LazyImage
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <BookOpen className="h-20 w-20 text-primary/30" />
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h2 className="text-lg md:text-xl font-bold mb-2 line-clamp-2">
                      {book.title}
                    </h2>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                      <User className="h-4 w-4" />
                      <span>{book.author}</span>
                    </div>
                    {book.summary && (
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {book.summary}
                      </p>
                    )}
                    {book.related_wrestler_id && (
                      <GoldButton
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/wrestler/${book.related_wrestler_id}`)}
                        className="mt-4"
                      >
                        مشاهده کشتی‌گیر مرتبط
                      </GoldButton>
                    )}
                  </div>
                </GlassCard>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
