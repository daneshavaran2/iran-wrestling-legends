import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface BucketStats {
  name: string;
  displayName: string;
  sizeBytes: number;
  sizeMB: number;
  fileCount: number;
}

interface StorageStats {
  buckets: BucketStats[];
  totalSizeBytes: number;
  totalSizeMB: number;
  totalFiles: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const BUCKET_NAMES: { id: string; displayName: string }[] = [
  { id: 'wrestler-media', displayName: 'تصاویر کشتی‌گیرها' },
  { id: 'album-media', displayName: 'تصاویر آلبوم‌ها' },
  { id: 'building-media', displayName: 'تصاویر بناها' },
  { id: 'museum-audio', displayName: 'فایل‌های صوتی' },
];

export function useStorageStats(): StorageStats {
  const [buckets, setBuckets] = useState<BucketStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const statsPromises = BUCKET_NAMES.map(async (bucket) => {
        let totalSize = 0;
        let fileCount = 0;

        try {
          // List root items
          const { data: rootItems, error: listError } = await supabase.storage
            .from(bucket.id)
            .list('', { limit: 1000 });

          if (listError) {
            console.warn(`Failed to list bucket ${bucket.id}:`, listError);
            return {
              name: bucket.id,
              displayName: bucket.displayName,
              sizeBytes: 0,
              sizeMB: 0,
              fileCount: 0,
            };
          }

          // Process each item
          for (const item of rootItems || []) {
            if (item.id) {
              // It's a folder - list its contents
              const { data: folderContents } = await supabase.storage
                .from(bucket.id)
                .list(item.name, { limit: 1000 });

              if (folderContents) {
                for (const file of folderContents) {
                  if (file.metadata?.size) {
                    totalSize += file.metadata.size;
                    fileCount++;
                  }
                }
              }
            } else if (item.metadata?.size) {
              // It's a file at root level
              totalSize += item.metadata.size;
              fileCount++;
            }
          }
        } catch (e) {
          console.warn(`Error processing bucket ${bucket.id}:`, e);
        }

        return {
          name: bucket.id,
          displayName: bucket.displayName,
          sizeBytes: totalSize,
          sizeMB: totalSize / (1024 * 1024),
          fileCount,
        };
      });

      const results = await Promise.all(statsPromises);
      setBuckets(results);
    } catch (e) {
      console.error('Failed to fetch storage stats:', e);
      setError('خطا در دریافت آمار فضای ذخیره‌سازی');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalSizeBytes = buckets.reduce((sum, b) => sum + b.sizeBytes, 0);
  const totalFiles = buckets.reduce((sum, b) => sum + b.fileCount, 0);

  return {
    buckets,
    totalSizeBytes,
    totalSizeMB: totalSizeBytes / (1024 * 1024),
    totalFiles,
    isLoading,
    error,
    refresh: fetchStats,
  };
}
