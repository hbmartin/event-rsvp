# Social Dining Events Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A comprehensive social dining events platform that connects strangers through intimate 6-person dinners. Features a powerful admin dashboard for managing multi-city operations, member subscriptions with credits, restaurant partnerships, and algorithmic matching for optimal dinner groups.

## 🎯 Overview

This platform enables food lovers to discover new restaurants and meet interesting people through curated 6-person dinner events. The system supports:

- **Multi-city operations** with location-based event management
- **Credit & subscription system** for flexible payment models
- **Restaurant partnerships** with booking status tracking
- **Survey-based matching** algorithm for optimal group composition
- **Manual override capabilities** for fine-tuning dinner assignments
- **Comprehensive analytics** for business insights

## ✨ Features

### 🎫 Public-Facing Features
- **Event Discovery** - Browse upcoming 6-person dinner events by city
- **User Registration** - Secure authentication with profile management
- **RSVP System** - Book seats with credit or subscription
- **Survey Matching** - Complete questionnaires for better dinner matches
- **Responsive Design** - Works seamlessly on desktop and mobile

### 🔐 Admin Dashboard Features

#### 1. **Dashboard Analytics** (`/admin/dashboard`)
- **Real-time Metrics**
  - Seat fill rate across all dinners
  - Repeat attendance percentage
  - Total revenue (credits + subscriptions)
  - Upcoming dinners count
- **Guest Tracking** - Current attendee count vs. total capacity
- **Waitlist Management** - Monitor pending RSVPs

#### 2. **Dinner Management** (`/admin/dinners`)
- **CRUD Operations** - Create, edit, and cancel 6-person dinner events
- **Status Workflow** - Draft → Confirmed → Closed → Completed
- **Restaurant Assignment** - Link dinners to partner restaurants
- **City/Date Filtering** - Quickly find specific events
- **CSV Export** - Download dinner data for external analysis
- **Capacity Tracking** - Automatic seat assignment monitoring (0/6 to 6/6)

#### 3. **Member CRM** (`/admin/members`)
- **Member Profiles** - View credits, subscription status, and join date
- **Advanced Search** - Filter by name, email, city, or subscription status
- **Attendance History** - Track participation across all events
- **Credit Management** - View transaction history and current balance
- **CSV Export** - Export member data for marketing/analysis
- **Subscription Tracking** - Identify unlimited dinner access members

#### 4. **Restaurant Management** (`/admin/restaurants`)
- **Partner Database** - Manage restaurant information, addresses, and contacts
- **Booking Status** - Track availability (Available → Reserved → Confirmed)
- **Performance Metrics**
  - Total dinners hosted
  - Average rating from post-dinner surveys
  - Repeat booking rate
- **City Organization** - Group restaurants by location
- **Capacity Planning** - View upcoming and past bookings

#### 5. **Group Management** (`/admin/groups`)
- **Dinner Assignments** - View all member-to-dinner assignments
- **Manual Matching** - Add or remove attendees with intelligent credit handling
- **Capacity Enforcement** - Prevents overbooking (max 6 seats per dinner)
- **Automatic Credit Accounting**
  - Deducts credits when adding non-subscription members
  - Refunds credits only when they were originally charged
  - Tracks `credit_deducted` flag for accurate refunds
- **Real-time Updates** - See current seat occupancy (e.g., "4/6 seats filled")

#### 6. **Survey Configuration** (`/admin/surveys`)
- **Question Management** - Create onboarding and post-dinner surveys
- **Question Types**
  - Text (open-ended responses)
  - Multiple choice (predefined options)
  - Rating scale (1-5 or custom range)
  - Yes/No (boolean)
- **Matching Weights** - Assign importance to questions for algorithm
- **Reordering** - Drag-and-drop question sequencing
- **Survey Activation** - Enable/disable surveys as needed

#### 7. **Advanced Analytics** (`/admin/analytics`)
- **Cohort Analysis**
  - Retention by signup month
  - First-time vs. repeat attendance
  - Member lifetime value
- **City Demand Trends**
  - Members per city
  - Dinners hosted per location
  - Growth trends over time
- **Revenue Breakdown**
  - Credits purchased vs. subscription revenue
  - Average revenue per member
  - Monthly recurring revenue (MRR)
