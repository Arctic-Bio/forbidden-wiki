-- The Forbidden Wiki - Database Schema

-- Users table (custom auth with bcrypt)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user', 'editor', 'admin', 'banned'
  edit_count INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  article_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  summary TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'review', 'deleted'
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  protection_level VARCHAR(20) NOT NULL DEFAULT 'none', -- 'none', 'autoconfirmed', 'admin'
  view_count INTEGER NOT NULL DEFAULT 0,
  author_id UUID NOT NULL REFERENCES users(id),
  category_id UUID REFERENCES categories(id),
  infobox JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Article revisions (full history like Wikipedia)
CREATE TABLE IF NOT EXISTS article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  edit_summary VARCHAR(500),
  editor_id UUID NOT NULL REFERENCES users(id),
  is_minor_edit BOOLEAN NOT NULL DEFAULT false,
  revision_number INTEGER NOT NULL,
  byte_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Article categories junction
CREATE TABLE IF NOT EXISTS article_categories (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

-- Article tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  article_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Talk pages (discussion per article)
CREATE TABLE IF NOT EXISTS talk_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Talk page threads
CREATE TABLE IF NOT EXISTS talk_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talk_page_id UUID NOT NULL REFERENCES talk_pages(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  reply_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Talk page posts
CREATE TABLE IF NOT EXISTS talk_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES talk_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES talk_posts(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Forums
CREATE TABLE IF NOT EXISTS forum_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER NOT NULL DEFAULT 0,
  thread_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  required_role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES forum_boards(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES forum_posts(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  edit_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media (images + videos via Blob)
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(500) NOT NULL,
  original_name VARCHAR(500),
  blob_url TEXT NOT NULL,
  blob_pathname TEXT NOT NULL,
  content_type VARCHAR(100),
  file_size BIGINT,
  media_type VARCHAR(20) NOT NULL DEFAULT 'image', -- 'image', 'video', 'audio', 'document'
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- seconds, for video/audio
  caption TEXT,
  alt_text TEXT,
  uploader_id UUID NOT NULL REFERENCES users(id),
  article_id UUID REFERENCES articles(id),
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, article_id)
);

-- User notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'article_edit', 'talk_reply', 'forum_reply', 'mention', 'admin'
  title VARCHAR(500) NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User contributions log
CREATE TABLE IF NOT EXISTS user_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'article_create', 'article_edit', 'talk_post', 'forum_post', 'media_upload'
  target_id UUID,
  target_title VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moderation logs
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  target_article_id UUID REFERENCES articles(id),
  action VARCHAR(100) NOT NULL, -- 'ban', 'unban', 'lock', 'unlock', 'delete', 'protect', 'feature'
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Article links (for "what links here")
CREATE TABLE IF NOT EXISTS article_links (
  from_article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  to_article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  PRIMARY KEY (from_article_id, to_article_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_article_revisions_article ON article_revisions(article_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_board ON forum_threads(board_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_media_article ON media(article_id);
CREATE INDEX IF NOT EXISTS idx_talk_threads_page ON talk_threads(talk_page_id);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_articles_fts ON articles USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS idx_forum_threads_fts ON forum_threads USING GIN(to_tsvector('english', title));

-- Seed default categories
INSERT INTO categories (name, slug, description) VALUES
  ('General Knowledge', 'general-knowledge', 'General encyclopedic knowledge'),
  ('Science & Technology', 'science-technology', 'Scientific discoveries and technological innovations'),
  ('History', 'history', 'Historical events, civilizations, and people'),
  ('Culture & Society', 'culture-society', 'Culture, arts, and social topics'),
  ('Geography', 'geography', 'Places, regions, and geographic phenomena'),
  ('People & Biographies', 'people-biographies', 'Notable individuals and their lives'),
  ('Philosophy & Religion', 'philosophy-religion', 'Philosophical thought and religious traditions'),
  ('Arts & Entertainment', 'arts-entertainment', 'Music, film, literature, and more'),
  ('Politics & Law', 'politics-law', 'Government systems, laws, and political theory'),
  ('Health & Medicine', 'health-medicine', 'Medical knowledge and health information')
ON CONFLICT (slug) DO NOTHING;

-- Seed default forum boards
INSERT INTO forum_boards (name, slug, description, display_order) VALUES
  ('General Discussion', 'general', 'General community discussion about anything', 1),
  ('Article Workshop', 'article-workshop', 'Get help writing and improving articles', 2),
  ('New Articles', 'new-articles', 'Propose and discuss new article ideas', 3),
  ('Policy & Guidelines', 'policy', 'Discuss wiki policies and guidelines', 4),
  ('Technical Issues', 'technical', 'Report bugs and technical problems', 5),
  ('Introductions', 'introductions', 'Introduce yourself to the community', 6)
ON CONFLICT (slug) DO NOTHING;
