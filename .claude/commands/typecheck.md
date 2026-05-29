# TypeScript Check

Run `npm run typecheck` (or `npx tsc --noEmit`) and fix ALL errors.

For each error:
1. Show the exact error message and file location
2. Explain WHY it's a type error — don't just fix silently
3. Fix using proper TS patterns — no `as`, no `any`, no `@ts-ignore`

Common patterns in this project:
- `unknown` from AI/API → use type guard before accessing properties
- Missing switch case → add the case, keep `assertNever` at the end
- `T | undefined` from `noUncheckedIndexedAccess` → guard with `if (item)` before use
- Optional chaining where type expects non-null → guard or fix the type
