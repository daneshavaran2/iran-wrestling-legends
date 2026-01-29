
# Complete Multi-Language Deep Pages Translation Plan

## Analysis Summary

Based on the screenshot and code review, I found **14 pages** with hardcoded Persian text that need translation. The screenshot shows `/history/[slug]` page with untranslated text like "بازگشت به تاریخچه" and "رسانه‌ها".

---

## Pages Requiring Translation

### High Priority: Detail Pages (Currently Visible in Screenshot)

| Page | File | Hardcoded Persian Text |
|------|------|------------------------|
| HistoryDetailPage | `src/pages/HistoryDetailPage.tsx` | "بازگشت به تاریخچه", "رسانه‌ها" |
| BuildingDetailPage | `src/pages/BuildingDetailPage.tsx` | "بازگشت به بناها", "گالری تصاویر" |
| AlbumGalleryPage | `src/pages/AlbumGalleryPage.tsx` | "آلبوم یافت نشد", "بازگشت به آلبوم‌ها", "تصویری در این آلبوم وجود ندارد" |

### Medium Priority: Profile/Error States

| Page | File | Hardcoded Persian Text |
|------|------|------------------------|
| WrestlerProfilePage | `src/pages/WrestlerProfilePage.tsx` | "خطا در بارگذاری ویدیو", "فرمت‌های پشتیبانی‌شده: MP4، WebM", "تلاش مجدد" |

### Already Translated (Confirmed Working)

| Page | Status |
|------|--------|
| BooksListPage | Uses `t()` for all strings |
| BuildingsListPage | Uses `t()` for all strings |
| AlbumsListPage | Uses `t()` for all strings |
| AboutMuseumPage | Uses `t()` for all strings |
| MuseumHomePage | Uses `t()` for all strings |
| AdminLoginPage | Uses `t()` for all strings |
| AdminSetupPage | Uses `t()` for all strings |
| AdminDashboardPage | Uses `t()` for all strings |
| CacheSettingsPage | Uses `t()` for all strings |
| InstallPage | Uses `t()` for all strings |
| InstallGuidePage | Uses `t()` for all strings |
| NotFound | Uses `t()` for all strings |

---

## New Translation Keys Required

### For Detail Pages

```json
{
  "history": {
    "backToHistory": "Back to History",
    "mediaSection": "Media"
  },
  "buildings": {
    "backToBuildings": "Back to Buildings",
    "imageGallery": "Image Gallery"
  },
  "albums": {
    "notFound": "Album not found",
    "backToAlbums": "Back to Albums",
    "noPhotos": "No photos in this album",
    "image": "Image"
  },
  "common": {
    "videoError": "Error loading video",
    "supportedFormats": "Supported formats: MP4, WebM"
  }
}
```

---

## Implementation Steps

### Step 1: Update Locale Files

**Files to modify:**
- `src/locales/fa.json` - Add Persian keys
- `src/locales/en.json` - Add English translations
- `src/locales/ar.json` - Add Arabic translations

### Step 2: Update Detail Pages

**HistoryDetailPage.tsx:**
```typescript
// Add import
import { useLanguage } from '@/contexts/LanguageContext';

// In component
const { t, dir } = useLanguage();

// Replace:
"بازگشت به تاریخچه" → {t('history.backToHistory')}
"رسانه‌ها" → {t('history.mediaSection')}
```

**BuildingDetailPage.tsx:**
```typescript
const { t, dir } = useLanguage();

// Replace:
"بازگشت به بناها" → {t('buildings.backToBuildings')}
"گالری تصاویر" → {t('buildings.imageGallery')}
```

**AlbumGalleryPage.tsx:**
```typescript
const { t, dir } = useLanguage();

// Replace:
"آلبوم یافت نشد" → {t('albums.notFound')}
"بازگشت به آلبوم‌ها" → {t('albums.backToAlbums')}
"تصویری در این آلبوم وجود ندارد" → {t('albums.noPhotos')}
`تصویر ${index + 1}` → `${t('albums.image')} ${index + 1}`
```

**WrestlerProfilePage.tsx:**
```typescript
// Replace hardcoded error messages:
"خطا در بارگذاری ویدیو" → {t('common.videoError')}
"فرمت‌های پشتیبانی‌شده: MP4، WebM" → {t('common.supportedFormats')}
"تلاش مجدد" → {t('common.retry')}
```

### Step 3: Add RTL/LTR Support for Arrow Icons

For pages with back buttons, ensure arrow direction changes based on language:

```typescript
<ArrowRight className={`h-5 w-5 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
```

---

## Files to Modify

| File | Type of Change |
|------|----------------|
| `src/locales/fa.json` | Add new keys |
| `src/locales/en.json` | Add new keys |
| `src/locales/ar.json` | Add new keys |
| `src/pages/HistoryDetailPage.tsx` | Add useLanguage, replace 2 strings |
| `src/pages/BuildingDetailPage.tsx` | Add useLanguage, replace 2 strings |
| `src/pages/AlbumGalleryPage.tsx` | Add useLanguage, replace 4 strings |
| `src/pages/WrestlerProfilePage.tsx` | Replace 3 error message strings |

---

## Translation Content

### Persian (fa.json) - Add:
```json
{
  "history": {
    "backToHistory": "بازگشت به تاریخچه",
    "mediaSection": "رسانه‌ها"
  },
  "buildings": {
    "backToBuildings": "بازگشت به بناها",
    "imageGallery": "گالری تصاویر"
  },
  "albums": {
    "notFound": "آلبوم یافت نشد",
    "backToAlbums": "بازگشت به آلبوم‌ها",
    "noPhotos": "تصویری در این آلبوم وجود ندارد",
    "image": "تصویر"
  },
  "common": {
    "videoError": "خطا در بارگذاری ویدیو",
    "supportedFormats": "فرمت‌های پشتیبانی‌شده: MP4، WebM"
  }
}
```

### English (en.json) - Add:
```json
{
  "history": {
    "backToHistory": "Back to History",
    "mediaSection": "Media"
  },
  "buildings": {
    "backToBuildings": "Back to Buildings",
    "imageGallery": "Image Gallery"
  },
  "albums": {
    "notFound": "Album not found",
    "backToAlbums": "Back to Albums",
    "noPhotos": "No photos in this album",
    "image": "Image"
  },
  "common": {
    "videoError": "Error loading video",
    "supportedFormats": "Supported formats: MP4, WebM"
  }
}
```

### Arabic (ar.json) - Add:
```json
{
  "history": {
    "backToHistory": "العودة للتاريخ",
    "mediaSection": "الوسائط"
  },
  "buildings": {
    "backToBuildings": "العودة للمباني",
    "imageGallery": "معرض الصور"
  },
  "albums": {
    "notFound": "الألبوم غير موجود",
    "backToAlbums": "العودة للألبومات",
    "noPhotos": "لا توجد صور في هذا الألبوم",
    "image": "صورة"
  },
  "common": {
    "videoError": "خطأ في تحميل الفيديو",
    "supportedFormats": "الصيغ المدعومة: MP4، WebM"
  }
}
```

---

## Summary

| Metric | Count |
|--------|-------|
| Pages to update | 4 |
| Locale files to update | 3 |
| New translation keys | ~12 |
| Hardcoded strings to replace | ~11 |

This implementation will complete 100% multi-language coverage across all public pages including detail/gallery pages.
