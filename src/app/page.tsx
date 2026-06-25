import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">AI Form Builder</h1>
        <p className="max-w-md text-muted-foreground">
          Describe a form in plain language and let AI generate it. Share it,
          collect responses, and review the results.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/builder" className={buttonVariants()}>
          Create a form
        </Link>
        <Link href="/forms" className={buttonVariants({ variant: "outline" })}>
          Browse forms
        </Link>
      </div>
    </main>
  );
}
