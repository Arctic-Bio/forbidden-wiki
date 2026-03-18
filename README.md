# The Forbidden Wiki

A fully-featured, open-source collaborative wiki platform built with modern web technologies. Create, edit, and discuss knowledge across forums, article discussions, and user contributions with full role-based access control.

## Features

- **Article Management**: Create, edit, and delete wiki articles with full version history and revision tracking
- **Rich Media Support**: Upload and embed images and videos using Vercel Blob storage
- **Discussion Forums**: Community forums with boards, threads, and threaded discussions
- **Talk Pages**: Per-article discussion pages for collaborative editing and feedback
- **User Profiles**: Comprehensive user profiles with contribution history, role badges, and activity tracking
- **Authentication**: Secure session-based authentication with role-based access control (User, Editor, Admin, Banned)
- **Article Features**: 
  - Markdown editor with live preview and formatting toolbar
  - Infobox support for structured data
  - Category organization and tagging
  - Article watchlist for tracking changes
  - Full-text search across articles
- **Admin Dashboard**: Moderation tools for managing users, articles, and content
- **Dark Theme**: Editorial dark theme optimized for reading and content creation

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon serverless)
- **Storage**: Vercel Blob
- **Authentication**: Custom session-based with bcrypt password hashing
- **UI Components**: shadcn/ui
- **Data Fetching**: SWR for client-side caching

## Prerequisites

Before getting started, you'll need:

