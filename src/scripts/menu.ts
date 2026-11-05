// Phone menu sheet.
import { openSheet } from './sheet';

const dialog = document.getElementById('menu') as HTMLDialogElement | null;
document.querySelectorAll<HTMLElement>('[data-open-menu]').forEach((btn) =>
  btn.addEventListener('click', () => dialog && openSheet(dialog)),
);
// Wider than the phone layout: the menu has no reason to stay open.
matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
  if (e.matches && dialog?.open) dialog.close();
});
