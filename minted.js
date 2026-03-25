(function () {
  const cfg = window.SEISMIC_DAPP_CONFIG || {};
  const q = new URLSearchParams(window.location.search);

  const tokenId = q.get("tokenId") || "-";
  const robotModel = q.get("robotModel") || "-";
  const sourceCrystal = q.get("sourceCrystal") || "-";
  const magnitude = q.get("magnitude") || "-";
  const txHash = q.get("txHash") || "";
  const imageParam = q.get("image") || "";
  const nftImage = imageParam || (cfg.assetImages && cfg.assetImages.nftRobot) || "./assets/seismic-robot.png";
  const siteUrl = cfg.siteUrl || `${window.location.origin}/`;
  const txUrl = txHash && cfg.explorerBase ? `${cfg.explorerBase.replace(/\/$/, "")}/tx/${txHash}` : "";

  const el = {
    nftImage: document.getElementById("nftImage"),
    tokenIdText: document.getElementById("tokenIdText"),
    robotText: document.getElementById("robotText"),
    sourceText: document.getElementById("sourceText"),
    magnitudeText: document.getElementById("magnitudeText"),
    txText: document.getElementById("txText"),
    sharePreview: document.getElementById("sharePreview"),
    shareXBtn: document.getElementById("shareXBtn"),
    downloadBtn: document.getElementById("downloadBtn"),
    shareHint: document.getElementById("shareHint")
  };

  let shareBlob = null;

  init().catch((err) => {
    console.error(err);
  });

  async function init() {
    el.nftImage.src = nftImage;
    el.tokenIdText.textContent = `Token: #${tokenId}`;
    el.robotText.textContent = `Robot: #${robotModel}`;
    el.sourceText.textContent = `Source crystal: ${sourceCrystal}`;
    el.magnitudeText.textContent = `Magnitude: ${magnitude}`;
    el.txText.textContent = txUrl ? `Tx: ${shortHash(txHash)}` : "Tx: -";

    shareBlob = await createShareImage();
    el.sharePreview.src = URL.createObjectURL(shareBlob);

    el.shareXBtn.addEventListener("click", shareToX);
    el.downloadBtn.addEventListener("click", downloadShareImage);
  }

  function tweetText() {
    return `I just minted Seismic Robot NFT #${tokenId} on Seismic Testnet. Crystal: ${sourceCrystal}, Magnitude: ${magnitude}. Open your Crystal Box and mint yours.`;
  }

  async function shareToX() {
    const text = tweetText();
    const shareFile = new File([shareBlob], `seismic-robot-${tokenId}.png`, { type: "image/png" });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [shareFile] })) {
      try {
        await navigator.share({
          files: [shareFile],
          title: `Seismic Robot #${tokenId}`,
          text: `${text} ${siteUrl}`,
          url: siteUrl
        });
        return;
      } catch {
        // fallback to intent
      }
    }

    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(siteUrl)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
    el.shareHint.textContent = "If X didn't attach image automatically, use Download Image and add it manually.";
  }

  function downloadShareImage() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(shareBlob);
    a.download = `seismic-robot-${tokenId}.png`;
    a.click();
  }

  async function createShareImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "#0b0a18");
    bg.addColorStop(0.45, "#2d1340");
    bg.addColorStop(1, "#5f1f34");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = await loadImage(nftImage);
    const imgW = 340;
    const imgH = 460;
    const imgX = 70;
    const imgY = 84;
    roundRect(ctx, imgX - 8, imgY - 8, imgW + 16, imgH + 16, 20);
    ctx.fillStyle = "rgba(255, 116, 214, 0.32)";
    ctx.fill();
    ctx.drawImage(img, imgX, imgY, imgW, imgH);

    ctx.fillStyle = "#ffe7f9";
    ctx.font = "66px Bebas Neue";
    ctx.fillText("SEISMIC ROBOT NFT", 460, 128);
    ctx.font = "44px Space Grotesk";
    ctx.fillText(`#${tokenId}`, 460, 184);

    ctx.fillStyle = "#f4d8ff";
    ctx.font = "32px Space Grotesk";
    ctx.fillText(`Robot: #${robotModel}`, 460, 252);
    ctx.fillText(`Crystal: ${sourceCrystal}`, 460, 300);
    ctx.fillText(`Magnitude: ${magnitude}`, 460, 348);

    ctx.fillStyle = "#ffd28f";
    ctx.font = "28px Space Grotesk";
    ctx.fillText("Minted on Seismic Testnet", 460, 416);
    ctx.fillText(siteUrl, 460, 464);

    return await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
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

  function shortHash(hash) {
    if (!hash || hash.length < 12) return hash || "-";
    return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
})();
