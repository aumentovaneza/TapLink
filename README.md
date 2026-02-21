# TapLink - NFC Tag Platform

A frontend-only prototype for a web app that turns any NFC tag into an instant profile. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Template-based Profiles**: Choose from Pet, Business, Personal, or Restaurant templates
- **Claim Code System**: Simulate NFC tag activation with mock claim codes
- **Profile Management**: Create, view, and manage profiles through an admin panel
- **Private-by-Link**: Profiles are only accessible via direct URLs
- **Mobile-First Design**: Responsive UI that works great on all devices
- **No Backend Required**: Everything runs in the browser using localStorage

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development
- **React Router** for navigation
- **Tailwind CSS** for styling
- **localStorage** for data persistence

## Prerequisites

- **Node.js 20.19+ or 22.12+** (required for Vite 7.x)
- npm or yarn

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

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Application Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx
│   ├── TemplateCard.tsx
│   ├── FormField.tsx
│   └── PreviewCard.tsx
├── pages/              # Page components
│   ├── LandingPage.tsx
│   ├── ClaimFlow.tsx
│   ├── Templates.tsx
│   ├── ProfileEditor.tsx
│   ├── ProfileView.tsx
│   ├── TagScan.tsx
│   └── Admin.tsx
├── services/           # Data layer and utilities
│   └── dataLayer.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main app component with routing
├── main.tsx           # App entry point
└── index.css          # Tailwind CSS imports
```

## Routes

- `/` - Landing page with hero section and CTAs
- `/claim/:code` - Claim code validation flow
- `/templates` - Template selection page
- `/editor/:templateType` - Profile editor for specific template
- `/p/:publicId` - Public profile view
- `/t/:tagId` - Tag scan simulation (redirects to profile)
- `/admin` - Admin panel for managing profiles

## Mock Claim Codes

The app includes these pre-configured claim codes for testing:
- `DEMO-1234` - General demo
- `PET-0001` - Pet profile demo
- `BIZ-0001` - Business profile demo

## Demo Data

The app includes demo data that works out of the box:
- Visit `/p/demo-public-id` to see a sample pet profile
- Visit `/t/demo-tag-id` to simulate a tag scan

## How It Works

1. **Claim a Tag**: Use a claim code to activate your NFC tag
2. **Choose Template**: Select from available profile templates
3. **Fill Information**: Complete the form with your details
4. **Get Links**: Receive public and tag URLs for sharing
5. **Manage Profiles**: Use the admin panel to manage all profiles

## Data Storage

All data is stored in the browser's localStorage:
- Profiles are stored as JSON objects
- Tag mappings link tag IDs to profile public IDs
- Claim codes are validated against a predefined list
- No backend or database required

## Development Notes

- The app is fully frontend-only and works offline after initial load
- TypeScript is configured with strict mode for better type safety
- Tailwind CSS is used for all styling with a modern SaaS design
- Components are built with reusability in mind
- The data layer provides a clean API for localStorage operations

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Android Chrome)

## License

ISC
