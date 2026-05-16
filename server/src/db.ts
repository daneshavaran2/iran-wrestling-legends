import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DB_PATH, UPLOADS_DIR } from './env.js';

mkdirSync(dirname(DB_PATH), { recursive: true });
mkdirSync(UPLOADS_DIR, { recursive: true });
for (const sub of ['wrestlers', 'albums', 'buildings', 'about', 'audio', 'history', 'books']) {
  mkdirSync(`${UPLOADS_DIR}/${sub}`, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wrestlers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  style TEXT NOT NULL DEFAULT 'freestyle' CHECK (style IN ('freestyle','greco_roman','pahlavani')),
  weight_class TEXT,
  province TEXT,
  image_url TEXT,
  bio TEXT,
  full_story TEXT,
  success_path TEXT,
  social_activities TEXT,
  intro_video_url TEXT,
  is_visible INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wrestler_media (
  id TEXT PRIMARY KEY,
  wrestler_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image','video')),
  url TEXT NOT NULL,
  thumbnail TEXT,
  title TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wrestler_media_wrestler ON wrestler_media(wrestler_id);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  wrestler_id TEXT NOT NULL,
  title TEXT NOT NULL,
  event TEXT NOT NULL,
  year INTEGER NOT NULL,
  medal_type TEXT NOT NULL CHECK (medal_type IN ('gold','silver','bronze','other')),
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_achievements_wrestler ON achievements(wrestler_id);

CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS album_photos (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_album_photos_album ON album_photos(album_id);

CREATE TABLE IF NOT EXISTS history_sections (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  highlighted_quote TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS history_media (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  title TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_history_media_section ON history_media(section_id);

CREATE TABLE IF NOT EXISTS buildings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  hero_image_url TEXT,
  map_link TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS building_images (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image',
  title TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_building_images_building ON building_images(building_id);

CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  summary TEXT,
  cover_image_url TEXT,
  related_wrestler_id TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS about_media (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  title TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  theme TEXT NOT NULL DEFAULT 'dark',
  about_title TEXT,
  about_content TEXT,
  about_image_url TEXT,
  bg_music_url TEXT,
  bg_music_enabled INTEGER DEFAULT 1,
  bg_music_autoplay INTEGER DEFAULT 0,
  bg_music_volume REAL DEFAULT 0.3,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS translations (
  id TEXT PRIMARY KEY,
  source_hash TEXT NOT NULL,
  source_text TEXT NOT NULL,
  language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source_hash, language)
);
`;

db.exec(SCHEMA);

// Ensure default app_settings row exists
db.prepare(
  `INSERT OR IGNORE INTO app_settings (id) VALUES ('main')`,
).run();

export const TABLES = [
  'users',
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

export type TableName = (typeof TABLES)[number];

/** Public-readable tables (exposed via /api/snapshot.json and unauthenticated GETs). */
export const PUBLIC_TABLES: TableName[] = [
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
];