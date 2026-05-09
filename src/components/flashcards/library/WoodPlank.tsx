'use client'

/**
 * The wood-plank shelf surface that books sit on. Pure visual, no logic.
 * Three stacked layers:
 *   - 4px highlight band on top (the lit edge facing the books)
 *   - 14px body with a subtle plank-seam pattern
 *   - 14px soft shadow blooming downward (overflows below the plank box)
 *
 * Originally inline JSX inside Shelf.tsx; extracted so ShelfHero (and
 * eventually MiniShelf in Phase 3) can render the same shelf without
 * duplicating the gradient stack.
 */
export default function WoodPlank() {
  return (
    <div
      style={{
        position: 'relative',
        height: 18,
        marginTop: -2,
        zIndex: 1,
        width: '100%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(180deg, #8a6840 0%, #6e5230 50%, #5a4226 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,220,160,0.3)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 0,
          right: 0,
          height: 14,
          background: 'linear-gradient(180deg, #6e5230 0%, #5a4226 40%, #4a361e 100%)',
          backgroundImage:
            'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%), repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0px, transparent 2px, transparent 50px, rgba(0,0,0,0.05) 51px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: 8,
          right: 8,
          height: 14,
          background:
            'radial-gradient(ellipse at center top, rgba(40,25,10,0.35) 0%, transparent 70%)',
          filter: 'blur(2px)',
        }}
      />
    </div>
  )
}
