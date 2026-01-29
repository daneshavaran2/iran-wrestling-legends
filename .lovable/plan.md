
# Complete Multi-Language Implementation Plan

## Project Analysis

The Iran Wrestling Museum application currently has three locale files (fa.json, en.json, ar.json) with most static UI strings covered. However, several pages still contain **hardcoded Persian text** that bypasses the translation system.

---

## Current Coverage Analysis

| Page | useLanguage Hook | Hardcoded Text Found |
|------|-----------------|---------------------|
| MuseumHomePage | Yes | "ورود مدیران" (Admin button title) |
| WrestlersListPage | Yes | Missing: `wrestler.style`, `wrestler.allProvinces`, `wrestler.notFoundDesc` |
| WrestlerProfilePage | Yes | Complete |
| HistoryListPage | Yes | Complete |
| BooksListPage | Yes | Missing: `books.noContentDesc` |
| BuildingsListPage | Yes | Missing: `buildings.noContentDesc` |
| AlbumsListPage | Yes | Complete |
| AboutMuseumPage | Yes | Complete |
| CacheSettingsPage | **No** | All text is hardcoded Persian |
| InstallPage | **No** | All text is hardcoded Persian |
| InstallGuidePage | **No** | All text is hardcoded Persian |
| NotFound | **No** | All text is hardcoded Persian |
| AdminLoginPage | **No** | All text is hardcoded Persian |
| AdminSetupPage | **No** | All text is hardcoded Persian |
| AdminDashboardPage | **No** | All text is hardcoded Persian |
| ChatAssistant | Yes | Complete |

---

## Implementation Tasks

### Part 1: Add Missing Translation Keys to Locale Files

**File: `src/locales/en.json`** - Add these keys:

