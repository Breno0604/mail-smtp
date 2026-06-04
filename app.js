document.getElementById("emailForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const statusEl = document.getElementById("status");
  const submitBtn = document.getElementById("submitBtn");

  statusEl.className = "";
  statusEl.textContent = "Enviando...";
  submitBtn.disabled = true;

  const form = e.target;
  const fileInput = form.querySelector("#attachments");
  const attachments = [];

  for (const file of fileInput.files) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    attachments.push({
      filename: file.name,
      content: btoa(binary),
      encoding: "base64",
    });
  }

  const payload = {
    from: form.from.value,
    to: form.to.value,
    subject: form.subject.value,
    text: form.text.value,
    attachments,
  };

  try {
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      statusEl.className = "success";
      statusEl.textContent = "Email enviado com sucesso!";
      form.reset();
    } else {
      statusEl.className = "error";
      statusEl.textContent = data.error || "Erro ao enviar email.";
    }
  } catch (err) {
    statusEl.className = "error";
    statusEl.textContent = "Erro de conexão. Tente novamente.";
  } finally {
    submitBtn.disabled = false;
  }
});
