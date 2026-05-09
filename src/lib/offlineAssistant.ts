// Offline AI assistant fallback - uses cached museum data to answer questions
// when there is no internet connection. Performs token-based search over
// wrestlers, achievements, history, buildings, books, and albums.

import type { Language } from '@/contexts/LanguageContext';

const CACHE_KEYS = {
  WRESTLERS: 'museum_wrestlers_cache',
  ACHIEVEMENTS: 'museum_achievements_cache',
  MEDIA: 'museum_media_cache',
  HISTORY: 'museum_history_cache',
  HISTORY_ALL: 'museum_history_all_cache',
  BUILDINGS: 'museum_buildings_cache',
  BOOKS: 'museum_books_cache',
  ALBUMS: 'museum_albums_cache',
};

interface AnyRecord {
  [key: string]: unknown;
}

function readCache<T = AnyRecord>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as T[];
    if (parsed && Array.isArray(parsed.data)) return parsed.data as T[];
    return [];
  } catch {
    return [];
  }
}

// Normalize Persian/Arabic chars for matching
function normalize(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[يﻱﻲﻴﻳ]/g, 'ی')
    .replace(/[كﻙﻚﻜﻛ]/g, 'ک')
    .replace(/[ةﺓ]/g, 'ه')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[\s،,.\?!؟()«»"'\-_/]+/)
    .filter(t => t.length > 1);
}

const STOP_WORDS = new Set([
  'و','در','به','از','که','چه','چی','چیست','کیست','کیه','چطور','چگونه',
  'بود','است','هست','شد','شده','می','را','این','آن','یک','بر','با','تا',
  'the','is','a','an','of','to','in','on','at','for','what','who','where','when','how','why','about','tell','me','do','you','know',
  'ما','هو','من','ماذا','كيف','اين','متى','لماذا','هل','عن','في','إلى','مع',
]);

function score(haystack: string, queryTokens: string[]): number {
  const norm = normalize(haystack);
  if (!norm) return 0;
  let s = 0;
  for (const tok of queryTokens) {
    if (STOP_WORDS.has(tok)) continue;
    if (norm.includes(tok)) s += tok.length >= 4 ? 3 : 1;
  }
  return s;
}

const LABELS: Record<Language, Record<string, string>> = {
  fa: {
    notFound: 'متأسفانه در حالت آفلاین پاسخی برای این سؤال در داده‌های موزه پیدا نشد. لطفاً پس از اتصال به اینترنت دوباره تلاش کنید.',
    offlineNote: '_(پاسخ بر اساس دادهٔ آفلاین موزه)_',
    wrestler: 'کشتی‌گیر',
    bio: 'بیوگرافی',
    style: 'سبک',
    province: 'استان',
    weight: 'وزن',
    achievements: 'افتخارات',
    history: 'تاریخچه',
    building: 'بنا',
    book: 'کتاب',
    album: 'آلبوم',
    author: 'نویسنده',
  },
  en: {
    notFound: 'Sorry, no answer for this question was found in the offline museum data. Please try again when online.',
    offlineNote: '_(Answer based on offline museum data)_',
    wrestler: 'Wrestler',
    bio: 'Bio',
    style: 'Style',
    province: 'Province',
    weight: 'Weight',
    achievements: 'Achievements',
    history: 'History',
    building: 'Building',
    book: 'Book',
    album: 'Album',
    author: 'Author',
  },
  ar: {
    notFound: 'عذراً، لم يتم العثور على إجابة لهذا السؤال في بيانات المتحف دون اتصال. يرجى المحاولة مرة أخرى عند الاتصال.',
    offlineNote: '_(الإجابة بناءً على بيانات المتحف دون اتصال)_',
    wrestler: 'مصارع',
    bio: 'سيرة',
    style: 'الأسلوب',
    province: 'المحافظة',
    weight: 'الوزن',
    achievements: 'الإنجازات',
    history: 'التاريخ',
    building: 'المبنى',
    book: 'كتاب',
    album: 'ألبوم',
    author: 'المؤلف',
  },
};

