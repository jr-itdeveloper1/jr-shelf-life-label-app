
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function closeModal() {
  document.querySelectorAll('.modal-backdrop.open').forEach((modal) => modal.classList.remove('open'));
}

document.addEventListener('click', (event) => {
  const modalTarget = event.target.closest('[data-modal-target]');
  if (modalTarget) {
    const modal = document.getElementById(modalTarget.dataset.modalTarget);
    if (modal) modal.classList.add('open');
    return;
  }

  if (event.target.matches('[data-close-modal]') || event.target.closest('[data-action="close-modal"]')) {
    closeModal();
    return;
  }

  if (event.target.classList.contains('modal-backdrop')) {
    closeModal();
    return;
  }

  const go = event.target.closest('[data-go]');
  if (go) {
    window.location.href = go.dataset.go;
    return;
  }

  const action = event.target.closest('[data-action]');
  if (action) {
    const value = action.dataset.action;
    if (value === 'save-modal') {
      closeModal();
      showToast('Saved in mockup');
    } else if (value === 'confirm-danger') {
      showToast('Confirmation required in production');
    } else if (value === 'clear-filter') {
      document.querySelectorAll('[data-table-filter]').forEach((input) => {
        input.value = '';
        input.dispatchEvent(new Event('input'));
      });
      showToast('Filters cleared');
    } else if (value === 'toast') {
      showToast('Mock action completed');
    }
  }
});

document.querySelectorAll('[data-table-filter]').forEach((input) => {
  input.addEventListener('input', () => {
    const table = document.getElementById(input.dataset.tableFilter);
    if (!table) return;
    const query = input.value.trim().toLowerCase();
    table.querySelectorAll('tbody tr').forEach((row) => {
      row.hidden = query && !row.dataset.search.toLowerCase().includes(query);
    });
  });
});

const roleSwitch = document.querySelector('[data-role-switch]');
if (roleSwitch) {
  roleSwitch.addEventListener('change', () => {
    window.location.href = roleSwitch.value;
  });
}

const loginSubmit = document.querySelector('[data-login-submit]');
if (loginSubmit) {
  loginSubmit.addEventListener('click', () => {
    const select = document.getElementById('loginRole');
    window.location.href = select?.value || 'company-dashboard.html';
  });
}
