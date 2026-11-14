/* Shared loading, failure, empty and retry presentation. No IO. */
(function (root) {
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  function statePresentation(kind) {
    return {className: `ui-async-state ui-notice${["error", "warning", "success"].includes(kind) ? " ui-notice-" + kind : ""}`, role: kind === "error" ? "alert" : "status", busy: kind === "loading"};
  }
  function progressValue(value) {return typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : undefined;}
  function applyStatePresentation(host, kind) {
    const state = statePresentation(kind);
    host.classList.remove("ui-notice-error", "ui-notice-warning", "ui-notice-success");
    host.classList.add(...state.className.split(" "));
    host.setAttribute("role", state.role); host.setAttribute("aria-busy", String(state.busy)); host.dataset.state = kind;
  }
  function asyncStateMarkup({kind = "", text = "", detail = "", retry = "", action = "retry", disabled = false, progress} = {}) {
    if (!kind) return "";
    const state = statePresentation(kind), value = progressValue(progress);
    return `<div class="${state.className}" role="${state.role}" aria-busy="${state.busy}" data-state="${escape(kind)}"><p>${escape(text)}</p>${detail ? `<p>${escape(detail)}</p>` : ""}${progress !== undefined ? `<progress class="ui-progress" max="100" ${value !== undefined ? `value="${value}"` : ""} aria-label="${escape(text)}"></progress>` : ""}${retry ? `<button type="button" class="ui-button ui-button-secondary" data-action="${escape(action)}" ${disabled ? "disabled" : ""}>${escape(retry)}</button>` : ""}</div>`;
  }
  function renderAsyncState(host, state, onRetry) {
    host.innerHTML = asyncStateMarkup(state);
    if (onRetry) host.querySelector("button")?.addEventListener("click", event => {event.stopPropagation(); onRetry(event);});
  }
  const api = {asyncStateMarkup, renderAsyncState, escape, statePresentation, progressValue, applyStatePresentation};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SuperAsyncState = api;
})(globalThis);
