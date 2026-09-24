'use client';
import { ThemeProvider } from 'next-themes';
import { MotionConfig } from 'motion/react';
export function Providers({ children }: { children: React.ReactNode }) { return <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false} storageKey="truper-theme"><MotionConfig reducedMotion="user">{children}</MotionConfig></ThemeProvider>; }