- **Node.js** 18+ and **pnpm** (recommended) or npm
- **PostgreSQL** database (we recommend [Neon](https://neon.tech) for serverless hosting)
- **Vercel account** (for Blob storage and deployment)
- **Git** for version control

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/forbidden-wiki.git
cd forbidden-wiki
```

### 2. Install Dependencies

```bash
pnpm install
```

Or with npm:
```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database Connection (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

#### Getting Your Environment Variables

**Neon Database:**
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the PostgreSQL connection string from the "Connection String" tab
4. Paste it in your `.env.local` as `DATABASE_URL`

**Vercel Blob:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or create one)
3. Go to Settings → Storage → Create Database (Blob)
4. Copy the `BLOB_READ_WRITE_TOKEN` from the environment variables
5. Paste it in your `.env.local`

### 4. Initialize the Database

The database schema will be automatically created when you run the setup script:

```bash
pnpm run setup:db
```

This will:
- Create all required tables (articles, users, forums, media, etc.)
- Set up default categories
- Initialize forum boards

### 5. Start the Development Server

```bash
pnpm run dev
```

The wiki will be available at `http://localhost:3000`

## Usage

### Creating Your First Account

1. Navigate to `http://localhost:3000/register`
2. Create an account with a username and password
3. Log in with your credentials

### Creating Articles

1. Click "Create Article" in the header
2. Write your article using the Markdown editor
3. Add title, summary, category, and tags
4. Use the preview toggle to see formatting
5. Click "Publish Article"

### Managing Forums

1. Visit `/forum` to browse forum boards
2. Click a board to view threads
3. Create new threads or reply to existing ones
4. Edit or delete your own posts using the dropdown menu

### Uploading Media

1. Go to `/media` to access the media library
2. Upload images or videos
3. Use the provided URLs to embed in articles

### Admin Features

1. Access the admin dashboard at `/admin`
2. Manage users (ban, promote to editor/admin)
3. Feature or lock articles
4. Create new categories
5. View moderation logs

## Deployment

### Deploy to Vercel

The easiest way to deploy is to Vercel:

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**:
   - In Vercel project settings, go to Settings → Environment Variables
   - Add `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN`
   - Redeploy

4. **Deploy**:
   - Vercel automatically deploys on every push to main
   - Your wiki is live!

### Deploy Anywhere Else

For other hosting platforms (AWS, DigitalOcean, etc.):

1. **Build the project**:
```bash
pnpm run build
```

2. **Start the server**:
```bash
pnpm start
```

3. **Environment Setup**:
   - Set `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` as environment variables
   - Ensure Node.js 18+ is installed
   - Use a process manager like PM2 for production

## Configuration

### Database Schema

The database includes these main tables:
- `users` - User accounts with roles (user, editor, admin, banned)
- `articles` - Wiki articles with versioning
- `article_revisions` - Full article history
- `categories` - Article categories
- `tags` - Article tags
- `talk_pages` - Per-article discussion threads
- `forum_boards` - Forum sections
- `forum_threads` - Forum discussion threads
- `forum_posts` - Forum posts with edit tracking
- `media` - Uploaded images and videos
- `watchlist` - Followed articles
- `moderation_logs` - Admin action logs

### User Roles

- **User**: Can create articles, edit own content, participate in forums
- **Editor**: Can edit any article, moderate talk pages
- **Admin**: Full access including user management and site configuration
- **Banned**: Blocked from creating content

## Development

### Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin dashboard
│   ├── categories/       # Category pages
│   ├── contributions/    # User contributions
│   ├── forum/            # Forum pages
│   ├── login/            # Auth pages
│   ├── media/            # Media library
│   ├── search/           # Search page
│   ├── user/             # User profiles
│   ├── wiki/             # Article pages
│   ├── watchlist/        # Watchlist page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Homepage
│   └── globals.css       # Global styles
├── components/           # Reusable React components
├── lib/                  # Utilities and helpers
│   ├── auth.ts           # Authentication helpers
│   ├── db.ts             # Database client
│   └── utils-wiki.ts     # Wiki utilities
├── scripts/
│   └── 001-schema.sql    # Database schema
└── public/               # Static assets
```

### Key Files

- `app/layout.tsx` - Root layout with auth provider
- `app/globals.css` - Theme configuration with design tokens
- `lib/auth.ts` - Session management and auth utilities
- `lib/db.ts` - PostgreSQL client wrapper
- `components/header.tsx` - Main navigation
- `app/api/auth/*` - Authentication endpoints
- `app/api/articles/*` - Article management endpoints

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Log in
- `POST /api/auth/logout` - Log out
- `GET /api/auth/me` - Get current user

### Articles
- `GET /api/articles` - List articles (supports search, sorting, pagination)
- `POST /api/articles/new` - Create article
- `GET /api/articles/[slug]` - Get article
- `PUT /api/articles/[slug]` - Update article
- `DELETE /api/articles/[slug]` - Delete article
- `GET /api/articles/[slug]/history` - Article version history

### Forums
- `GET /api/forum` - List forum boards
- `POST /api/forum` - Create thread
- `GET /api/forum/[id]` - Get thread with posts
- `PUT /api/forum/post/[postId]` - Edit post
- `DELETE /api/forum/post/[postId]` - Delete post

### Media
- `POST /api/media` - Upload file
- `DELETE /api/media/[id]` - Delete file

### Admin
- `GET /api/admin` - Get admin stats
- `POST /api/admin` - Execute admin action

## Troubleshooting

### Database Connection Failed
- Verify `DATABASE_URL` is correct in `.env.local`
- Check that your Neon project is active
- Ensure you've run `pnpm run setup:db`

### Upload Fails
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check that the Blob store is active in Vercel
- Ensure file size is under limits (images: 50MB, videos: 500MB)

### Build Error on Deployment
- Check all environment variables are set in Vercel
- Clear build cache and redeploy
- Review deployment logs for specific errors

### Performance Issues
- Use the admin dashboard to check article count
- Ensure database indexes are created
- Consider enabling caching headers

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or suggestions:
- Open an [Issue](https://github.com/yourusername/forbidden-wiki/issues)
- Join our community discussions
- Check [Discussions](https://github.com/yourusername/forbidden-wiki/discussions)

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Database by [Neon](https://neon.tech)
- Storage by [Vercel Blob](https://vercel.com/storage/blob)

---

**The Forbidden Wiki** - Knowledge without limits. Created for collaborative communities.
