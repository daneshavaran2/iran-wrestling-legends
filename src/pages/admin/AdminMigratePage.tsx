import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2, UploadCloud, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/apiClient';

const TABLES = [
  'wrestlers',
  'wrestler_media',
  'achievements',
  'albums',
  'album_photos',
  'history_sections',
  'history_media',
  'buildings',
  'building_images',
  'books',
  'about_media',
  'app_settings',
  'translations',
] as const;

type Status = 'pending' | 'running' | 'ok' | 'error';
interface RowState {
  status: Status;
  count?: number;
  error?: string;
}

const DEFAULT_URL = 'https://etbekvhdroqiddcteqdq.supabase.co';
const DEFAULT_KEY =
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0YmVrdmhkcm9xaWRkY3RlcWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjU4MTUsImV4cCI6MjA4Mjk0MTgxNX0.cDiwofOdALtJ349janVwJtuItIRwvY3DC8ihO0rmlPU';

export default function AdminMigratePage() {
  const [supabaseUrl, setSupabaseUrl] = useState(DEFAULT_URL);
  const [anonKey, setAnonKey] = useState(DEFAULT_KEY);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(TABLES.map((t) => [t, { status: 'pending' as Status }])),
  );
  const [topError, setTopError] = useState<string | null>(null);

  const start = async () => {
    setRunning(true);
    setDone(false);
    setTotal(0);
    setTopError(null);
    setRows(Object.fromEntries(TABLES.map((t) => [t, { status: 'pending' as Status }])));

    try {
      const res = await fetch(`${API_BASE_URL || ''}/api/admin/migrate-from-supabase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseUrl, anonKey }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text.slice(0, 200)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const evt of events) {
          const lines = evt.split('\n');
          const event = lines.find((l) => l.startsWith('event: '))?.slice(7).trim();
          const dataLine = lines.find((l) => l.startsWith('data: '))?.slice(6);
          if (!event || !dataLine) continue;
          let data: any = {};
          try { data = JSON.parse(dataLine); } catch {}
          if (event === 'table_start') {
            setRows((p) => ({ ...p, [data.table]: { status: 'running' } }));
          } else if (event === 'table_done') {
            setRows((p) => ({
              ...p,
              [data.table]: data.ok
                ? { status: 'ok', count: data.count }
                : { status: 'error', error: data.error },
            }));
          } else if (event === 'done') {
            setTotal(data.total || 0);
            setDone(true);
          }
        }
      }
    } catch (err: any) {
      setTopError(String(err?.message || err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gold flex items-center gap-3">
            <UploadCloud className="h-8 w-8" />
            مهاجرت داده از Supabase
          </h1>
          <p className="text-muted-foreground mt-2">
            تمام جداول عمومی از Supabase خوانده و در پایگاه داده‌ی محلی (SQLite) ذخیره می‌شوند.
            فایل‌های Storage در این مرحله کپی نمی‌شوند و URL آن‌ها در ستون‌ها باقی می‌ماند.
          </p>
        </div>

        <GlassCard className="p-6 border border-orange-500/40 bg-orange-500/5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            این عملیات داده‌های موجود را با کلید اصلی (id) جایگزین می‌کند. قبل از اجرا یک نسخه‌ی
            پشتیبان بگیرید. این عملیات روی سرور بک‌اند Node اجرا می‌شود — در پیش‌نمایش Lovable در
            دسترس نیست.
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-4">
          <div>
            <Label htmlFor="url">Supabase URL</Label>
            <Input
              id="url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              disabled={running}
              dir="ltr"
            />
          </div>
          <div>
            <Label htmlFor="key">Anon Key</Label>
            <Input
              id="key"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              disabled={running}
              dir="ltr"
              className="font-mono text-xs"
            />
          </div>
          <Button onClick={start} disabled={running || !supabaseUrl || !anonKey} className="w-full">
            {running ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                در حال انتقال...
              </>
            ) : (
              'شروع مهاجرت'
            )}
          </Button>
          {topError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {topError}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4">وضعیت جداول</h2>
          <div className="space-y-2">
            {TABLES.map((t) => {
              const r = rows[t];
              return (
                <div
                  key={t}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <span className="font-mono text-sm">{t}</span>
                  <div className="flex items-center gap-3 text-sm">
                    {r.status === 'pending' && (
                      <span className="text-muted-foreground">در انتظار</span>
                    )}
                    {r.status === 'running' && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-primary">در حال انتقال</span>
                      </>
                    )}
                    {r.status === 'ok' && (
                      <>
                        <span className="text-emerald-400">{r.count} ردیف</span>
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </>
                    )}
                    {r.status === 'error' && (
                      <>
                        <span
                          className="text-destructive max-w-xs truncate"
                          title={r.error}
                        >
                          {r.error}
                        </span>
                        <XCircle className="h-5 w-5 text-destructive" />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {done && (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-lg text-center text-emerald-300">
              مهاجرت کامل شد — مجموعاً {total} ردیف منتقل شد.
            </div>
          )}
        </GlassCard>
      </div>
    </AdminLayout>
  );
}
