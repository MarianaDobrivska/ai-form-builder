# AI Form Builder

Describe a form in natural language → AI generates it → users fill it → review the results.

Built with Next.js 16 (App Router), TypeScript (strict), Prisma + SQLite, Anthropic Claude, Tailwind CSS, shadcn/ui, and Zod.

## Getting Started

Install dependencies and set up the database:

```bash
npm install
npx prisma migrate dev
```

Create a `.env` file with your credentials:

```bash
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit` (run before every commit)
- `npm run lint` — ESLint check
- `npx prisma studio` — database GUI

## Project Structure

```
src/
├── app/          App Router pages and API routes
├── components/   React components (fields, builder, ui)
├── hooks/        Client-side hooks
├── lib/          Business logic (ai, db, validators)
└── types/        Shared TypeScript types
```

See [`CLAUDE.md`](./CLAUDE.md) and [`docs/`](./docs) for architecture and conventions.