```json
{
  "wrestler": {
    "style": "Style",
    "allProvinces": "All Provinces",
    "notFoundDesc": "Try adjusting your search or filters"
  },
  "books": {
    "noContentDesc": "No books to display. More content will be added soon."
  },
  "buildings": {
    "noContentDesc": "No buildings to display. More content will be added soon."
  },
  "cache": {
    "title": "Cache Settings",
    "subtitle": "Manage app temporary storage",
    "systemStatus": "System Status",
    "recheck": "Recheck",
    "serviceWorker": "Service Worker",
    "offlineReady": "Offline Ready",
    "ready": "Ready",
    "needsDownload": "Needs Download",
    "totalCacheSize": "Total Cache Size",
    "lastCheck": "Last Check",
    "cacheDetails": "Cache Details",
    "items": "items",
    "operations": "Operations",
    "refreshCache": "Refresh Cache",
    "clearCache": "Clear Cache",
    "clearCacheNote": "Clearing cache will require data to be re-downloaded from server",
    "tips": "Tips",
    "tip1": "Download all data first for offline use",
    "tip2": "Cache expires automatically after 24 hours",
    "tip3": "Clearing cache only removes temporary data",
    "cacheCleared": "Cache cleared successfully",
    "cacheClearedDesc": "Cached data has been removed.",
    "cacheUpdated": "Cache updated",
    "errorClearing": "Error clearing cache",
    "errorRefreshing": "Error refreshing cache"
  },
  "installPage": {
    "title": "Install App",
    "installedTitle": "App Installed!",
    "installedDesc": "You can now access the app from the home screen icon.",
    "backToHome": "Back to Home",
    "quickInstall": "Quick Install",
    "quickInstallDesc": "Install the app with one click",
    "installButton": "Install App",
    "androidTitle": "Install on Android",
    "iosTitle": "Install on iPhone/iPad",
    "windowsTitle": "Install on Windows",
    "generalTitle": "Install App",
    "generalDesc": "Select 'Install' or 'Add to Home Screen' from browser menu.",
    "iosWarning": "Note: You must use Safari for installation on iOS",
    "visualGuideTitle": "Visual Installation Guide",
    "visualGuideDesc": "Click to view step-by-step guide with images",
    "viewGuide": "View Visual Guide",
    "benefitsTitle": "Benefits of Installing",
    "benefit1": "Quick access from home screen",
    "benefit2": "Works offline",
    "benefit3": "Better experience without address bar",
    "benefit4": "Faster loading"
  },
  "installGuide": {
    "title": "App Installation Guide",
    "stepOf": "Step {current} of {total}",
    "prev": "Previous",
    "next": "Next",
    "goToInstall": "Go to Install Page",
    "android": "Android",
    "ios": "iOS",
    "windows": "Windows",
    "androidSteps": {
      "step1Title": "Open Menu",
      "step1Desc": "Click the three-dot icon (⋮) at the top corner of your browser",
      "step2Title": "Add to Home Screen",
      "step2Desc": "Select 'Add to Home screen' or 'Install app'",
      "step3Title": "Install App",
      "step3Desc": "Click 'Install' button to complete installation"
    },
    "iosSteps": {
      "step1Title": "Open Share Menu",
      "step1Desc": "Click the share icon (square with arrow) at the bottom of Safari",
      "step2Title": "Add to Home Screen",
      "step2Desc": "Scroll down and select 'Add to Home Screen'",
      "step3Title": "Confirm Installation",
      "step3Desc": "Click 'Add' at the top right corner"
    },
    "windowsSteps": {
      "step1Title": "Install Icon in Address Bar",
      "step1Desc": "Click the install icon (⊕) on the right side of the address bar",
      "step2Title": "Or from Browser Menu",
      "step2Desc": "From three-dot menu (⋮) select 'Install app'",
      "step3Title": "Confirm Installation",
      "step3Desc": "Click 'Install' in the popup window"
    },
    "iosWarning": "Important Note",
    "iosWarningDesc": "For installation on iOS, you must use Safari. Other browsers like Chrome or Firefox don't support this feature.",
    "benefits": "App Installation Benefits",
    "benefitsList": [
      "Quick access from home screen or desktop",
      "Works offline without internet",
      "Fullscreen experience without address bar",
      "Faster loading and automatic updates",
      "Small size and no app store required"
    ]
  },
  "notFound": {
    "code": "404",
    "message": "Page not found",
    "backToHome": "Back to Home"
  },
  "admin": {
    "panel": "Admin Panel",
    "museum": "Iran Wrestling Museum",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot password?",
    "login": "Login",
    "noAccount": "Don't have an account?",
    "signup": "Sign up",
    "backToHome": "Back to Home",
    "passwordRecovery": "Password Recovery",
    "passwordRecoveryDesc": "Enter your email to receive a recovery link",
    "sendRecoveryLink": "Send Recovery Link",
    "backToLogin": "Back to Login",
    "recoveryLinkSent": "Recovery link sent to your email",
    "errorSendingRecovery": "Error sending recovery email",
    "pleaseEnterEmail": "Please enter your email",
    "pleaseEnterCredentials": "Please enter email and password",
    "initialSetup": "Initial Setup",
    "createFirstAdmin": "Create first system admin account",
    "firstUserNote": "You are the first user. Click the button below to become the main system admin.",
    "adminAlreadyExists": "An admin already exists. Contact system admin for access.",
    "activateAdmin": "Activate Admin",
    "congratulations": "Congratulations!",
    "adminCreatedSuccess": "Admin account created successfully. Redirecting to admin panel...",
    "dashboard": "Dashboard",
    "welcomeMessage": "Welcome to Iran Wrestling Museum Admin Panel",
    "totalWrestlers": "Total Wrestlers",
    "freestyleWrestlers": "Freestyle",
    "grecoRomanWrestlers": "Greco-Roman",
    "totalAchievements": "Total Achievements",
    "totalMedia": "Total Media",
    "storage": "Storage",
    "total": "Total",
    "filesTotal": "files total",
    "compressionSavings": "Compression Savings",
    "before": "Before",
    "after": "After",
    "reduction": "reduction",
    "recentWrestlers": "Recently Added Wrestlers",
    "noWrestlersYet": "No wrestlers added yet",
    "quickGuide": "Quick Guide",
    "guide1": "To add a new wrestler, use the 'Wrestlers' menu.",
    "guide2": "Each wrestler can have biography, achievements, and various media.",
    "guide3": "You can upload images and videos with Drag & Drop.",
    "guide4": "For image compression, visit General Settings."
  }
}
```