export function answerOffline(question: string, language: Language = 'fa'): string {
  const L = LABELS[language] || LABELS.fa;
  const tokens = tokenize(question);
  if (tokens.length === 0) return L.notFound;

  const wrestlers = readCache<AnyRecord>(CACHE_KEYS.WRESTLERS);
  const achievements = readCache<AnyRecord>(CACHE_KEYS.ACHIEVEMENTS);
  const history = readCache<AnyRecord>(CACHE_KEYS.HISTORY_ALL);
  const buildings = readCache<AnyRecord>(CACHE_KEYS.BUILDINGS);
  const books = readCache<AnyRecord>(CACHE_KEYS.BOOKS);
  const albums = readCache<AnyRecord>(CACHE_KEYS.ALBUMS);

  type Hit = { type: string; score: number; record: AnyRecord };
  const hits: Hit[] = [];

  for (const w of wrestlers) {
    const text = [w.name, w.bio, w.full_story, w.success_path, w.province, w.weight_class].filter(Boolean).join(' ');
    const s = score(text, tokens);
    if (s > 0) hits.push({ type: 'wrestler', score: s + (score(String(w.name || ''), tokens) * 2), record: w });
  }
  for (const h of history) {
    const text = [h.title, h.content, h.highlighted_quote].filter(Boolean).join(' ');
    const s = score(text, tokens);
    if (s > 0) hits.push({ type: 'history', score: s, record: h });
  }
  for (const b of buildings) {
    const text = [b.name, b.description].filter(Boolean).join(' ');
    const s = score(text, tokens);
    if (s > 0) hits.push({ type: 'building', score: s, record: b });
  }
  for (const b of books) {
    const text = [b.title, b.author, b.summary].filter(Boolean).join(' ');
    const s = score(text, tokens);
    if (s > 0) hits.push({ type: 'book', score: s, record: b });
  }
  for (const a of albums) {
    const text = [a.title, a.description].filter(Boolean).join(' ');
    const s = score(text, tokens);
    if (s > 0) hits.push({ type: 'album', score: s, record: a });
  }

  hits.sort((a, b) => b.score - a.score);
  const top = hits.slice(0, 3);
  if (top.length === 0) return L.notFound;

  const parts: string[] = [];
  for (const hit of top) {
    const r = hit.record;
    if (hit.type === 'wrestler') {
      const wAch = achievements
        .filter(a => a.wrestler_id === r.id)
        .slice(0, 5)
        .map(a => `- ${a.title || ''} (${a.event || ''}, ${a.year || ''})`)
        .join('\n');
      parts.push(
        `### ${L.wrestler}: ${r.name}\n` +
        (r.bio ? `**${L.bio}:** ${r.bio}\n` : '') +
        (r.style ? `**${L.style}:** ${r.style}  ` : '') +
        (r.weight_class ? `**${L.weight}:** ${r.weight_class}  ` : '') +
        (r.province ? `**${L.province}:** ${r.province}\n` : '\n') +
        (wAch ? `\n**${L.achievements}:**\n${wAch}` : '')
      );
    } else if (hit.type === 'history') {
      parts.push(
        `### ${L.history}: ${r.title}\n` +
        (r.highlighted_quote ? `> ${r.highlighted_quote}\n\n` : '') +
        (r.content ? String(r.content).slice(0, 600) + (String(r.content).length > 600 ? '…' : '') : '')
      );
    } else if (hit.type === 'building') {
      parts.push(`### ${L.building}: ${r.name}\n${r.description || ''}`);
    } else if (hit.type === 'book') {
      parts.push(`### ${L.book}: ${r.title}\n**${L.author}:** ${r.author || '-'}\n\n${r.summary || ''}`);
    } else if (hit.type === 'album') {
      parts.push(`### ${L.album}: ${r.title}\n${r.description || ''}`);
    }
  }

  return `${parts.join('\n\n---\n\n')}\n\n${L.offlineNote}`;
}

export function isOfflineAssistantReady(): boolean {
  return readCache(CACHE_KEYS.WRESTLERS).length > 0 || readCache(CACHE_KEYS.HISTORY_ALL).length > 0;
}