const token = 'EAATOmjmayVEBSlw1T8JtrU8ZAs29vQu5NeCF6GgRJi8K0dZBypElHXsnUjYfiRmQffJMQPXfHCKZAR4N0ZAkDvMQq8byVeXMbCZCecLpTxcg0WOAEh4WESBp1soWXAYlI3ezzSVbwTO6NCyBC9SdaYtry7U41zxc2PwqOCdxbWZBpl0FBPpw483J3EpGnZBk6OetPWeF3OR5iW6XKykI7yzJOKsiLzkzRZC1nA1DojVBrCI6GnqXuSo7ZA8Y3ZBZAHZA5mfO0Y73yNniHgx51j7IPo6DDRjc';
const phoneId = '1350864618112079';
const toPhone = '593993995471';

async function send() {
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toPhone,
    type: "text",
    text: { preview_url: false, body: "Test de diagnóstico desde el servidor" }
  };

  const res = await fetch("https://graph.facebook.com/v19.0/" + phoneId + "/messages", {
    method: 'POST',
    headers: {
      'Authorization': "Bearer " + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.dir(data, {depth: null});
}
send();
