/**
 * Override for the (stale) `@types/vexflow@1.2.42` package that
 * `opensheetmusicdisplay` pulls in transitively. That types package
 * describes VexFlow 1.x's old `Vex` namespace and shadows the modern
 * v5 types that ship inside the `vexflow` package itself.
 *
 * Re-export VexFlow 5's real types from their internal location so our
 * `import { Renderer, Stave, ... } from 'vexflow'` calls resolve.
 *
 * If `@types/vexflow` is ever removed (e.g. when OSMD updates its deps),
 * this file becomes redundant and can be deleted.
 */

// Re-export the named members we use directly from VexFlow 5's deep types
// path. The list is hand-maintained — extend it as we adopt more API.
declare module 'vexflow' {
  export { Accidental } from 'vexflow/build/types/src/accidental'
  export { Formatter } from 'vexflow/build/types/src/formatter'
  export { Renderer } from 'vexflow/build/types/src/renderer'
  export { Stave } from 'vexflow/build/types/src/stave'
  export { StaveConnector } from 'vexflow/build/types/src/staveconnector'
  export { StaveNote } from 'vexflow/build/types/src/stavenote'
  export { Voice } from 'vexflow/build/types/src/voice'
}
