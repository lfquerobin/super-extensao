/* SPDX-License-Identifier: GPL-3.0-only
 * Layout adapted from Tabliss 2.6.0, Joël Shepherd and contributors.
 * Super Extensão owns dashboard composition and provider instance lifetimes. */
import React from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import * as DB from "../engine/database";
import { State, BackgroundState, WidgetState } from "../engine/model";
import { dashboardStore } from "../engine/dashboard";
import { pluginSession } from "../engine/plugin-session";
import "./Dashboard.sass";
import "./Widgets.sass";
import "./Slot.sass";

export interface PluginApi {
  data?: any;
  cache?: any;
  setData(value: any): void;
  setCache(value: any): void;
  loader: { push(): void; pop(): void };
}
export interface DashboardPorts {
  db: DB.Database<State>;
  cache: DB.Database<Record<string, unknown>>;
  resolve(key: string): React.ComponentType<PluginApi>;
  pushLoader(): void;
  popLoader(): void;
  Overlay: React.ComponentType;
  Failure: React.ComponentType<FallbackProps>;
}
function useValue<T, K extends DB.Key<T>>(db: DB.Database<T>, key: K): T[K] {
  const subscribe = React.useCallback(
    (notify: () => void) =>
      DB.listen(db, ([changed]) => {
        if (changed === key) notify();
      }),
    [db, key]
  );
  return React.useSyncExternalStore(subscribe, () => DB.get(db, key));
}
function Instance({
  item,
  background,
  ports,
}: {
  item: BackgroundState | WidgetState;
  background: boolean;
  ports: DashboardPorts;
}) {
  const { db, cache, pushLoader, popLoader } = ports;
  const { id, key } = item;
  const data = useValue(db, `data/${id}`);
  const cached = useValue(cache, id);
  const [session, setSession] =
    React.useState<ReturnType<typeof pluginSession>>();
  React.useLayoutEffect(() => {
    const instance = pluginSession({
      current: () => {
        const current = background
          ? DB.get(db, "background")
          : DB.get(db, `widget/${id}`);
        return current?.id === id && current.key === key;
      },
      setData: (value) => DB.put(db, `data/${id}`, value),
      setCache: (value) => DB.put(cache, id, value),
      pushLoader,
      popLoader,
    });
    setSession(instance);
    return () => instance.dispose();
  }, [db, cache, id, key, background, pushLoader, popLoader]);
  if (!session) return null;
  const Component = ports.resolve(key);
  return (
    <Component
      data={data}
      cache={cached}
      setData={session.setData}
      setCache={session.setCache}
      loader={session.loader}
    />
  );
}
function Provider({
  item,
  background = false,
  ports,
}: {
  item: BackgroundState | WidgetState;
  background?: boolean;
  ports: DashboardPorts;
}) {
  return (
    <ErrorBoundary
      key={`${item.id}:${item.key}`}
      FallbackComponent={ports.Failure}
    >
      <Instance item={item} background={background} ports={ports} />
    </ErrorBoundary>
  );
}
export default function Dashboard(ports: DashboardPorts) {
  const store = React.useMemo(() => dashboardStore(ports.db), [ports.db]);
  const { background, focus, slots, theme } = React.useSyncExternalStore(
    store.subscribe,
    store.read
  );
  React.useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* optional initial paint hint */
    }
  }, [theme]);
  const Overlay = ports.Overlay;
  return (
    <div className={`Dashboard fullscreen ${theme}`}>
      <div className="Background">
        <Provider item={background} background ports={ports} />
      </div>
      <div className="Widgets fullscreen">
        <div className="container">
          {!focus &&
            [...slots].map(([position, items]) => (
              <div className={`Slot ${position}`} key={position}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`Widget ${
                      item.display.fontWeight ? "weight-override" : ""
                    }`}
                    style={{
                      color: item.display.colour,
                      fontFamily: item.display.fontFamily,
                      fontSize: `${item.display.fontSize ?? 24}px`,
                      fontWeight: item.display.fontWeight,
                    }}
                  >
                    <Provider item={item} ports={ports} />
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
      <Overlay />
    </div>
  );
}
