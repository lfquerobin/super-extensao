/* SPDX-License-Identifier: GPL-3.0-only */
export interface SessionPorts {
  current(): boolean;
  setData(value: unknown): void;
  setCache(value: unknown): void;
  pushLoader(): void;
  popLoader(): void;
}
/** One mounted provider instance. Late work cannot resurrect removed settings
 * or cache; outstanding loading indicators are released exactly once. */
export function pluginSession(ports: SessionPorts) {
  let disposed = false;
  let pending = 0;
  const active = () => !disposed && ports.current();
  return {
    setData(value: unknown) {
      if (active()) ports.setData(value);
    },
    setCache(value: unknown) {
      if (active()) ports.setCache(value);
    },
    loader: {
      push() {
        if (active()) {
          pending++;
          ports.pushLoader();
        }
      },
      pop() {
        if (!disposed && pending > 0) {
          pending--;
          ports.popLoader();
        }
      },
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      while (pending > 0) {
        pending--;
        ports.popLoader();
      }
    },
  };
}
