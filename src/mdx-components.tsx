import type { MDXComponents } from 'mdx/types'

// Required file for @next/mdx App Router integration. Start minimal —
// reference pages handle their own typography inside LearnPageLayout, so no
// global HTML overrides for now. Add element overrides here later if every
// MDX page ends up needing the same visual tweak.
const components: MDXComponents = {}

export function useMDXComponents(): MDXComponents {
  return components
}
