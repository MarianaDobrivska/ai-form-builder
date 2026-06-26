'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Copies the current page URL (the shareable form link) to the clipboard.
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be unavailable (e.g. insecure context); fail silently.
    }
  }

  return (
    <Button variant="outline" onClick={copy} className="shrink-0">
      {copied ? 'Copied!' : 'Copy link'}
    </Button>
  )
}
