import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  reactCompiler: true,
  async redirects() {
    return [
      // Permanent redirect from the legacy query-string ear-training URL
      // to the dedicated /ear-training route.
      {
        source: '/collection',
        has: [{ type: 'query', key: 'tag', value: 'ear' }],
        destination: '/ear-training',
        permanent: true,
      },
      // The Rhythm Reading program lives at /programs/rhythm. Catch the
      // natural alias users (and external links) reach for.
      {
        source: '/programs/rhythm-reading',
        destination: '/programs/rhythm',
        permanent: true,
      },
      {
        source: '/programs/rhythm-reading/:path*',
        destination: '/programs/rhythm/:path*',
        permanent: true,
      },
      {
        source: '/rhythm-reading',
        destination: '/programs/rhythm',
        permanent: true,
      },
    ]
  },
};

const withMDX = createMDX({
  // remark-gfm enables GitHub-flavored markdown features (tables, strikethrough,
  // task lists). The reference pages in /learn use markdown tables for summary
  // grids, which the default CommonMark parser ignores. Specified as a string
  // so it works with Turbopack — Next 16's MDX docs require this form.
  options: {
    remarkPlugins: [['remark-gfm', {}]],
  },
});

export default withMDX(nextConfig);
