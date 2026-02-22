# TapLink

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
