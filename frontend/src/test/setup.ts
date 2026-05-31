import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom lacks ResizeObserver, which @xyflow/react relies on to measure the canvas.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver =
  ResizeObserverStub as unknown as typeof ResizeObserver;

// Unmount React trees between tests (not auto-registered when globals are off).
afterEach(() => cleanup());
