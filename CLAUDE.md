# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application built with TypeScript, React 19, and Tailwind CSS. The project uses the shadcn/ui component library with a sidebar-based dashboard layout architecture.

## Development Commands

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Architecture & Structure

### UI Component System
- Uses shadcn/ui components configured in `components.json`
- Components organized in `components/ui/` for reusable UI primitives
- Application-specific components in `components/` root
- Tailwind CSS with CSS variables for theming (`app/globals.css`)
- Utility function `cn()` in `lib/utils.ts` for conditional class merging

### Layout Structure
- App Router architecture (`app/` directory)
- Root layout in `app/layout.tsx` with Geist font configuration
- Dashboard uses sidebar layout pattern via `SidebarProvider` and `AppSidebar`
- Sidebar components: `AppSidebar`, `NavMain`, `NavProjects`, `NavUser`, `TeamSwitcher`

### Path Aliases
- `@/components` → `./components`
- `@/lib` → `./lib`
- `@/hooks` → `./hooks`
- `@/components/ui` → `./components/ui`

### Key Dependencies
- **UI**: @radix-ui/react-* primitives, lucide-react icons
- **Styling**: Tailwind CSS v4, class-variance-authority, clsx, tailwind-merge
- **Framework**: Next.js 15, React 19

## Component Patterns

### Sidebar Architecture
The dashboard uses a collapsible sidebar pattern:
- `SidebarProvider` wraps the layout
- `AppSidebar` contains navigation structure
- `SidebarInset` for main content area
- Hardcoded sample data in `app-sidebar.tsx` for teams, navigation, and projects

### Styling Conventions
- Uses `cn()` utility for conditional classes
- Tailwind CSS with custom CSS variables
- Component variants handled via class-variance-authority
- New York style from shadcn/ui configuration

## Authentication System

### Implementation
- JWT-based authentication with secure HTTP-only cookies
- Prisma model `Usuario` with bcrypt password hashing
- Middleware protection for all main routes
- Session persistence with Zustand store

### API Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - Session termination
- `GET /api/auth/me` - Current user info

### Auth Hook
- `useAuth()` - Returns user state and logout function
- Integrated with `AuthProvider` for session management