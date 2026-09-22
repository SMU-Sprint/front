// Shared UI demo, matching the original signup screen. Not server authentication.
(() => {
  const email = document.getElementById('emailInput');
  const code = document.getElementById('codeInput');
  const request = document.getElementById('authRequestBtn');
  const confirm = document.getElementById('authConfirmBtn');
  const error = document.getElementById('errorMsg');
  const next = document.getElementById('nextButton');
  const image = document.getElementById('nextImage');
  let verified = false;
  error.setAttribute('role', 'status');
  function render() {
    for (const [input, button] of [[email, request], [code, confirm]]) {
      const filled = input.value.trim() !== '';
      input.classList.toggle('active', filled);
      button.classList.toggle('active', filled);
      button.disabled = !filled;
    }
    image.src = `../images/next_${verified ? 'on' : 'off'}.png`;
    next.setAttribute('aria-disabled', String(!verified));
  }
  for (const input of [email, code]) input.addEventListener('input', () => {
    verified = false;
    error.classList.remove('show');
    render();
  });
  request.addEventListener('click', () => {
    if (!email.reportValidity()) return;
    verified = false;
    code.value = '';
    error.classList.remove('show');
    render();
    code.focus();
  });
  confirm.addEventListener('click', () => {
    // Existing prototype behavior only; replace with a server verification API for deployment.
    verified = Boolean(email.value.trim()) && email.checkValidity() && code.value.trim() === '1234';
    error.classList.toggle('show', !verified);
    render();
  });
  next.addEventListener('click', event => {
    if (!verified) { event.preventDefault(); code.focus(); }
  });
  render();
})();