- **Restaurant Performance**
  - Top-rated venues
  - Most popular restaurants
  - Booking frequency rankings

#### 8. **Settings** (`/admin/settings`)
- **Email Notification Templates**
  - Confirmation emails
  - Reminder notifications
  - Cancellation notices
- **Promo Code Management**
  - Create discount codes
  - Track usage and expiration
  - Set credit amounts
- **Webhook Configuration** - Integrate with external systems (stub implementation)

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ (Replit provides Neon-backed PostgreSQL)
- **Git** for version control

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd social-dining-platform
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 15 (React framework)
- TypeScript (type safety)
- Tailwind CSS + shadcn/ui (UI components)
- PostgreSQL driver (`pg`)
- Authentication libraries (JWT, bcrypt)
- Email support (nodemailer)
- Data export utilities (xlsx, jspdf)

### 3. Database Setup

#### Option A: Using Replit (Recommended)

If you're on Replit, the PostgreSQL database is automatically provisioned. The `DATABASE_URL` environment variable is already set.

**Apply the database schema:**

```bash
# Create complete schema with all 20 tables (includes credit_deducted)
psql $DATABASE_URL < migrations/000_initial_schema.sql
```

#### Option B: Local PostgreSQL

1. **Create a database:**
   ```bash
   createdb social_dining_dev
   ```

2. **Set the DATABASE_URL:**
   ```bash
   export DATABASE_URL="postgresql://username:password@localhost:5432/social_dining_dev"
   ```

3. **Create the schema:**
   ```bash
   # Create complete schema with all 20 tables (includes credit_deducted)
   psql $DATABASE_URL < migrations/000_initial_schema.sql
   ```

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database (automatically set on Replit)
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email (optional - for notifications)
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:5000
```

**Required Secrets:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - For signing authentication tokens

**Optional Secrets:**
- `SMTP_USER`, `SMTP_PASS` - For sending email notifications

### 5. Database Migrations

The project uses version-controlled SQL migrations (no ORM migrations).

**For fresh database setup:**

```bash
# Migration 000: Creates complete schema with all 20 tables (includes credit_deducted)
psql $DATABASE_URL < migrations/000_initial_schema.sql

# Done! Migration 001 is not needed for fresh databases
```

**For existing databases (created before migration 000):**

```bash
# Migration 001: Adds credit_deducted column to existing dinner_assignments table
psql $DATABASE_URL < migrations/001_add_credit_deducted_to_dinner_assignments.sql
```

**Note:** Migration 000 already includes the `credit_deducted` column. Migration 001 is a legacy migration for databases that existed before the initial schema dump was created.

**Verify setup:**

```bash
# Check tables exist (should see 20 tables)
psql $DATABASE_URL -c "\dt"

# Verify credit_deducted column exists
psql $DATABASE_URL -c "\d dinner_assignments"
```

### 6. Create an Admin User

Since admin authentication is required, you'll need to create an admin user manually.

**Option A: Using Node.js to generate a hashed password**

```bash
# Generate a bcrypt hash for your password (e.g., 'admin123')
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 12).then(hash => console.log(hash));"

# Copy the hash output, then run this SQL (replace HASH_FROM_ABOVE):
psql $DATABASE_URL -c "
INSERT INTO users (email, password, name, role)
VALUES (
  'admin@example.com',
  'HASH_FROM_ABOVE',
  'Admin User',
  'admin'
);"
```

**Option B: All-in-one command (password: admin123)**

```bash
psql $DATABASE_URL -c "
INSERT INTO users (email, password, name, role)
VALUES (
  'admin@example.com',
  '\$2b\$12\$xjbQgM5RTo29yArAwfsLWunn/uhW7aHe7Oq.O4A7t9eepMfAnGqc6',
  'Admin User',
  'admin'
);"
```

**Option C: Register then promote**

1. Register a normal user at `/auth/register`
2. Promote to admin: `psql $DATABASE_URL -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"`

### 7. Run the Development Server

```bash
npm run dev
```

The application will start on **http://localhost:5000** (or http://0.0.0.0:5000 on Replit).

### 8. Access the Admin Dashboard

