export const motionTokens = {
  ease: {
    enter: [0.16, 1, 0.3, 1] as const,
    standard: [0.22, 1, 0.36, 1] as const,
  },
  duration: {
    instant: 0.12,
    fast: 0.16,
    standard: 0.24,
  },
  blur: {
    subtle: 2,
    soft: 4,
  },
  stagger: {
    item: 0.03,
  },
  spring: {
    snappy: { type: 'spring' as const, stiffness: 460, damping: 28, mass: 0.8 },
    morph: { type: 'spring' as const, stiffness: 380, damping: 30, mass: 0.9 },
    smooth: { type: 'spring' as const, stiffness: 300, damping: 28, mass: 1 },
  },
};
