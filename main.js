const inputNome = document.querySelector('#inputNome');
const inputEmail = document.querySelector('#inputEmail');
const containerNome = document.querySelector('#containerNome');
const containerEmail = document.querySelector('#containerEmail');
const submitBtn = document.querySelector('#submitBtn');
const cta = document.querySelector('#cta');

const submit = async () => {
    const nome = inputNome.value;
    const email = inputEmail.value;

    if (!nome) containerNome.classList.add('missing');
    else containerNome.classList.remove('missing');
    if (!email) containerEmail.classList.add('missing');
    else containerEmail.classList.remove('missing');

    if (!nome || !email) return;

    submitBtn.value = 'Obrigado! Enviando...';
    const url = `https://docs.google.com/forms/d/e/1FAIpQLScg9-3Ed2C__hR-N0DARaclf9HAImeB05jKP0niqbUsf016og/formResponse?&submit=Submit?usp=pp_url&entry.540269197=${nome}&entry.1669851719=${email}`;

    try {
        await fetch(url, { mode: 'no-cors' });
        cta.innerHTML = `<h2>Obrigado! Você receberá as novidades do DayPlan e estamos ansiosos para tornar o seu cotidiano mais simples</h2>`;
    } catch (e) {
        console.log('error', e);
        cta.innerHTML = `<h2>Ocorreu um erro. Por favor tente novamente mais tarde recarregando a página. Queremos muito ajudar a tornar o seu cotidiano mais simples!</h2>`;
    }
};

[inputNome, inputEmail].forEach((inputText) =>
    inputText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
    })
);

submitBtn.addEventListener('click', submit);
