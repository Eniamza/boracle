# BRACU Oracle

[![Discord](https://dcbadge.limes.pink/api/server/Tzcmjnq699)](https://discord.gg/Tzcmjnq699)

BRACU Oracle is a comprehensive academic management platform designed specifically for BRAC University students. It aims to streamline the course registration process, provide real-time information, and enhance the overall academic experience.

![BRACU Oracle Preview](https://i.imgur.com/zORJ7QM.png)

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [License](#license)

## Key Features

- **PrePreReg**: Build your course routine effortlessly with intelligent scheduling based on live data
- **Live Seat Status**: Real-time updates on course seat availability
- **Course Swap Platform**: Centralized system for course swapping between students
- **Faculty Review System**: Structured platform for faculty ratings and feedback
- **Course Directory**: Comprehensive repository of academic resources and materials

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js with Google OAuth
- **UI Components**: Radix UI, shadcn/ui
- **Package Manager**: npm

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm
- Supabase account

### Quick Start

1. **Clone and install:**
```bash
git clone <repository-url>
cd boracle
npm install
```

2. **Set up environment:**
Create a `.env` file:
```env
DATABASE_URL=postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
AUTH_SECRET=your-auth-secret-here
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret
```

3. **Setup database and start:**
```bash
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

**Note:** Only BRACU emails (@g.bracu.ac.bd) can sign in.

### Database Commands

```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema changes (recommended for Supabase)
npm run db:push

# Seed database with sample data
npm run db:seed
```

## Contributing

We welcome contributions! Please follow these steps:

1. **Comment on an issue** before starting work
2. **Fork the repo** and create a feature branch
3. **Follow conventional commits**: `feat:`, `fix:`, `docs:`, etc.
4. **Reference issues** in commits: `fixes #123`
5. **Test locally** before submitting PR

**Commit Examples:**
```bash
git commit -m "feat: add course filtering (closes #123)"
git commit -m "fix: resolve login issue (fixes #456)"
```

Join our [Discord](https://discord.gg/Tzcmjnq699) for help!

## License

MIT License
