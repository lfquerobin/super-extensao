/* SPDX-License-Identifier: GPL-3.0-only */
import React from "react";
import { FallbackProps } from "react-error-boundary";
import * as DB from "../engine/database";
import { State } from "../engine/model";
import { Catalog } from "../engine/catalog";
import { editorActions } from "../engine/editor";
import { dashboardStore } from "../engine/dashboard";
import { PluginApi, PluginProvider, useValue } from "../dashboard/Dashboard";
import { AsyncState } from "../../ui/async-state";

type Control<P> = React.ComponentType<P & { as?: string }>;
export interface EditorUi {
  UiInput: Control<React.InputHTMLAttributes<HTMLInputElement>>;
  UiSelect: Control<React.SelectHTMLAttributes<HTMLSelectElement>>;
  UiButton: Control<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  UiField: Control<React.LabelHTMLAttributes<HTMLLabelElement>>;
  UiActions: Control<React.HTMLAttributes<HTMLDivElement>>;
  UiStack: Control<React.HTMLAttributes<HTMLDivElement>>;
  UiNote: Control<React.HTMLAttributes<HTMLParagraphElement>>;
  UiEditorCard: React.ComponentType<{
    as?: "div" | "fieldset";
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
  }>;
  UiAsyncState: React.ComponentType<AsyncState & { onRetry?: () => void }>;
  UiDisclosure: React.ComponentType<{
    title: string;
    openText: string;
    closeText: string;
    children: React.ReactNode;
  }>;
}
export interface PluginBinding {
  dashboardComponent: React.ComponentType<PluginApi>;
  settingsComponent?: React.ComponentType<PluginApi>;
}
export interface EditorServices {
  db: DB.Database<State>;
  cache: DB.Database<Record<string, unknown>>;
  catalog: Catalog<PluginBinding>;
  t(text: string): string;
  ui: EditorUi;
  toggleSettings(): void;
  pushLoader(): void;
  popLoader(): void;
  confirm(message: string): Promise<boolean>;
  Logo: React.ComponentType;
  TimeZoneInput: React.ComponentType<{
    timeZone: string | null;
    onChange(value: string | null): void;
  }>;
  Failure: React.ComponentType<FallbackProps>;
  Icon: React.ComponentType<{ name: string }>;
  IconButton: React.ComponentType<
    React.AriaAttributes & {
      children: React.ReactNode;
      onClick(): void;
      primary?: boolean;
      title?: string;
    }
  >;
}
export const EditorContext = React.createContext<
  (EditorServices & { locale: string }) | null
>(null);
export function useEditor() {
  const context = React.useContext(EditorContext);
  if (!context) throw Error("Editor services not available");
  const actions = React.useMemo(
    () => editorActions(context.db, context.cache, context.catalog),
    [context.db, context.cache, context.catalog]
  );
  return { ...context, actions };
}
export function useKey<K extends DB.Key<State>>(
  db: DB.Database<State>,
  key: K
): [State[K], (value: State[K]) => void] {
  return [useValue(db, key), (value) => DB.put(db, key, value)];
}
export function useWidgets() {
  const { db } = useEditor();
  const store = React.useMemo(() => dashboardStore(db), [db]);
  return React.useSyncExternalStore(store.subscribe, store.read).items;
}
export function PluginSettings({
  item,
  background = false,
}: {
  item: State["background"] | NonNullable<State[`widget/${string}`]>;
  background?: boolean;
}) {
  const services = useEditor();
  const resolve = React.useCallback(
    (key: string) => services.catalog.get(key).settingsComponent,
    [services.catalog]
  );
  return (
    <PluginProvider
      item={item}
      background={background}
      ports={{ ...services, resolve }}
    />
  );
}
export function ToggleSection({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const {
    t,
    ui: { UiDisclosure },
  } = useEditor();
  return (
    <UiDisclosure title={name} openText={t("Open")} closeText={t("Close")}>
      {children}
    </UiDisclosure>
  );
}
