'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Regex, Zap, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/30 group-hover:bg-accent/20 transition-colors">
            <Regex className="h-4 w-4 text-accent" />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight text-text">
              Regex<span className="text-accent">Forge</span>
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              pathname === '/'
                ? 'bg-accent/10 text-accent'
                : 'text-text-dim hover:text-text hover:bg-surface2'
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            工作台
          </Link>
          <Link
            href="/prompts"
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              pathname === '/prompts'
                ? 'bg-accent/10 text-accent'
                : 'text-text-dim hover:text-text hover:bg-surface2'
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            提示词
          </Link>
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              pathname === '/settings'
                ? 'bg-accent/10 text-accent'
                : 'text-text-dim hover:text-text hover:bg-surface2'
            )}
          >
            <Settings className="h-3.5 w-3.5" />
            模型配置
          </Link>
        </nav>
      </div>
    </header>
  );
}