1. Navigate to **http://localhost:5000/auth/login**
2. Log in with your admin credentials (e.g., admin@example.com / admin123)
3. After login, manually navigate to **http://localhost:5000/admin/dashboard**

**Note:** Admin users must have `role = 'admin'` in the database. Regular users cannot access `/admin/*` routes.

## 📁 Project Structure

```
social-dining-platform/
├── src/
│   ├── app/
│   │   ├── admin/              # Admin dashboard pages
│   │   │   ├── dashboard/      # Analytics dashboard
│   │   │   ├── dinners/        # Dinner management
│   │   │   ├── members/        # Member CRM
│   │   │   ├── restaurants/    # Restaurant management
│   │   │   ├── groups/         # Group assignments
│   │   │   ├── surveys/        # Survey configuration
│   │   │   ├── analytics/      # Advanced analytics
│   │   │   ├── settings/       # Settings & config
│   │   │   └── layout.tsx      # Admin layout with nav
│   │   ├── api/
│   │   │   ├── admin/          # Protected admin API routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   └── events/         # Public event APIs
│   │   ├── events/             # Public event pages
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── admin/              # Admin-specific components
│   │   └── ...                 # Shared components
│   └── lib/
│       ├── database.ts          # Database connection helper
│       ├── middleware.ts        # Authentication middleware
│       ├── auth.ts              # Password hashing & JWT utilities
│       └── utils.ts             # Utility functions
├── migrations/                  # SQL migration files
│   ├── 000_initial_schema.sql  # Complete database schema (all 20 tables)
│   └── 001_add_credit_deducted_to_dinner_assignments.sql  # Legacy migration for existing databases
├── public/                     # Static assets
├── .env.local                  # Environment variables (not committed)
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── next.config.ts              # Next.js configuration
├── replit.md                   # Project documentation
└── README.md                   # This file
```

## 🗄️ Database Schema

### Core Tables

- **users** - Member profiles with credits, subscriptions, and roles
- **events** - 6-person dinner events with status tracking
- **dinner_assignments** - Member-to-dinner assignments with credit tracking
- **restaurants** - Partner restaurant database
- **cities** - Supported location list
- **surveys** - Configurable questionnaires
- **survey_responses** - Member answers for matching algorithm
- **credit_transactions** - Payment and credit history
- **subscriptions** - Unlimited dinner subscription records
- **promo_codes** - Promotional discount codes

### Key Relationships

- `events.restaurant_id` → `restaurants.id`
- `events.city_id` → `cities.id`
- `dinner_assignments.user_id` → `users.id`
- `dinner_assignments.event_id` → `events.id`
- `survey_responses.survey_id` → `surveys.id`
- `survey_responses.user_id` → `users.id`

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL (Neon-backed on Replit)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics visualizations
- **Exports**: XLSX for CSV exports, jsPDF for PDFs
- **Email**: Nodemailer for SMTP notifications
- **Icons**: Lucide React

## 🔒 Security Features

- **Role-based Access Control** - Admin routes protected with `withAdminAuth` middleware
- **JWT Authentication** - Secure token-based auth with HTTP-only cookies
- **Password Hashing** - bcrypt with salt rounds
- **SQL Injection Prevention** - Parameterized queries throughout
- **Input Validation** - Zod schemas on all forms and API endpoints
- **CORS Protection** - Next.js built-in security headers

## 📊 Business Logic

### Credit System
- **1 credit = 1 dinner seat**
- Members purchase credits or subscribe for unlimited access
- Credits deducted automatically on RSVP (if no active subscription)
- Refunds issued when admin removes member from dinner (if credit was charged)

### Subscription Model
- **Unlimited dinners** during subscription period
- No credit deduction for subscribers
- Auto-renewal tracking (stub)
- Cancellation handling with grace period

### Capacity Enforcement
- All dinners limited to **6 seats maximum**
- Real-time seat tracking (assignments count)
- Prevents overbooking at API level
- Waitlist functionality for full events

### Matching Algorithm
- Survey responses weighted by admin-configured values
- Demographic diversity considerations
- Dietary restrictions matching
- Social preferences alignment
- Manual override available in Group Management

## 🚢 Deployment (Production)

### On Replit

