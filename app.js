function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(blob);
  });
}

async function toBase64(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

document.getElementById("emailForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const statusEl = document.getElementById("status");
  const submitBtn = document.getElementById("submitBtn");

  statusEl.className = "";
  statusEl.textContent = "Enviando email...";
  submitBtn.disabled = true;

  const form = e.target;
  const fileInput = form.querySelector("#attachments");
  const files = fileInput.files;

  if (files.length > 12) {
    statusEl.className = "error";
    statusEl.textContent = "Máximo de 12 anexos permitido.";
    submitBtn.disabled = false;
    return;
  }

  const MAX_SIZE = 650 * 1024;
  const SKIP_SIZE = 670 * 1024;
  const attachments = [];

  for (const file of files) {
    if (file.size <= SKIP_SIZE) {
      attachments.push({
        filename: file.name,
        content: await toBase64(file),
        encoding: "base64",
      });
      continue;
    }

    const img = await loadImage(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let width = img.naturalWidth;
    let quality = 0.9;
    let blob;

    for (let attempt = 0; attempt < 10; attempt++) {
      const ratio = width / img.naturalWidth;
      canvas.width = width;
      canvas.height = Math.round(img.naturalHeight * ratio);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
      if (blob.size <= MAX_SIZE) break;
      width = Math.round(width * 0.8);
    }

    if (blob.size > MAX_SIZE) {
      quality = 0.7;
      const ratio = width / img.naturalWidth;
      canvas.width = width;
      canvas.height = Math.round(img.naturalHeight * ratio);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
    }

    const dot = file.name.lastIndexOf(".");
    const basename = dot > -1 ? file.name.slice(0, dot) : file.name;
    attachments.push({
      filename: basename + "_red.jpg",
      content: await blobToBase64(blob),
      encoding: "base64",
    });
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
