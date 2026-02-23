# Taparoo

A modern web application built with React, TypeScript, and Tailwind CSS. This project uses Vite for fast development and includes a comprehensive component library with Radix UI primitives.

## Features

- **Modern React Architecture**: Built with React 18 and TypeScript for type safety
- **Component Library**: Extensive UI components using Radix UI primitives
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Fast Development**: Vite for lightning-fast development and building
- **Theme Support**: Dark/light theme system with next-themes
- **Form Handling**: React Hook Form for robust form management
- **Rich UI Components**: Carousels, charts, dialogs, and more

## Tech Stack

- **React 18** with TypeScript
- **Vite 6** for fast development and building
- **React Router 7** for navigation
- **Tailwind CSS 4** for styling
- **Radix UI** for accessible component primitives
- **Lucide React** for icons
- **React Hook Form** for form management
- **Motion** for animations
- **Recharts** for data visualization

## Prerequisites

- **Node.js 20+** (recommended)
- npm, yarn, or pnpm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd taplink
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Full Stack (Docker + Yarn)

This repo now includes a backend (`/server`) with Fastify + Prisma + PostgreSQL.

Run the full stack in an isolated Docker environment:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

To stop the stack:

```bash
docker compose down
```

To also remove DB data volume:

```bash
docker compose down -v
```

Seeded test accounts:

- Admin: `admin@taplink.io` / `Admin123!`
- User: `alex@taplink.io` / `Password123!`

Backend env template:

- `server/.env.example`

## Backend API (MVP)

Base URL: `http://localhost:3000`

- `GET /health`
- `POST /auth/signup`
- `POST /auth/signin`
- `GET /auth/me` (Bearer token)
- `GET /tags/mine` (Bearer token)
- `POST /tags/claim` (Bearer token)
- `PATCH /tags/:tagId/status` (Bearer token)
- `GET /scan/:tagId`
- `GET /profiles/:id`
- `POST /profiles` (Bearer token)
- `PATCH /profiles/:id` (Bearer token)
- `PUT /profiles/:id/links` (Bearer token)
- `POST /profiles/photo?profileId=:id` (Bearer token, multipart form-data with `photo`)
- `POST /events/tap`
- `POST /events/link-click`
- `GET /analytics/tag/:tagId` (Bearer token)
- `GET /analytics/admin/overview` (Admin token)
- `GET /admin/profiles` (Admin token)
- `GET /admin/tags` (Admin token)
- `POST /admin/tags/generate` (Admin token)
- `GET /admin/settings` (Admin token)
- `PATCH /admin/settings` (Admin token)
- `GET /admin/api-keys` (Admin token)
- `POST /admin/api-keys/rotate` (Admin token)

## Supabase Photo Upload Setup

The profile editor now uploads photos to Supabase Storage using the backend API.

1. Create a Supabase project at [https://supabase.com](https://supabase.com).
2. In Supabase, go to **Storage** and create a bucket named `profile-photos` (or your preferred bucket name).
3. Set the bucket to **Public** so uploaded photos can be displayed by URL.
4. In bucket settings, set a storage file size limit (recommended: `8 MB`) to match backend validation.
5. In Supabase project settings, copy:
   - **Project URL** (used as `SUPABASE_URL`)
   - **Service Role Key** (used as `SUPABASE_SERVICE_ROLE_KEY`)
6. Update backend environment variables (`server/.env` or Docker env):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET` (default: `profile-photos`)
   - `PHOTO_UPLOAD_MAX_BYTES` (default: `8000000`, about 8MB)
7. Restart the backend after changing env vars.

Security note:
- Keep `SUPABASE_SERVICE_ROLE_KEY` on the backend only. Do not expose it in frontend `VITE_` variables.

Upload behavior:
- The frontend accepts JPG/PNG/WebP.
- Images are optimized client-side to keep quality while reducing size (target around 2MB) before sending to `/profiles/photo`.
- The backend enforces a hard max upload size (`PHOTO_UPLOAD_MAX_BYTES`) before storing in Supabase.
- Uploads are scoped to the owner + profile and stored in this path format: `<bucket>/<ownerUserId>/<profileId>/<filename>`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run serve` - Serve production build
- `npm run serve:build` - Build and serve in one command

## Application Structure

```
src/
├── app/                    # Main application directory
│   ├── components/         # Reusable UI components
│   ├── data/              # Data and configuration
│   ├── layouts/           # Layout components
│   ├── pages/             # Page components
│   ├── App.tsx            # Main app component
│   └── routes.tsx         # Route configuration
├── styles/                # Global styles
│   ├── fonts.css
│   ├── index.css
│   └── tailwind.css
└── main.tsx              # App entry point
```

## Key Dependencies

### UI Framework
- **@mui/material**: Material-UI components
- **@radix-ui/***: Headless UI primitives for accessibility
- **lucide-react**: Modern icon library
- **tailwindcss**: Utility-first CSS framework

### Data & Forms
- **react-hook-form**: Performant forms with easy validation
- **react-router**: Client-side routing
- **recharts**: Chart library for data visualization

### Utilities
- **clsx & tailwind-merge**: Conditional class utilities
- **date-fns**: Date manipulation library
- **sonner**: Toast notifications

## Development

### Getting Started
1. Clone the repository
2. Install dependencies with `npm install`
3. Start development server with `npm run dev`
4. Open `http://localhost:5173` in your browser

### Building
- `npm run build` creates optimized production build in `dist/`
- `npm run preview` serves the production build locally
- `npm run serve:build` builds and serves in one command

## Configuration

- **Vite**: Modern build tool with HMR
- **TypeScript**: Strict mode enabled for type safety
- **Tailwind CSS 4**: Latest version with improved performance
- **PostCSS**: CSS processing pipeline

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Android Chrome)

## License

ISC
