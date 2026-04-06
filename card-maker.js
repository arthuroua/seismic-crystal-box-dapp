(function () {
  const cfg = window.SEISMIC_DAPP_CONFIG || {};
  const SITE_URL = cfg.siteUrl || window.location.origin;
  const TEMPLATE_SRC = "./assets/seismic-card-template.png";

  const MAG_COLORS = {
    1: "#E8D27A",
    2: "#69C7AE",
    3: "#37D66D",
    4: "#A8E76D",
    5: "#A6B400",
    6: "#E7C21F",
    7: "#FF7A00",
    8: "#FF1B17",
    9: "#19C9F3"
  };

  const el = {
    nickInput: document.getElementById("nickInput"),
    countryInput: document.getElementById("countryInput"),
    messagesInput: document.getElementById("messagesInput"),
    magnitudeInput: document.getElementById("magnitudeInput"),
    photoInput: document.getElementById("photoInput"),
    renderBtn: document.getElementById("renderBtn"),
    downloadBtn: document.getElementById("downloadBtn"),
    shareBtn: document.getElementById("shareBtn"),
    hintText: document.getElementById("hintText"),
    cardCanvas: document.getElementById("cardCanvas")
  };

  const ctx = el.cardCanvas.getContext("2d");
  let templateImage = null;
  let uploadImage = null;

  init().catch((e) => {
    console.error(e);
    el.hintText.textContent = "Failed to initialize builder.";
  });

  async function init() {
    templateImage = await loadImage(TEMPLATE_SRC);
    el.cardCanvas.width = templateImage.width;
    el.cardCanvas.height = templateImage.height;

    el.renderBtn.addEventListener("click", renderCard);
    el.downloadBtn.addEventListener("click", downloadCard);
    el.shareBtn.addEventListener("click", shareToX);
    el.photoInput.addEventListener("change", onPhotoPick);

    renderCard();
  }

  async function onPhotoPick(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      uploadImage = null;
      renderCard();
      return;
    }
    uploadImage = await loadImage(URL.createObjectURL(file));
    renderCard();
  }

  function getData() {
    const nick = (el.nickInput.value || "arthuro").trim().slice(0, 22);
    const country = (el.countryInput.value || "Ukraine").trim().slice(0, 24);
    const messages = Number(el.messagesInput.value || 0);
    const magnitude = Number(el.magnitudeInput.value || 8);
    return {
      nick,
      country,
      messages: Number.isFinite(messages) && messages >= 0 ? Math.floor(messages) : 0,
      magnitude: Math.min(9, Math.max(1, magnitude))
    };
  }

  function renderCard() {
    const data = getData();
    const w = el.cardCanvas.width;
    const h = el.cardCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(templateImage, 0, 0, w, h);

    drawOverlayText(data);
    drawCrystal(data.magnitude);
    drawUploadBadge();
  }

  function drawOverlayText(data) {
    const textColor = "#E6D0BC";
    const strokeColor = "rgba(42,22,14,0.72)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    drawField(data.nick, 560, 391, 350, textColor, strokeColor);
    drawField(data.country, 560, 476, 350, textColor, strokeColor);
    drawField(String(data.messages), 560, 560, 350, textColor, strokeColor);

    ctx.font = "700 56px 'Bebas Neue', sans-serif";
    ctx.lineWidth = 8;
    ctx.strokeStyle = strokeColor;
    const magText = `${data.magnitude}.0`;
    ctx.strokeText(magText, 885, 667);
    ctx.fillStyle = "#F3D8A8";
    ctx.fillText(magText, 885, 667);
  }

  function drawField(text, x, y, maxWidth, color, strokeColor) {
    const safe = String(text || "-");
    ctx.font = "700 52px 'Space Grotesk', sans-serif";
    ctx.lineWidth = 8;
    ctx.strokeStyle = strokeColor;
    ctx.strokeText(safe, x, y, maxWidth);
    ctx.fillStyle = color;
    ctx.fillText(safe, x, y, maxWidth);
  }

  function drawCrystal(magnitude) {
    const x = 1178;
    const y = 555;
    const size = 128;
    const color = MAG_COLORS[magnitude] || MAG_COLORS[8];

    ctx.save();
    ctx.translate(x, y);

    const grd = ctx.createLinearGradient(-size, -size, size, size);
    grd.addColorStop(0, shade(color, 1.35));
    grd.addColorStop(0.45, color);
    grd.addColorStop(1, shade(color, 0.55));

    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.68, -size * 0.26);
    ctx.lineTo(size * 0.5, size * 0.75);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.5, size * 0.75);
    ctx.lineTo(-size * 0.68, -size * 0.26);
    ctx.closePath();
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = shade(color, 0.35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -size * 0.84);
    ctx.lineTo(size * 0.22, -size * 0.2);
    ctx.lineTo(0, size * 0.88);
    ctx.lineTo(-size * 0.22, -size * 0.2);
    ctx.closePath();
    ctx.strokeStyle = shade(color, 1.65);
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.beginPath();
    ctx.arc(-size * 0.2, -size * 0.38, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2B1B0D";
    ctx.font = "700 52px 'Bebas Neue', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(magnitude), 0, -8);

    ctx.restore();
  }

  function drawUploadBadge() {
    if (!uploadImage) return;
    const x = 1020;
    const y = 270;
    const s = 120;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, s / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(uploadImage, x - s / 2, y - s / 2, s, s);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, s / 2 + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 224, 180, 0.92)";
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  function downloadCard() {
    renderCard();
    const a = document.createElement("a");
    a.href = el.cardCanvas.toDataURL("image/png");
    a.download = `seismic-card-${Date.now()}.png`;
    a.click();
  }

  function shareToX() {
    renderCard();
    const d = getData();
    const text =
      `My Seismic card: ${d.nick} | ${d.country} | ${d.messages} Discord messages | Magnitude ${d.magnitude}.0. ` +
      `Build yours on Seismic Testnet.`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SITE_URL)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
    el.hintText.textContent = "Twitter/X opened. Attach downloaded image to your post.";
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function shade(hex, factor) {
    const c = hex.replace("#", "");
    const r = Math.min(255, Math.max(0, Math.round(parseInt(c.slice(0, 2), 16) * factor)));
    const g = Math.min(255, Math.max(0, Math.round(parseInt(c.slice(2, 4), 16) * factor)));
    const b = Math.min(255, Math.max(0, Math.round(parseInt(c.slice(4, 6), 16) * factor)));
    return `rgb(${r}, ${g}, ${b})`;
  }
})();
