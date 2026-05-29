# AI Form Builder

Next.js 16 + TypeScript project.
Users describe a form in natural language → AI generates it → users fill it → analytics.

@.claude/next16-notice.md

---

## Tech Stack

- **Framework**: Next.js 16, App Router
- **Language**: TypeScript (strict mode — no exceptions)
- **Database**: Prisma + SQLite
- **AI**: Anthropic Claude API (`claude-haiku-4-5`)
- **UI**: Tailwind CSS + shadcn/ui
- **Validation**: Zod
- **Linting**: ESLint + typescript-eslint

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── forms/route.ts
│   │   ├── forms/[id]/route.ts
│   │   ├── generate/route.ts
│   │   └── submissions/route.ts
│   ├── forms/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── [id]/results/page.tsx
│   └── builder/page.tsx
├── types/
│   ├── field.types.ts
│   ├── form.types.ts
│   ├── api.types.ts
│   └── index.ts
├── lib/
│   ├── ai/generate-form.ts
│   ├── validators/field.validators.ts
│   ├── validators/form.validators.ts
│   └── db/
│       ├── prisma.ts
│       └── forms.repository.ts
├── components/
│   ├── fields/          (TextField, SelectField, CheckboxField, NumberField, DateField, index.ts)
│   ├── builder/         (FormBuilder, FieldPreview)
│   └── ui/              (shadcn/ui components)
└── hooks/
    ├── useFormSubmission.ts
    └── useFormBuilder.ts
```

---

## Commands

- `npm run dev` — start dev server
- `npm run typecheck` — `tsc --noEmit` — run before every commit
- `npm run lint` — ESLint check
- `npx prisma migrate dev` — run migrations
- `npx prisma studio` — DB GUI

---

@.claude/typescript-rules.md
@.claude/architecture.md