1. **Apply Production Schema:**
   
   **For fresh production database:**
   ```bash
   # Create complete schema with all 20 tables (includes credit_deducted)
   psql $DATABASE_URL < migrations/000_initial_schema.sql
   ```
   
   **For existing production database** (created before migration 000):
   ```bash
   # Only add credit_deducted column to existing database
   psql $DATABASE_URL < migrations/001_add_credit_deducted_to_dinner_assignments.sql
   ```

2. **Set Production Secrets:**
   - `JWT_SECRET` - Strong random key (use `openssl rand -base64 32`)
   - `SMTP_USER`, `SMTP_PASS` - Production email credentials

3. **Click "Deploy"** button in Replit UI

4. **Configure Custom Domain** (optional) in Replit deployment settings

### On Other Platforms (Vercel, Netlify, etc.)

1. Set environment variables in platform dashboard
2. Connect PostgreSQL database (Neon, Supabase, etc.)
3. Run migrations against production database
4. Deploy via Git integration

**Note:** Ensure `next.config.js` is configured for your platform (already set for Replit with port 5000 binding).

## 🧪 Testing

### Manual Testing Checklist

- [ ] Admin login/logout works
- [ ] Dashboard metrics display correctly
- [ ] Create a new dinner event
- [ ] Add members to dinner (verify credit deduction)
- [ ] Remove member from dinner (verify credit refund)
- [ ] Export CSVs from dinners and members pages
- [ ] Create/edit restaurant
- [ ] Create survey with multiple question types
- [ ] View analytics (cohort, city, revenue, restaurant)
- [ ] Capacity enforcement (try adding 7th person to dinner)

### Database Testing

```bash
# Verify schema
psql $DATABASE_URL -c "\dt"

# Check credit_deducted column exists
psql $DATABASE_URL -c "\d dinner_assignments"

# Test queries
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users WHERE role = 'admin';"
```

## 📝 Development Notes

### Making Schema Changes

1. **Never modify primary keys** on existing tables
2. **Create a new migration file** in `migrations/` folder
3. **Document the change** in `replit.md`
4. **Apply to dev database** first: `psql $DATABASE_URL < migrations/xxx.sql`
5. **Test thoroughly** before production deployment
6. **Apply to production** during maintenance window

### Adding New Admin Features

1. Create page in `src/app/admin/[feature]/page.tsx`
2. Create API route in `src/app/api/admin/[feature]/route.ts`
3. Wrap API with `withAdminAuth` middleware
4. Add navigation link in `src/app/admin/layout.tsx`
5. Update this README with feature description

### Code Style

- TypeScript with strict mode enabled
- Functional React components with hooks
- Server components by default, client components marked with `"use client"`
- Parameterized SQL queries (no ORM)
- Consistent error handling with try/catch and proper HTTP status codes

## 🐛 Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` is set correctly
- Check database is running: `psql $DATABASE_URL -c "SELECT 1;"`
- Ensure firewall allows connection

### "401 Unauthorized" on admin routes
- Verify JWT_SECRET is set
- Check admin user exists with `role = 'admin'`
- Clear browser cookies and log in again

### "Table doesn't exist" errors
- Run migrations: `psql $DATABASE_URL < migrations/001_add_credit_deducted_to_dinner_assignments.sql`
- Check schema: `psql $DATABASE_URL -c "\dt"`

### CSV export not working
- Check browser console for errors
- Verify data is loading in API response
- Ensure `xlsx` package is installed

### Capacity enforcement not working
- Verify migration was applied (`credit_deducted` column exists)
- Check API logs for errors
- Test with manual SQL: `SELECT COUNT(*) FROM dinner_assignments WHERE event_id = X;`

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Document database changes in `migrations/` folder
4. Update this README if adding new features
5. Test thoroughly (manual testing checklist above)
6. Commit with descriptive messages
7. Push to your fork and submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework for Production
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Lucide Icons](https://lucide.dev/) - Beautiful & consistent icon set
- [Recharts](https://recharts.org/) - Composable charting library
- [Replit](https://replit.com/) - Instant development environment

## 📧 Support

For questions or issues:
- Open an issue on GitHub
- Contact: admin@example.com
- Documentation: See `replit.md` for technical architecture details

---

**Built with ❤️ for food lovers and social butterflies**
