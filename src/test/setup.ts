import '@testing-library/jest-dom/vitest';
import { MotionGlobalConfig } from 'motion/react';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom does not implement scrolling.
window.scrollTo = () => {};

// Animations finish instantly in tests, so assertions see final values.
MotionGlobalConfig.skipAnimations = true;
