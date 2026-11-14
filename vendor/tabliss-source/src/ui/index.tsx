import React from "react";
import catalog from "../../../../ui/catalog.json";
import {statePresentation, progressValue, AsyncState} from "../../../../ui/async-state";
import {openModal} from "../../../../ui/modal";

// React adapter for the same catalog used by the popup, Vue and native VPN.
type Kind = keyof typeof catalog;
type Spec = { tag: string; class: string; attrs?: Record<string, string>; tags?: string[] };
function component<P extends React.HTMLAttributes<HTMLElement>>(kind: Kind, defaultTag?: string) {
  const spec: Spec = catalog[kind];
  const Component = ({ as, className, children, ...props }: P & { as?: string }) => {
    const tag = as || defaultTag || spec.tag;
    if (!(spec.tags || [spec.tag]).includes(tag)) throw new Error(`Invalid tag for ${kind}: ${tag}`);
    const defaults = { ...spec.attrs };
    if (tag !== "button") delete defaults.type;
    const inputType = (props as React.InputHTMLAttributes<HTMLInputElement>).type;
    const controlClass = kind === "control" && tag === "input" && ["checkbox", "radio", "range", "color", "file"].includes(inputType || "")
      ? "ui-" + inputType : spec.class;
    return React.createElement(tag, { ...defaults, ...props, className: [controlClass, className].filter(Boolean).join(" ") }, children);
  };
  Component.displayName = "Ui" + kind[0].toUpperCase() + kind.slice(1);
  return Component;
}

export const UiButton = component<React.ButtonHTMLAttributes<HTMLButtonElement>>("button");
export const UiCard = component<React.FieldsetHTMLAttributes<HTMLFieldSetElement>>("card");
export const UiField = component<React.LabelHTMLAttributes<HTMLLabelElement>>("field");
export const UiCheck = component<React.LabelHTMLAttributes<HTMLLabelElement>>("check");
export const UiInput = component<React.InputHTMLAttributes<HTMLInputElement>>("control");
export const UiSelect = component<React.SelectHTMLAttributes<HTMLSelectElement>>("control", "select");
export const UiTextarea = component<React.TextareaHTMLAttributes<HTMLTextAreaElement>>("control", "textarea");
export const UiActions = component<React.HTMLAttributes<HTMLDivElement>>("actions");
export const UiStack = component<React.HTMLAttributes<HTMLDivElement>>("stack");
export const UiNote = component<React.HTMLAttributes<HTMLParagraphElement>>("note");
export const UiNotice = component<React.HTMLAttributes<HTMLParagraphElement>>("notice");
export const UiTitle = component<React.HTMLAttributes<HTMLHeadingElement>>("title");

export const UiAsyncState: React.FC<AsyncState & {onRetry?: () => void}> = ({kind = "", text, detail, retry, disabled, progress, onRetry}) => {
  if (!kind) return null;
  const state = statePresentation(kind);
  return <div className={state.className} role={state.role} aria-busy={state.busy} data-state={kind}>
    <p>{text}</p>{detail && <p>{detail}</p>}
    {progress !== undefined && <progress className="ui-progress" max={100} value={progressValue(progress)} aria-label={text} />}
    {retry && <UiButton disabled={disabled} onClick={onRetry}>{retry}</UiButton>}
  </div>;
};

export const UiDisclosure: React.FC<{title: string; openText: string; closeText: string; children: React.ReactNode}> = ({title, openText, closeText, children}) => {
  const [expanded, setExpanded] = React.useState(false);
  return <details className="ui-disclosure" onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary>{expanded ? closeText : openText} {title}</summary>
    {expanded && <UiStack className="ui-disclosure-body">{children}</UiStack>}
  </details>;
};

export const UiEditorCard: React.FC<{as?: "div" | "fieldset"; title: string; description?: string; actions?: React.ReactNode; children?: React.ReactNode}> = ({as = "fieldset", title, description, actions, children}) => (
  <UiCard as={as} className="Widget ui-editor" aria-label={title} role={as === "div" ? "group" : undefined}>
    <div className="ui-editor-heading"><h4>{title}</h4>{actions && <UiActions>{actions}</UiActions>}</div>
    {description && <UiNote>{description}</UiNote>}
    {children && <UiStack className="ui-editor-body">{children}</UiStack>}
  </UiCard>
);

export const UiModal: React.FC<{title: string; closeLabel: string; onClose: () => void; children: React.ReactNode}> = ({title, closeLabel, onClose, children}) => {
  const dialog = React.useRef<HTMLDialogElement>(null), close = React.useRef(onClose);
  close.current = onClose;
  React.useEffect(() => openModal(dialog.current!, () => close.current()), []);
  return <dialog ref={dialog} className="ui-modal" aria-label={title}>
    <UiActions className="ui-actions-end"><UiButton onClick={onClose}>{closeLabel}</UiButton></UiActions>
    {children}
  </dialog>;
};
