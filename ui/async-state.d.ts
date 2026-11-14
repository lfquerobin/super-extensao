export interface AsyncState {
  kind?: string; text?: string; detail?: string; retry?: string; action?: string; disabled?: boolean;
  progress?: number | null;
}
export function asyncStateMarkup(state?: AsyncState): string;
export function statePresentation(kind: string): {className: string; role: "alert" | "status"; busy: boolean};
export function progressValue(value: unknown): number | undefined;
export function applyStatePresentation(host: HTMLElement, kind: string): void;
