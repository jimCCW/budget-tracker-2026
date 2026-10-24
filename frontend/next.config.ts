import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Type-check app code only during `next build`; `pnpm tsc --noEmit` still covers __tests__/
  typescript: { tsconfigPath: './tsconfig.build.json' },
};

export default nextConfig;
