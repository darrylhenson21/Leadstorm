# Leadstorm AI - Lead Generation Application

## Overview

Leadstorm AI is a full-stack web application designed to generate business leads by scraping email addresses from Google Places search results. The application provides a dashboard for configuration, lead management, and monitoring of scraping runs with built-in rate limiting and throttling mechanisms.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend concerns:

- **Frontend**: React + TypeScript with Vite for development and building
- **Backend**: Node.js + Express with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (configured for both PostgreSQL and SQLite fallback)
- **UI Framework**: Tailwind CSS with Radix UI components via shadcn/ui
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation

## Key Components

### Frontend Architecture
- **Component Structure**: Organized with reusable UI components using Radix UI primitives
- **Routing**: Client-side routing implemented with Wouter for lightweight navigation
- **Styling**: Tailwind CSS with custom design system and CSS variables for theming
- **Type Safety**: Full TypeScript implementation with shared schemas between frontend and backend

### Backend Architecture
- **API Design**: RESTful API endpoints for configuration, leads, and run management
- **Database Layer**: Drizzle ORM with PostgreSQL primary database and SQLite fallback
- **Data Storage**: Abstracted storage interface supporting both in-memory and database persistence
- **Service Layer**: Modular services for Google Places API integration and web scraping

### Core Services
- **Google Places Integration**: Fetches business listings based on city and keyword searches
- **Web Scraping Service**: Extracts email addresses from business websites with retry logic
- **Rate Limiting**: Configurable throttling with user agent rotation and backoff strategies
- **Run Management**: Tracks scraping sessions with detailed statistics and error handling

## Data Flow

1. **Configuration Setup**: Users configure Google Places API key, search parameters, and throttling settings
2. **Run Initiation**: Users specify location (city, suburb, neighborhood, or ZIP code) and keyword for lead generation
3. **Places Retrieval**: System queries Google Places API with multi-page search and nearby fallback
4. **Website Scraping**: For each business with a website, the system attempts to extract email addresses
5. **Data Storage**: Valid leads are stored with deduplication logic
6. **Progress Tracking**: Real-time updates on run status, leads found, and completion statistics

### Location Support
The system accepts flexible location inputs:
- **Cities**: Dallas, Austin, New York, Los Angeles
- **Neighborhoods**: Manhattan, Brooklyn, Beverly Hills
- **ZIP Codes**: 10001, 90210, 78701, 33139
- **Suburbs**: Any recognizable location name

## External Dependencies

### APIs and Services
- **Google Places API**: Primary data source for business listings and contact information
- **Web Scraping**: Custom scraping service with configurable retry logic and user agent rotation

### Development Dependencies
- **Vite**: Frontend build tool and development server
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Backend bundling for production deployment

### UI Libraries
- **Radix UI**: Accessible component primitives for form controls and overlays
- **Lucide React**: Icon library for consistent iconography
- **TanStack Query**: Server state management with caching and synchronization

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Development**: `npm run dev` starts both frontend and backend in development mode
- **Production Build**: `npm run build` creates optimized bundles for both client and server
- **Database Management**: `npm run db:push` applies schema changes to the database
- **Port Configuration**: Server runs on port 5000 with static file serving for the frontend

### Environment Configuration
- **Database**: Primary PostgreSQL with DATABASE_URL, fallback to SQLite for development
- **API Keys**: Google Places API key required for functionality
- **Rate Limiting**: Configurable request delays, retry attempts, and daily caps
- **Security**: User agent rotation and request throttling to prevent blocking

## Recent Changes

- July 11, 2025: Implemented comprehensive brand lock protection system
  - **Added universal brand signature "by Lee Cole & Gloria Gunn" linked to squeeze page**
  - **Implemented console easter egg with brand message in main client entry point**
  - **Added CSV export footer with brand protection header in all lead downloads**
  - **Created non-blocking ping on server startup for brand tracking**
  - **Added comprehensive README.md and LICENSE.txt with LinkedSure LLC branding**
  - **All brand protection URLs redirect to https://ezprofitsoftware.com/lazy-marketers-dream-come-true/ for bootlegger capture**
  - Complete brand lock system implemented to prevent bootlegging and capture unauthorized users

- June 25, 2025: Fixed all production bugs and enhanced functionality
  - Fixed clear history button - now properly clears all runs and leads
  - Implemented working stop run button with real-time process termination
  - Added API key management with remove/update functionality and visual feedback
  - Fixed progress tracking and data consistency across dashboard and logs
  - Added comprehensive throttling configuration guide with recommended settings
  - Enhanced stop run functionality with proper currentRuns tracking
  - All major UI and backend issues resolved for production deployment

- June 20, 2025: Complete Leadstorm AI v2 implementation with pagination enhancement
  - Built full-stack web application with React frontend and Express backend
  - Implemented configurable daily cap (default 50, user-adjustable up to 500)
  - Added intelligent rate limiting with configurable delays (500-5000ms)
  - Built user-agent rotation and retry logic with exponential backoff
  - Created polite scraping system requiring no proxies
  - Added comprehensive UI matching design mockups
  - Enhanced Google Places API with multi-page search (up to 3 pages per search type)
  - Added nearby search fallback for comprehensive city coverage
  - Implemented automatic deduplication by place_id
  - Improved results from 6 to 11+ leads per city (83% improvement)
  - Built email scraping with domain filtering and validation

## User Preferences

Preferred communication style: Simple, everyday language.