**File: `src/locales/ar.json`** - Add equivalent Arabic translations

---

### Part 2: Update Pages to Use Translation System

**Files to Update:**

| File | Changes Required |
|------|------------------|
| `src/pages/CacheSettingsPage.tsx` | Import `useLanguage`, replace all Persian text with `t()` calls |
| `src/pages/InstallPage.tsx` | Import `useLanguage`, replace all Persian text with `t()` calls |
| `src/pages/InstallGuidePage.tsx` | Import `useLanguage`, replace all Persian text with `t()` calls |
| `src/pages/NotFound.tsx` | Import `useLanguage`, replace all Persian text with `t()` calls |
| `src/pages/WrestlersListPage.tsx` | Add missing translation keys |
| `src/pages/BooksListPage.tsx` | Add missing translation keys |
| `src/pages/BuildingsListPage.tsx` | Add missing translation keys |
| `src/pages/admin/AdminLoginPage.tsx` | Import `useLanguage`, replace all Persian text |
| `src/pages/admin/AdminSetupPage.tsx` | Import `useLanguage`, replace all Persian text |
| `src/pages/admin/AdminDashboardPage.tsx` | Import `useLanguage`, replace all Persian text |
| `src/pages/MuseumHomePage.tsx` | Replace hardcoded "ورود مدیران" |

---

### Part 3: File-by-File Implementation Details

#### 3.1 CacheSettingsPage.tsx
Add import and replace approximately 25 Persian strings including:
- "تنظیمات کش" → `t('cache.title')`
- "مدیریت حافظه موقت برنامه" → `t('cache.subtitle')`
- All button labels, status messages, tips

#### 3.2 InstallPage.tsx
Add import and replace approximately 20 Persian strings including:
- "نصب برنامه" → `t('installPage.title')`
- Platform-specific instructions for Android, iOS, Windows

#### 3.3 InstallGuidePage.tsx
Add import and replace approximately 30 Persian strings including:
- Step-by-step instructions for each platform
- Benefits list items

#### 3.4 NotFound.tsx
Add import and replace 3 strings:
- "۴۰۴" → `t('notFound.code')`
- "صفحه مورد نظر یافت نشد" → `t('notFound.message')`
- "بازگشت به صفحه اصلی" → `t('notFound.backToHome')`

#### 3.5 AdminLoginPage.tsx
Add import and replace approximately 15 Persian strings including:
- Form labels, button text, error messages, links

#### 3.6 AdminSetupPage.tsx
Add import and replace approximately 10 Persian strings including:
- Setup instructions, success messages, error messages

#### 3.7 AdminDashboardPage.tsx
Add import and replace approximately 20 Persian strings including:
- Dashboard stats titles, guide text, storage labels

---

### Part 4: Implementation Order

| Step | Priority | Files |
|------|----------|-------|
| 1 | High | Update fa.json with any missing keys for consistency |
| 2 | High | Add all new keys to en.json |
| 3 | High | Add all new keys to ar.json |
| 4 | High | Update public-facing pages: NotFound, CacheSettings, Install pages |
| 5 | Medium | Update WrestlersListPage, BooksListPage, BuildingsListPage |
| 6 | Medium | Update admin pages: Login, Setup, Dashboard |
| 7 | Low | Update MuseumHomePage admin button |

---

### Part 5: Technical Notes

- **RTL Support**: Already handled via `useLanguage().dir` in LanguageContext
- **Dynamic Content**: Database content uses `TranslatedContent` component with AI translation
- **Font Loading**: Vazirmatn for RTL (Persian/Arabic), Inter for LTR (English) - already configured
- **Toast Messages**: All toast messages in pages need translation too

---

## Summary

| Metric | Count |
|--------|-------|
| Locale files to update | 3 (fa.json, en.json, ar.json) |
| Pages to modify | 11 |
| New translation keys | ~100+ |
| Estimated Persian strings to replace | ~150 |

This implementation will ensure complete English and Arabic language support across all user-facing and admin pages.
