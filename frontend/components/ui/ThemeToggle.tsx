'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label='Toggle theme'
      className='w-9 h-9 rounded-md flex items-center justify-center text-text-muted hover:text-text hover:bg-raised transition-colors'
    >
      <i className={`pi ${isDark ? 'pi-sun' : 'pi-moon'} text-base`} />
    </button>
  );
}
