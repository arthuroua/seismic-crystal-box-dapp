(function () {
  const cfg = window.SEISMIC_DAPP_CONFIG || {};
  const SITE_URL = cfg.siteUrl || window.location.origin;
  const TEMPLATE_SRC = "./assets/seismic-card-template.png";
  const CRYSTAL_9_SRC = "./assets/magnitude-9-ref.jpg";
  const CRYSTAL_POS_X = 1128;
  const CRYSTAL_POS_Y = 640;
  const CRYSTAL_BASE_SIZE = 125;

  const MAG_COLORS = {
    1: "#E8D27A",
    2: "#62C6A8",
    3: "#38D760",
    4: "#9BEA53",
    5: "#A8B600",
    6: "#E6C218",
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
  let crystal9Image = null;
  let uploadImage = null;

  init().catch((e) => {
    console.error(e);
    el.hintText.textContent = "Failed to initialize builder.";
  });

  async function init() {
    templateImage = await loadImage(TEMPLATE_SRC);
    try {
      crystal9Image = await loadImage(CRYSTAL_9_SRC);
    } catch {
      crystal9Image = null;
    }
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

    // Align text to the center of dark torso slots.
    drawField(data.nick, 710, 430, 250, textColor, strokeColor);
    drawField(data.country, 710, 515, 250, textColor, strokeColor);
    drawField(String(data.messages), 710, 600, 250, textColor, strokeColor);

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
    let size = 50;
    ctx.font = `700 ${size}px 'Space Grotesk', sans-serif`;
    while (ctx.measureText(safe).width > maxWidth && size > 32) {
      size -= 2;
      ctx.font = `700 ${size}px 'Space Grotesk', sans-serif`;
    }
    ctx.textAlign = "center";
    ctx.lineWidth = 6;
    ctx.strokeStyle = strokeColor;
    ctx.strokeText(safe, x, y, maxWidth);
    ctx.fillStyle = color;
    ctx.fillText(safe, x, y, maxWidth);
    ctx.textAlign = "left";
  }

  function drawCrystal(magnitude) {
    if (crystal9Image) {
      drawCrystalFromRef(magnitude);
      return;
    }
    drawCrystalVector(magnitude);
  }

  function drawCrystalFromRef(magnitude) {
    const x = CRYSTAL_POS_X;
    const y = CRYSTAL_POS_Y;
    const size = CRYSTAL_BASE_SIZE * getMagnitudeScale(magnitude);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.08);

    ctx.beginPath();
    ctx.ellipse(0, size * 1.02, size * 0.66, size * 0.16, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fill();

    const badgePath = createBadgePath(size);
    const dx = -size * 0.66;
    const dy = -size * 1.06;
    const dw = size * 1.32;
    const dh = size * 2.12;

    ctx.save();
    ctx.clip(badgePath);
    ctx.drawImage(crystal9Image, 0, 0, crystal9Image.width, crystal9Image.height, dx, dy, dw, dh);
    if (magnitude !== 9) {
      tintCrystal(dx, dy, dw, dh, MAG_COLORS[magnitude] || "#56ccff");
    }
    ctx.restore();

    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(24,16,12,0.62)";
    ctx.stroke(badgePath);

    drawCrystalNumber(magnitude, size);

    ctx.restore();
  }

  function drawCrystalVector(magnitude) {
    const x = CRYSTAL_POS_X;
    const y = CRYSTAL_POS_Y;
    const size = CRYSTAL_BASE_SIZE * getMagnitudeScale(magnitude);
    const color = MAG_COLORS[magnitude] || MAG_COLORS[8];

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.02);

    // Shadow
    ctx.beginPath();
    ctx.ellipse(0, size * 0.98, size * 0.66, size * 0.16, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fill();

    // Main body (badge-like crystal, close to reference style)
    const body = createBadgePath(size);

    const bodyGrad = ctx.createLinearGradient(-size * 0.7, -size * 0.6, size * 0.6, size * 0.9);
    bodyGrad.addColorStop(0, shade(color, 1.3));
    bodyGrad.addColorStop(0.48, color);
    bodyGrad.addColorStop(1, shade(color, 0.58));
    ctx.fillStyle = bodyGrad;
    ctx.fill(body);
    ctx.lineWidth = 8;
    ctx.strokeStyle = shade(color, 0.35);
    ctx.stroke(body);

    // Side facets
    const leftFacet = new Path2D();
    leftFacet.moveTo(-size * 0.53, -size * 0.08);
    leftFacet.lineTo(-size * 0.37, -size * 0.5);
    leftFacet.lineTo(-size * 0.23, -size * 0.46);
    leftFacet.lineTo(-size * 0.34, size * 0.58);
    leftFacet.lineTo(-size * 0.5, size * 0.44);
    leftFacet.closePath();
    ctx.fillStyle = shade(color, 0.72);
    ctx.fill(leftFacet);

    const rightFacet = new Path2D();
    rightFacet.moveTo(size * 0.2, -size * 0.54);
    rightFacet.lineTo(size * 0.44, -size * 0.24);
    rightFacet.lineTo(size * 0.34, size * 0.53);
    rightFacet.lineTo(size * 0.14, size * 0.69);
    rightFacet.lineTo(size * 0.01, -size * 0.36);
    rightFacet.closePath();
    ctx.fillStyle = shade(color, 0.66);
    ctx.fill(rightFacet);

    // Top plate for magnitude number
    const cap = new Path2D();
    cap.moveTo(-size * 0.02, -size * 0.98);
    cap.lineTo(size * 0.26, -size * 0.88);
    cap.lineTo(size * 0.4, -size * 0.65);
    cap.lineTo(size * 0.22, -size * 0.43);
    cap.lineTo(-size * 0.07, -size * 0.44);
    cap.lineTo(-size * 0.19, -size * 0.69);
    cap.closePath();
    const capGrad = ctx.createLinearGradient(-size * 0.2, -size, size * 0.4, -size * 0.35);
    capGrad.addColorStop(0, shade(color, 1.22));
    capGrad.addColorStop(1, shade(color, 0.82));
    ctx.fillStyle = capGrad;
    ctx.fill(cap);
    ctx.lineWidth = 6;
    ctx.strokeStyle = shade(color, 0.38);
    ctx.stroke(cap);

    // Engraved seismic symbol
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = shade(color, 1.5);
    ctx.lineWidth = 8.5;
    drawSeismicGlyph(size);

    ctx.strokeStyle = shade(color, 0.92);
    ctx.lineWidth = 3;
    drawSeismicGlyph(size);

    // Specular highlight
    ctx.beginPath();
    ctx.arc(-size * 0.16, -size * 0.42, 10, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fill();

    // Magnitude number on top plate
    ctx.fillStyle = "rgba(35, 20, 14, 0.78)";
    ctx.font = "700 56px 'Bebas Neue', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(magnitude), size * 0.1, -size * 0.66);

    ctx.restore();
  }

  function tintCrystal(x, y, w, h, color) {
    ctx.save();
    ctx.globalCompositeOperation = "color";
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  function drawCrystalNumber(magnitude, size) {
    const cx = size * 0.1;
    const cy = -size * 0.66;
    const r = size * 0.26;
    const color = MAG_COLORS[magnitude] || "#58c7ff";

    ctx.beginPath();
    polygonPath(cx, cy, r, 6, -Math.PI / 2);
    ctx.fillStyle = shade(color, 1.18);
    ctx.fill();
    ctx.lineWidth = Math.max(2, size * 0.06);
    ctx.strokeStyle = "rgba(20, 34, 50, 0.62)";
    ctx.stroke();

    ctx.fillStyle = "rgba(24, 34, 48, 0.82)";
    ctx.font = `700 ${Math.max(20, size * 0.36)}px 'Bebas Neue', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(magnitude), cx, cy + size * 0.01);
  }

  function polygonPath(cx, cy, radius, sides, rotation) {
    for (let i = 0; i < sides; i += 1) {
      const a = rotation + (i * Math.PI * 2) / sides;
      const px = cx + Math.cos(a) * radius;
      const py = cy + Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function getMagnitudeScale(magnitude) {
    const m = Math.min(9, Math.max(1, Number(magnitude) || 1));
    return 0.5 + ((m - 1) / 8) * 0.5;
  }

  function createBadgePath(size) {
    const body = new Path2D();
    body.moveTo(-size * 0.3, -size * 0.6);
    body.lineTo(size * 0.18, -size * 0.62);
    body.lineTo(size * 0.56, -size * 0.22);
    body.lineTo(size * 0.44, size * 0.58);
    body.lineTo(-size * 0.06, size * 0.9);
    body.lineTo(-size * 0.5, size * 0.62);
    body.lineTo(-size * 0.62, -size * 0.12);
    body.closePath();
    return body;
  }

  function drawSeismicGlyph(size) {
    ctx.beginPath();
    ctx.arc(-size * 0.18, -size * 0.03, size * 0.16, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-size * 0.06, -size * 0.03, size * 0.2, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(size * 0.08, -size * 0.03, size * 0.2, Math.PI / 2, (Math.PI * 3) / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(size * 0.2, -size * 0.03, size * 0.16, Math.PI / 2, (Math.PI * 3) / 2);
    ctx.stroke();
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
