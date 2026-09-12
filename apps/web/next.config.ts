import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // `next dev` would otherwise append a managed block to apps/web/CLAUDE.md, which is a
  // hand-maintained project specification.
  agentRules: false,
};

export default nextConfig;
