// The menu dialog (all screen sizes).
import { openSheet } from './sheet';

const dialog = document.getElementById('menu') as HTMLDialogElement | null;
document.querySelectorAll<HTMLElement>('[data-open-menu]').forEach((btn) =>
  btn.addEventListener('click', () => dialog && openSheet(dialog)),
);
// Bag, search and in-page links inside the menu: close the menu first (capture runs before their own handlers).
dialog?.querySelectorAll<HTMLElement>('[data-open-bag], [data-open-search], a[href^="#"]').forEach((el) =>
  el.addEventListener('click', () => dialog.close(), { capture: true }),
);
