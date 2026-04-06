(function () {
  const cfg = window.SEISMIC_DAPP_CONFIG || {};
  const SITE_URL = cfg.siteUrl || window.location.origin;
  const CHAIN_ID_HEX = cfg.chainIdHex || "0x1404";
  const CHAIN_ID_DEC = Number(cfg.chainIdDecimal || 5124);
  const TEMPLATE_SRC = "./assets/seismic-card-template.png";
  const CRYSTAL_9_SRC = "./assets/magnitude-9-ref.jpg";
  const CRYSTAL_POS_X = 1010;
  const CRYSTAL_POS_Y = 686;
  const CRYSTAL_BASE_SIZE = 125;
  const CARD_MINTER_ABI = [
    "function mintCard(string metadataURI) returns (uint256 tokenId)",
    "function nextTokenId() view returns (uint256)"
  ];

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
    renderBtn: document.getElementById("renderBtn"),
    downloadBtn: document.getElementById("downloadBtn"),
    shareBtn: document.getElementById("shareBtn"),
    mintBtn: document.getElementById("mintBtn"),
    hintText: document.getElementById("hintText"),
    cardCanvas: document.getElementById("cardCanvas")
  };

  const ctx = el.cardCanvas.getContext("2d");
  let templateImage = null;
  let crystal9Image = null;
  let crystalCutoutImage = null;

  init().catch((e) => {
    console.error(e);
    el.hintText.textContent = "Failed to initialize builder.";
  });

  async function init() {
    templateImage = await loadImage(TEMPLATE_SRC);
    try {
      crystal9Image = await loadImage(CRYSTAL_9_SRC);
      crystalCutoutImage = buildCrystalCutout(crystal9Image);
    } catch {
      crystal9Image = null;
      crystalCutoutImage = null;
    }
    el.cardCanvas.width = templateImage.width;
    el.cardCanvas.height = templateImage.height;

    el.renderBtn.addEventListener("click", renderCard);
    el.downloadBtn.addEventListener("click", downloadCard);
    el.shareBtn.addEventListener("click", shareToX);
    el.mintBtn?.addEventListener("click", mintCardNft);

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

    drawMagnitudeEyes(data.magnitude);
    drawOverlayText(data);
    drawCrystal(data.magnitude);
  }

  function drawMagnitudeEyes(magnitude) {
    const color = MAG_COLORS[magnitude] || "#FF66FF";
    const eyes = [
      { x: 713, y: 154, r: 22 },
      { x: 839, y: 165, r: 20 }
    ];

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (const eye of eyes) {
      // Outer aura.
      const aura = ctx.createRadialGradient(eye.x, eye.y, eye.r * 0.2, eye.x, eye.y, eye.r * 2.4);
      aura.addColorStop(0, "rgba(255,255,255,0.62)");
      aura.addColorStop(0.35, hexToRgba(color, 0.38));
      aura.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, eye.r * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Core eye light.
      const core = ctx.createRadialGradient(eye.x - eye.r * 0.25, eye.y - eye.r * 0.25, 1, eye.x, eye.y, eye.r);
      core.addColorStop(0, "rgba(255,255,255,0.95)");
      core.addColorStop(0.45, hexToRgba(color, 0.9));
      core.addColorStop(1, hexToRgba(color, 0.28));
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, eye.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawOverlayText(data) {
    const textColor = "#E6D0BC";
    const strokeColor = "rgba(42,22,14,0.72)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // Align text to the center of dark torso slots.
    drawField(data.nick, 710, 464, 250, textColor, strokeColor);
    drawField(data.country, 710, 563, 250, textColor, strokeColor);
    drawField(String(data.messages), 710, 660, 250, textColor, strokeColor);
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
    if (crystalCutoutImage) {
      drawCrystalFromRef(magnitude);
      return;
    }
    drawCrystalVector(magnitude);
  }

  function drawCrystalFromRef(magnitude) {
    const x = CRYSTAL_POS_X;
    const y = CRYSTAL_POS_Y;
    const size = CRYSTAL_BASE_SIZE * getMagnitudeScale(magnitude);
    const targetH = size * 2.18;
    const targetW = targetH * (crystalCutoutImage.width / crystalCutoutImage.height);
    const dx = -targetW / 2;
    const dy = -targetH;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.08);

    ctx.beginPath();
    ctx.ellipse(0, size * 1.02, size * 0.66, size * 0.16, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fill();

    // Soft emissive glow around badge.
    const glowColor = MAG_COLORS[magnitude] || "#56ccff";
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.12, size * 0.56, size * 0.82, 0, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.globalAlpha = 0.14;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 26;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    const rendered = renderCrystalLayer(magnitude, targetW, targetH, size);
    ctx.save();
    clipCrystalBadge(ctx, dx, dy, targetW, targetH);
    ctx.drawImage(rendered, dx, dy, targetW, targetH);
    ctx.restore();

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

  function renderCrystalLayer(magnitude, targetW, targetH, size) {
    const w = Math.max(1, Math.round(targetW));
    const h = Math.max(1, Math.round(targetH));
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const octx = off.getContext("2d");

    octx.drawImage(crystalCutoutImage, 0, 0, crystalCutoutImage.width, crystalCutoutImage.height, 0, 0, w, h);
    removeNeutralBackground(octx, w, h);
    stripEdgeNeutralBackground(octx, w, h);

    if (magnitude !== 9) {
      tintCrystalOnLayer(octx, magnitude, w, h);
    }
    drawCrystalTopNumber(octx, magnitude, w, h);
    return off;
  }

  function tintCrystalOnLayer(octx, magnitude, w, h) {
    const color = MAG_COLORS[magnitude] || "#56ccff";
    octx.save();
    octx.globalCompositeOperation = "source-atop";
    octx.globalAlpha = 0.74;
    octx.fillStyle = color;
    octx.fillRect(0, 0, w, h);
    octx.globalCompositeOperation = "multiply";
    octx.globalAlpha = 0.12;
    octx.fillStyle = color;
    octx.fillRect(0, 0, w, h);
    octx.restore();
  }

  function drawCrystalTopNumber(octx, magnitude, w, h) {
    const cx = w * 0.5;
    const cy = h * 0.108;
    const r = h * 0.126;
    const color = MAG_COLORS[magnitude] || "#58c7ff";

    // Repaint full top cap area to hide original baked "9" from the source image.
    octx.beginPath();
    polygonPathCtx(octx, cx, cy, r, 6, -Math.PI / 2);
    octx.fillStyle = shade(color, 1.08);
    octx.fill();
    octx.lineWidth = Math.max(3, h * 0.04);
    octx.strokeStyle = "rgba(20, 34, 50, 0.72)";
    octx.stroke();

    octx.fillStyle = "rgba(12, 22, 36, 0.92)";
    octx.font = `700 ${Math.max(18, h * 0.145)}px 'Bebas Neue', sans-serif`;
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillText(String(magnitude), cx, cy + h * 0.008);
  }

  function clipCrystalBadge(targetCtx, x, y, w, h) {
    targetCtx.beginPath();
    targetCtx.moveTo(x + w * 0.5, y + h * 0.01);
    targetCtx.lineTo(x + w * 0.72, y + h * 0.11);
    targetCtx.lineTo(x + w * 0.89, y + h * 0.36);
    targetCtx.lineTo(x + w * 0.84, y + h * 0.72);
    targetCtx.lineTo(x + w * 0.57, y + h * 0.995);
    targetCtx.lineTo(x + w * 0.43, y + h * 0.995);
    targetCtx.lineTo(x + w * 0.16, y + h * 0.72);
    targetCtx.lineTo(x + w * 0.11, y + h * 0.36);
    targetCtx.lineTo(x + w * 0.28, y + h * 0.11);
    targetCtx.closePath();
    targetCtx.clip();
  }

  function removeNeutralBackground(octx, w, h) {
    const img = octx.getImageData(0, 0, w, h);
    const px = img.data;
    for (let i = 0; i < px.length; i += 4) {
      const a = px[i + 3];
      if (!a) continue;
      const r = px[i] / 255;
      const g = px[i + 1] / 255;
      const b = px[i + 2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const lum = (max + min) * 0.5;

      // Remove light/neutral background tones while keeping saturated crystal pixels.
      if ((sat < 0.24 && lum > 0.30) || (sat < 0.12 && lum > 0.2)) {
        px[i + 3] = 0;
      }
    }
    octx.putImageData(img, 0, 0);
  }

  function stripEdgeNeutralBackground(octx, w, h) {
    const img = octx.getImageData(0, 0, w, h);
    const px = img.data;
    const q = new Int32Array(w * h);
    const seen = new Uint8Array(w * h);
    let head = 0;
    let tail = 0;

    function isNeutral(idx) {
      const p = idx * 4;
      const a = px[p + 3];
      if (!a) return false;
      const r = px[p] / 255;
      const g = px[p + 1] / 255;
      const b = px[p + 2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const lum = (max + min) * 0.5;
      return sat < 0.33 && lum > 0.14;
    }

    function push(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const idx = y * w + x;
      if (seen[idx]) return;
      if (!isNeutral(idx)) return;
      seen[idx] = 1;
      q[tail++] = idx;
    }

    for (let x = 0; x < w; x += 1) {
      push(x, 0);
      push(x, h - 1);
    }
    for (let y = 0; y < h; y += 1) {
      push(0, y);
      push(w - 1, y);
    }

    while (head < tail) {
      const idx = q[head++];
      const p = idx * 4;
      px[p + 3] = 0;
      const x = idx % w;
      const y = (idx / w) | 0;
      push(x - 1, y);
      push(x + 1, y);
      push(x, y - 1);
      push(x, y + 1);
    }

    octx.putImageData(img, 0, 0);
  }

  function polygonPath(cx, cy, radius, sides, rotation) {
    polygonPathCtx(ctx, cx, cy, radius, sides, rotation);
  }

  function polygonPathCtx(targetCtx, cx, cy, radius, sides, rotation) {
    for (let i = 0; i < sides; i += 1) {
      const a = rotation + (i * Math.PI * 2) / sides;
      const px = cx + Math.cos(a) * radius;
      const py = cy + Math.sin(a) * radius;
      if (i === 0) targetCtx.moveTo(px, py);
      else targetCtx.lineTo(px, py);
    }
    targetCtx.closePath();
  }

  function getMagnitudeScale(magnitude) {
    const m = Math.min(9, Math.max(1, Number(magnitude) || 1));
    return 0.68 + ((m - 1) / 8) * 0.32;
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

  async function mintCardNft() {
    try {
      if (!cfg.cardMinterAddress) {
        el.hintText.textContent = "Set cardMinterAddress in config.js to enable mint.";
        return;
      }
      if (!window.ethereum || !window.ethers) {
        el.hintText.textContent = "Wallet or ethers.js not found in browser.";
        return;
      }

      el.mintBtn.disabled = true;
      el.hintText.textContent = "Preparing card image...";

      renderCard();
      const cardPng = el.cardCanvas.toDataURL("image/png");
      const data = getData();

      el.hintText.textContent = "Uploading card metadata...";
      const uploadRes = await fetch("/api/card-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: cardPng,
          nick: data.nick,
          country: data.country,
          messages: data.messages,
          magnitude: data.magnitude
        })
      });
      if (!uploadRes.ok) {
        const errBody = await uploadRes.text();
        throw new Error(errBody || "Card upload failed");
      }
      const uploadJson = await uploadRes.json();
      const metadataUri = uploadJson.metadataUri;
      if (!metadataUri) {
        throw new Error("Upload completed without metadata URI");
      }

      const provider = new window.ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID_DEC) {
        await switchToSeismicNetwork();
      }

      const signer = await provider.getSigner();
      const contract = new window.ethers.Contract(cfg.cardMinterAddress, CARD_MINTER_ABI, signer);
      el.hintText.textContent = "Sending mint transaction...";

      const tx = await contract.mintCard(metadataUri);
      const txUrl = `${(cfg.explorerBase || "").replace(/\/$/, "")}/tx/${tx.hash}`;
      el.hintText.textContent = `Mint tx sent: ${tx.hash.slice(0, 10)}...`;

      await tx.wait();
      let tokenIdText = "";
      try {
        const nextId = await contract.nextTokenId();
        tokenIdText = ` Token #${nextId.toString()}.`;
      } catch {
        tokenIdText = "";
      }

      el.hintText.textContent = `Card minted on Seismic.${tokenIdText} ${txUrl}`;
    } catch (err) {
      console.error(err);
      const msg = err?.shortMessage || err?.message || "Mint failed.";
      el.hintText.textContent = msg;
    } finally {
      if (el.mintBtn) el.mintBtn.disabled = false;
    }
  }

  async function switchToSeismicNetwork() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID_HEX }]
      });
    } catch {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_ID_HEX,
            chainName: cfg.chainName || "Seismic Testnet",
            nativeCurrency: cfg.nativeCurrency || { name: "Seismic", symbol: "SEIS", decimals: 18 },
            rpcUrls: [cfg.rpcHttp || "https://gcp-2.seismictest.net/rpc"],
            blockExplorerUrls: [cfg.explorerBase || "https://seismic-testnet.socialscan.io"]
          }
        ]
      });
    }
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

  function buildCrystalCutout(image) {
    const off = document.createElement("canvas");
    off.width = image.width;
    off.height = image.height;
    const octx = off.getContext("2d");
    octx.drawImage(image, 0, 0);

    const imgData = octx.getImageData(0, 0, off.width, off.height);
    const px = imgData.data;
    const w = off.width;
    const h = off.height;
    const bg = getBackgroundFromCorners(px, w, h);
    const thr = 120;
    const q = new Int32Array(w * h);
    const seen = new Uint8Array(w * h);
    let head = 0;
    let tail = 0;

    function tryPush(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = y * w + x;
      if (seen[i]) return;
      const p = i * 4;
      const dr = Math.abs(px[p] - bg.r);
      const dg = Math.abs(px[p + 1] - bg.g);
      const db = Math.abs(px[p + 2] - bg.b);
      if (dr + dg + db <= thr) {
        seen[i] = 1;
        q[tail++] = i;
      }
    }

    for (let x = 0; x < w; x += 1) {
      tryPush(x, 0);
      tryPush(x, h - 1);
    }
    for (let y = 0; y < h; y += 1) {
      tryPush(0, y);
      tryPush(w - 1, y);
    }

    while (head < tail) {
      const i = q[head++];
      const p = i * 4;
      px[p + 3] = 0;
      const x = i % w;
      const y = (i / w) | 0;
      tryPush(x - 1, y);
      tryPush(x + 1, y);
      tryPush(x, y - 1);
      tryPush(x, y + 1);
    }

    // Remove low-alpha JPEG halo so tinted rectangle behind badge is not visible.
    for (let i = 0; i < px.length; i += 4) {
      const a = px[i + 3];
      if (a < 224) {
        px[i + 3] = 0;
      } else {
        px[i + 3] = 255;
      }
    }

    octx.putImageData(imgData, 0, 0);

    const bounds = getOpaqueBounds(px, w, h);
    if (!bounds) return off;

    const out = document.createElement("canvas");
    out.width = bounds.w;
    out.height = bounds.h;
    const outCtx = out.getContext("2d");
    outCtx.drawImage(off, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h);
    return out;
  }

  function getBackgroundFromCorners(px, w, h) {
    const samples = [
      0,
      (w - 1) * 4,
      (w * (h - 1)) * 4,
      (w * h - 1) * 4
    ];
    let r = 0;
    let g = 0;
    let b = 0;
    for (const s of samples) {
      r += px[s];
      g += px[s + 1];
      b += px[s + 2];
    }
    return {
      r: r / samples.length,
      g: g / samples.length,
      b: b / samples.length
    };
  }

  function getOpaqueBounds(px, w, h) {
    let minX = w;
    let minY = h;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const a = px[(y * w + x) * 4 + 3];
        if (a > 12) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) return null;
    return {
      x: minX,
      y: minY,
      w: maxX - minX + 1,
      h: maxY - minY + 1
    };
  }

  function shade(hex, factor) {
    const c = hex.replace("#", "");
    const r = Math.min(255, Math.max(0, Math.round(parseInt(c.slice(0, 2), 16) * factor)));
    const g = Math.min(255, Math.max(0, Math.round(parseInt(c.slice(2, 4), 16) * factor)));
    const b = Math.min(255, Math.max(0, Math.round(parseInt(c.slice(4, 6), 16) * factor)));
    return `rgb(${r}, ${g}, ${b})`;
  }

  function hexToRgba(hex, alpha) {
    const c = hex.replace("#", "");
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
})();
