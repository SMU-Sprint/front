async function loadSidebar() {
  const host = document.querySelector('#sidebar-container');
  if (!host) return;

  try {
    const response = await fetch('sidebar.html');
    if (!response.ok) throw new Error('sidebar load failed');
    host.innerHTML = await response.text();
    const page = document.body.dataset.page;
    const activePage = page?.startsWith('mypage') ? 'mypage' : page;
    host.querySelector(`[data-page="${activePage}"]`)?.classList.add('is-active');
  } catch {
    host.innerHTML = '<p class="sidebar-error">Live Server로 실행해 주세요.</p>';
  }
}

function bindModals() {
  document.querySelectorAll('[data-modal-open]').forEach((button) => {
    button.addEventListener('click', () => {
      document.getElementById(button.dataset.modalOpen)?.showModal();
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog')?.close());
  });
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
  bindModals();
});
