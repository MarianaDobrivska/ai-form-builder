'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button, buttonVariants } from '@/components/ui/button'

export function SiteHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-1">
          {!isHome && (
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              ← Back
            </Button>
          )}
          <Link
            href="/"
            className="px-2 font-semibold tracking-tight hover:opacity-80"
          >
            AI Form Builder
          </Link>
        </div>

        <nav className="flex items-center gap-1">
          <Link
            href="/forms"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Forms
          </Link>
          <Link
            href="/builder"
            className={buttonVariants({ size: 'sm' })}
          >
            New form
          </Link>
        </nav>
      </div>
    </header>
  )
}
