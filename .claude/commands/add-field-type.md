# Add New Field Type

Add a new field type `$ARGUMENTS` to the project. Follow these steps in order:

1. **types/field.types.ts** — add new type extending `BaseField` with `kind: '$ARGUMENTS'`. Add to `FormField` union.
2. **lib/validators/field.validators.ts** — add type guard `is${PascalCase}Field()` and validation logic in `validateField()` switch.
3. **components/fields/${PascalCase}Field.tsx** — create React component using shadcn/ui. Extend `BaseFieldRenderer`.
4. **components/fields/index.ts** — add export.
5. **lib/ai/generate-form.ts** — add new kind to the AI prompt description.

After all files: run `npm run typecheck` — the exhaustive switch in `renderField()` will show a compile error until the new case is handled.
