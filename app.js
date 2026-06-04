document.getElementById("emailForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const statusEl = document.getElementById("status");
  const submitBtn = document.getElementById("submitBtn");
  const progressBar = document.getElementById("progressBar");

  statusEl.className = "";
  statusEl.textContent = "";
  submitBtn.disabled = true;
  progressBar.value = 0;

  const form = e.target;
  const fileInput = form.querySelector("#attachments");
  const files = fileInput.files;

  if (files.length > 12) {
    statusEl.className = "error";
    statusEl.textContent = "Máximo de 12 anexos permitido.";
    submitBtn.disabled = false;
    return;
  }

  const attachments = [];
  let converted = 0;

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    attachments.push({
      filename: file.name,
      content: btoa(binary),
      encoding: "base64",
    });
    converted++;
    progressBar.value = (converted / files.length) * 100;
  }

  const payload = {
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
      progressBar.value = 0;
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
