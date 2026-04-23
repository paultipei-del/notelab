import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  reactCompiler: true,
};

const withMDX = createMDX({
  // Default MDX provider (@mdx-js/react) — no remark/rehype plugins until
  // there's a concrete need. Page metadata is passed via exported consts
  // per §7 rather than YAML frontmatter.
});

export default withMDX(nextConfig);
