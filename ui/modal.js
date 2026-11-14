/* Native dialog lifecycle shared by Vue and React. No application actions. */
(function(root) {
  function openModal(dialog, onDismiss, initialFocus) {
    const doc = dialog.ownerDocument, previous = doc.activeElement;
    let disposed = false;
    const dismiss = event => {event?.preventDefault(); event?.stopPropagation(); if (!disposed) onDismiss();};
    const key = event => {
      if (event.key === "Escape") return dismiss(event);
      if (event.key !== "Tab") return;
      const items = [...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]')].filter(node => !node.closest('[hidden]') && !node.closest('details:not([open]) > :not(summary)'));
      const first = items[0] || dialog, last = items[items.length-1] || dialog;
      if (event.shiftKey && (doc.activeElement === first || !dialog.contains(doc.activeElement))) {event.preventDefault(); last.focus();}
      else if (!event.shiftKey && (doc.activeElement === last || !dialog.contains(doc.activeElement))) {event.preventDefault(); first.focus();}
    };
    const backdrop = event => {if (event.target === dialog) {const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dismiss(event);}};
    dialog.addEventListener("cancel", dismiss); dialog.addEventListener("keydown", key); dialog.addEventListener("click", backdrop);
    dialog.setAttribute("aria-modal", "true"); dialog.tabIndex = -1;
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.open = true;
    (initialFocus || dialog.querySelector('button:not([disabled]),input:not([disabled]),[tabindex="0"]') || dialog).focus();
    return () => {
      if (disposed) return; disposed = true;
      dialog.removeEventListener("cancel", dismiss); dialog.removeEventListener("keydown", key); dialog.removeEventListener("click", backdrop);
      if (typeof dialog.close === "function" && dialog.open) dialog.close(); else dialog.open = false;
      if (previous?.isConnected) previous.focus({preventScroll: true});
    };
  }
  if (typeof module !== "undefined" && module.exports) module.exports = {openModal};
  else root.SuperModal = {openModal};
})(globalThis);
