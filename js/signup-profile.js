(() => {
  const inputs = ['age', 'height', 'weight'].map(name => document.getElementById(`${name}Input`));
  const selects = ['region', 'day', 'time'].map(name => document.getElementById(`${name}Input`));
  const button = document.getElementById('signupButton');
  const image = document.getElementById('signupImage');
  let gender = 'male';
  ['male', 'female'].forEach(value => document.getElementById(`${value}Btn`).addEventListener('click', () => {
    gender = value;
    ['male', 'female'].forEach(g => {
      const b = document.getElementById(`${g}Btn`);
      b.classList.toggle('active', g === gender); b.setAttribute('aria-pressed', String(g === gender));
    });
  }));
  const values = select => JSON.parse(select.dataset.values || '[]');
  const valid = () => inputs.every(i => i.value !== '' && i.checkValidity()) && selects.every(s => values(s).length > 0);
  function update() {
    inputs.forEach(i => i.classList.toggle('active', i.value !== ''));
    image.src = `../images/signup_${valid() ? 'on' : 'off'}.png`;
    button.setAttribute('aria-disabled', String(!valid()));
  }
  inputs.forEach(i => i.addEventListener('input', update));
  selects.forEach(s => s.addEventListener('change', update));
  button.addEventListener('click', e => {
    e.preventDefault();
    if (!valid() || button.dataset.busy) return;
    const profile = { gender, age: Number(inputs[0].value), height: Number(inputs[1].value), weight: Number(inputs[2].value), region: values(selects[0])[0], days: values(selects[1]), times: values(selects[2]) };
    button.dataset.busy = 'true';
    try {
      sessionStorage.setItem('sprint.signupProfile', JSON.stringify(profile));
      location.assign('survey1.html');
    } catch (error) { alert(error.message); }
    finally { delete button.dataset.busy; }
  });
  update();
})();
