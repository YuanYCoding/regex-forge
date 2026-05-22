import type { Metadata } from 'next';
import { Providers } from '@/components/layout/Provider';
import { Header } from '@/components/layout/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'RegexForge - 正则表达式自动化测试与生成',
  description: '通过 AI 大模型自动生成话术正则表达式，支持批量测试与一键适配修正',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
