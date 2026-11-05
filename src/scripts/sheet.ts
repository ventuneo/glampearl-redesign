// Shared open/close for <dialog> sheets: native focus trap and Esc, plus close on backdrop and [data-close].
const wired = new WeakSet<HTMLDialogElement>();

function wire(dialog: HTMLDialogElement) {
  if (wired.has(dialog)) return;
  wired.add(dialog);
  dialog.addEventListener('click', (e) => {
    // The inner wrapper fills the dialog, so a click on the dialog itself is a click on the backdrop.
    if (e.target === dialog) dialog.close();
    if ((e.target as HTMLElement).closest('[data-close]')) dialog.close();
  });
}

let opener: HTMLElement | null = null;

export function openSheet(dialog: HTMLDialogElement) {
  wire(dialog);
  if (dialog.open) return;
  opener = document.activeElement as HTMLElement | null;
  dialog.showModal();
  dialog.addEventListener(
    'close',
    () => {
      opener?.focus?.();
      opener = null;
    },
    { once: true },
  );
}

export function closeSheet(dialog: HTMLDialogElement) {
  if (dialog.open) dialog.close();
}
