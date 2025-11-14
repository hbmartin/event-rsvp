# Social Dining Events Admin Dashboard

## Overview
Admin dashboard for a social dining events platform that connects strangers through 6-person dinners. Built on Next.js with PostgreSQL database, supporting multi-city operations, member management with credits/subscriptions, restaurant partnerships, and algorithmic matching.

## Recent Changes (January 2025)
- **Admin Dashboard Implementation**: Complete admin panel with navigation, analytics, and management pages
- **Database Schema Extensions**: Added 7 new tables (cities, restaurants, subscriptions, promo_codes, surveys, survey_responses, dinner_assignments, credit_transactions)
- **Security**: All admin API routes protected with withAdminAuth middleware
- **Bug Fixes**: Fixed repeat attendance query (CTE-based), seat assignments metric, city filter implementation
- **Critical Schema Change**: Added `credit_deducted` column to dinner_assignments table (see migrations/)

## Database Schema Changes
All schema changes are documented in the `migrations/` directory:

1. **001_add_credit_deducted_to_dinner_assignments.sql** (2025-01-14)
   - Added `credit_deducted` BOOLEAN column to track credit charges
   - Required for proper credit refund logic in group management
   - Run this migration on production before deploying

### Running Migrations
To apply migrations to production database:
```bash
psql $DATABASE_URL < migrations/001_add_credit_deducted_to_dinner_assignments.sql
```

## Project Architecture

### Frontend (Next.js 15)
- **Admin Pages**: `/src/app/admin/*` - Dashboard, dinners, members, restaurants, groups, surveys, analytics, settings
- **Components**: `/src/components/*` - Reusable UI components, admin navigation
- **Public Pages**: Event RSVP system (existing)

### Backend (API Routes)
- **Admin APIs**: `/src/app/api/admin/*` - Protected with withAdminAuth middleware
- **Public APIs**: Event management, user registration (existing)
- **Database**: PostgreSQL via executeQuery() helper

### Key Tables
- **users**: Members with credits and subscriptions
- **events**: 6-person dinner events with status tracking
- **dinner_assignments**: Member-to-dinner assignments with credit tracking
- **restaurants**: Partner restaurants with booking status
- **surveys**: Configurable questions for matching algorithm
- **credit_transactions**: Payment and credit history
- **subscriptions**: Unlimited dinner subscriptions
- **promo_codes**: Promotional codes for free credits

## Admin Dashboard Features

### 1. Dashboard (`/admin/dashboard`)
- Real-time metrics: seat fill rate, repeat attendance, revenue
- Upcoming dinners count and guest tracking
- Waitlist management

### 2. Dinner Management (`/admin/dinners`)
- Create/edit/cancel 6-person dinners
- Status tracking: Draft → Confirmed → Closed → Completed
- CSV export of dinner data
- Restaurant and city filtering

### 3. Member Management (`/admin/members`)
- Member profiles with credits and subscription status
- Search and filter (by city, subscription status)
- CSV export of member data
- Attendance history tracking

### 4. Restaurant Management (`/admin/restaurants`)
- CRUD for restaurant partners
- Booking status: Available → Reserved → Confirmed
- Performance metrics: dinners hosted, ratings
- City-based organization

### 5. Group Management (`/admin/groups`)
- View dinner assignments
- Manual matching: add/remove attendees
- Automatic credit handling
- Capacity enforcement (6 seats max)

### 6. Survey Configuration (`/admin/surveys`)
- Create onboarding and post-dinner surveys
- Question types: text, multiple choice, rating, yes/no
- Matching weights for algorithm
- Reorder questions

### 7. Analytics (`/admin/analytics`)
- Cohort analysis: retention by signup month
- City demand: members, dinners, trends
- Revenue breakdown: credits vs. subscriptions
- Restaurant performance rankings

### 8. Settings (`/admin/settings`)
- Email notification templates
- Promo code management
- Webhook configuration (stub)

## User Preferences
- Code style: TypeScript with Next.js best practices
- Database: PostgreSQL with parameterized queries (no Prisma/Drizzle ORM)
- UI: shadcn/ui components with Tailwind CSS
- Deployment: Replit (port 5000, 0.0.0.0 binding)

## Environment Variables
Required secrets:
- `DATABASE_URL`: PostgreSQL connection string (Neon-backed)
- `JWT_SECRET`: For admin authentication
- `SMTP_USER`, `SMTP_PASS`: For email notifications (optional)

Available via Replit:
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

## Critical Notes
- **Admin Access**: All `/api/admin/*` routes require admin role
- **Credit System**: 1 credit = 1 dinner seat, subscriptions = unlimited
- **Capacity**: All dinners are 6-person events
- **Database Changes**: Always document schema changes in migrations/
- **Authentication**: Uses JWT tokens with role-based access control
