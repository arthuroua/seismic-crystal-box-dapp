import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.15.0/+esm";

const cfg = window.SEISMIC_DAPP_CONFIG || {};
const images = cfg.assetImages || {};
const videos = cfg.assetVideos || {};

const CONTRACT_ABI = [
  "function checkInFeeWei() view returns (uint256)",
  "function CHECKIN_COOLDOWN() view returns (uint64)",
  "function getUserStatus(address user) view returns (uint32 boxes, uint64 lastCheckIn, uint64 nextCheckIn, bool canCheckIn)",
  "function getCrystalBalances(address user) view returns (uint32 rare, uint32 epic, uint32 legendary)",
  "function checkIn() payable",
  "function openBox() returns (uint8 crystalRarity)",
  "function mintRobotWithRare() returns (uint256)",
  "function mintRobotWithEpic() returns (uint256)",
  "function mintRobotWithLegendary() returns (uint256)",
  "function robotMeta(uint256 tokenId) view returns (uint8 robotModel, uint8 sourceCrystal, uint8 magnitude, uint64 mintedAt)",
  "function nextTokenId() view returns (uint256)",
  "event BoxOpened(address indexed user, uint8 crystalRarity, uint32 rareBalance, uint32 epicBalance, uint32 legendaryBalance)",
  "event RobotMinted(address indexed user, uint256 indexed tokenId, uint8 robotModel, uint8 sourceCrystal, uint8 magnitude)"
];

const CRYSTAL = {
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 3
};

const el = {
  connectBtn: document.getElementById("connectBtn"),
  addNetworkBtn: document.getElementById("addNetworkBtn"),
  walletState: document.getElementById("walletState"),
  walletBalanceText: document.getElementById("walletBalanceText"),
  contractState: document.getElementById("contractState"),

  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  nextCheckInText: document.getElementById("nextCheckInText"),
  feeText: document.getElementById("feeText"),
  boxBalanceText: document.getElementById("boxBalanceText"),
  payHintText: document.getElementById("payHintText"),
  checkInBtn: document.getElementById("checkInBtn"),

  boxImage: document.getElementById("boxImage"),
  crystalPreview: document.getElementById("crystalPreview"),
  lastCrystalType: document.getElementById("lastCrystalType"),
  rareCount: document.getElementById("rareCount"),
  epicCount: document.getElementById("epicCount"),
  legendaryCount: document.getElementById("legendaryCount"),
  openBoxBtn: document.getElementById("openBoxBtn"),
  openState: document.getElementById("openState"),

  mintRareBtn: document.getElementById("mintRareBtn"),
  mintEpicBtn: document.getElementById("mintEpicBtn"),
  mintLegendBtn: document.getElementById("mintLegendBtn"),
  nftPreview: document.getElementById("nftPreview"),
  mintState: document.getElementById("mintState"),

  latestTokenId: document.getElementById("latestTokenId"),
  latestRobot: document.getElementById("latestRobot"),
  latestSource: document.getElementById("latestSource"),
  latestMagnitude: document.getElementById("latestMagnitude"),

  openAnimModal: document.getElementById("openAnimModal"),
  boxOpenVideo: document.getElementById("boxOpenVideo"),

  explorerLink: document.getElementById("explorerLink"),
  faucetLink: document.getElementById("faucetLink"),
  logBox: document.getElementById("logBox")
};

const state = {
  provider: null,
  signer: null,
  contract: null,
  account: null,
  walletBalanceWei: 0n,
  checkInFeeWei: 0n,
  cooldownSeconds: 86400,
  boxBalance: 0,
  nextCheckInAt: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
  timerId: null
};

init();

function init() {
  el.explorerLink.href = cfg.explorerBase || "#";
  el.faucetLink.href = cfg.faucetUrl || "#";

  setImageSafe(el.boxImage, images.boxImage, "BOX");
  setImageSafe(el.crystalPreview, images.rareCrystal, "RARE");
  setImageSafe(el.nftPreview, images.nftRobot, "SEISMIC ROBOT");

  if (videos.boxOpenVideo) {
    el.boxOpenVideo.src = videos.boxOpenVideo;
  }

  bindEvents();
  startTimer();
  updateUi();

  log("Готово. Підключи wallet і відкривай бокси.");
}

function bindEvents() {
  el.connectBtn.addEventListener("click", connectWallet);
  el.addNetworkBtn.addEventListener("click", addSeismicNetwork);
  el.checkInBtn.addEventListener("click", handleCheckIn);
  el.openBoxBtn.addEventListener("click", handleOpenBox);
  el.mintRareBtn.addEventListener("click", () => handleMint("rare"));
  el.mintEpicBtn.addEventListener("click", () => handleMint("epic"));
  el.mintLegendBtn.addEventListener("click", () => handleMint("legendary"));

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => window.location.reload());
    window.ethereum.on("chainChanged", () => window.location.reload());
  }
}

function startTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
  }

  state.timerId = setInterval(() => {
    renderCountdown();
    updateUi();
  }, 1000);
}

function isContractReady() {
  const addr = cfg.contractAddress || "";
  return ethers.isAddress(addr) && addr !== ethers.ZeroAddress;
}

async function addSeismicNetwork() {
  if (!window.ethereum) {
    log("MetaMask або сумісний wallet не знайдено.", "error");
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: cfg.chainIdHex,
          chainName: cfg.chainName,
          rpcUrls: [cfg.rpcHttp],
          nativeCurrency: cfg.nativeCurrency,
          blockExplorerUrls: [cfg.explorerBase]
        }
      ]
    });

    log("Seismic Testnet додано у wallet.");
  } catch (error) {
    log(`Не вдалося додати мережу: ${formatError(error)}`, "error");
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    log("Немає доступного EVM wallet у браузері.", "error");
    el.walletState.textContent = "Постав MetaMask або інший EVM wallet.";
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    state.provider = new ethers.BrowserProvider(window.ethereum);
    state.signer = await state.provider.getSigner();
    state.account = await state.signer.getAddress();

    const network = await state.provider.getNetwork();
    const chainId = Number(network.chainId);
    if (chainId !== Number(cfg.chainIdDecimal)) {
      el.walletState.textContent = `Wallet: ${shortAddr(state.account)} | Wrong chain: ${chainId}`;
      el.walletBalanceText.textContent = "Balance: wrong network";
      el.contractState.textContent = "Перемкни wallet на Seismic Testnet.";
      updateUi();
      return;
    }

    el.walletState.textContent = `Wallet: ${shortAddr(state.account)} | Seismic OK`;

    if (!isContractReady()) {
      el.contractState.textContent = "Вкажи адресу контракту в config.js";
      await refreshWalletBalance();
      updateUi();
      return;
    }

    state.contract = new ethers.Contract(cfg.contractAddress, CONTRACT_ABI, state.signer);
    el.contractState.textContent = `Contract: ${shortAddr(cfg.contractAddress)}`;

    await refreshAll();
    log("Wallet підключено. Дані контракту оновлено.");
  } catch (error) {
    log(`Помилка підключення: ${formatError(error)}`, "error");
  }

  updateUi();
}

async function refreshAll() {
  await Promise.all([refreshWalletBalance(), refreshOnchainState()]);
  renderCountdown();
  updateUi();
}

async function refreshWalletBalance() {
  if (!state.provider || !state.account) {
    state.walletBalanceWei = 0n;
    el.walletBalanceText.textContent = "Balance: -";
    return;
  }

  try {
    const balance = await state.provider.getBalance(state.account);
    state.walletBalanceWei = balance;
    el.walletBalanceText.textContent = `Balance: ${formatSeis(balance)} SEIS`;
  } catch (error) {
    state.walletBalanceWei = 0n;
    log(`Не вдалося зчитати баланс: ${formatError(error)}`, "warn");
  }
}

async function refreshOnchainState() {
  if (!state.contract || !state.account) {
    return;
  }

  try {
    const [fee, cooldown, status, balances] = await Promise.all([
      state.contract.checkInFeeWei(),
      state.contract.CHECKIN_COOLDOWN(),
      state.contract.getUserStatus(state.account),
      state.contract.getCrystalBalances(state.account)
    ]);

    state.checkInFeeWei = fee;
    state.cooldownSeconds = Number(cooldown);
    state.boxBalance = Number(status[0]);
    state.nextCheckInAt = Number(status[2]);

    state.rare = Number(balances[0]);
    state.epic = Number(balances[1]);
    state.legendary = Number(balances[2]);

    el.feeText.textContent = `Check-in fee: ${formatSeis(state.checkInFeeWei)} SEIS`;
    el.boxBalanceText.textContent = `Boxes: ${state.boxBalance}`;
    el.rareCount.textContent = `Rare: ${state.rare}`;
    el.epicCount.textContent = `Epic: ${state.epic}`;
    el.legendaryCount.textContent = `Legendary: ${state.legendary}`;

    el.openState.textContent = state.boxBalance > 0 ? "Box готовий до відкриття." : "Нема box. Зроби daily check-in.";
  } catch (error) {
    log(`Не вдалося прочитати контракт: ${formatError(error)}`, "error");
  }
}

function getCanCheckInNow() {
  if (!state.nextCheckInAt) return true;
  return Math.floor(Date.now() / 1000) >= state.nextCheckInAt;
}

function renderCountdown() {
  if (!state.account || !state.contract) {
    el.progressText.textContent = "00:00:00";
    el.nextCheckInText.textContent = "Next check-in: -";
    el.progressBar.style.width = "0%";
    return;
  }

  if (getCanCheckInNow()) {
    el.progressText.textContent = "READY";
    el.nextCheckInText.textContent = "Next check-in: доступний зараз";
    el.progressBar.style.width = "100%";
    return;
  }

  const nowTs = Math.floor(Date.now() / 1000);
  const remaining = Math.max(0, state.nextCheckInAt - nowTs);
  el.progressText.textContent = formatHms(remaining);
  el.nextCheckInText.textContent = `Next check-in: ${formatDateTime(state.nextCheckInAt)}`;

  const cooldown = Math.max(1, state.cooldownSeconds);
  const elapsed = Math.max(0, cooldown - remaining);
  el.progressBar.style.width = `${Math.min(100, Math.round((elapsed / cooldown) * 100))}%`;
}

async function handleCheckIn() {
  if (!state.contract) {
    log("Підключи wallet і контракт перед check-in.", "warn");
    return;
  }

  await refreshAll();

  if (!getCanCheckInNow()) {
    log("Check-in доступний раз на 24 години.", "warn");
    return;
  }

  if (state.walletBalanceWei < state.checkInFeeWei) {
    log("Недостатньо SEIS для check-in. Використай Faucet.", "warn");
    return;
  }

  try {
    log(`Підтвердь оплату ${formatSeis(state.checkInFeeWei)} SEIS у wallet.`);
    const tx = await state.contract.checkIn({ value: state.checkInFeeWei });
    log(`Check-in tx відправлено: ${tx.hash}`);

    await tx.wait();
    logWithExplorer("Check-in підтверджено", tx.hash);
    await refreshAll();
  } catch (error) {
    log(`Check-in помилка: ${formatError(error)}`, "error");
  }
}

async function handleOpenBox() {
  if (!state.contract) {
    log("Підключи wallet і контракт перед open box.", "warn");
    return;
  }

  await refreshOnchainState();
  if (state.boxBalance < 1) {
    log("Немає box для відкриття.", "warn");
    return;
  }

  try {
    const tx = await state.contract.openBox();
    log(`Open box tx відправлено: ${tx.hash}`);

    const animPromise = playOpenAnimation(2600);
    const receipt = await tx.wait();
    await animPromise;

    const parsed = parseEvent(receipt.logs, "BoxOpened");
    if (parsed) {
      const crystalType = Number(parsed.crystalRarity);
      const crystalName = crystalNameLocal(crystalType);
      updateCrystalPreview(crystalType);
      el.lastCrystalType.textContent = `Last crystal: ${crystalName}`;
      el.openState.textContent = `Випав кристал: ${crystalName}`;
    } else {
      el.openState.textContent = "Box відкрито, кристал зараховано.";
    }

    logWithExplorer("Open box підтверджено", tx.hash);
    await refreshAll();
  } catch (error) {
    hideOpenAnimation();
    log(`Open box помилка: ${formatError(error)}`, "error");
  }
}

async function handleMint(type) {
  if (!state.contract) {
    log("Підключи wallet і контракт перед mint.", "warn");
    return;
  }

  await refreshOnchainState();

  let fn = "";
  let requiredText = "";

  if (type === "rare") {
    if (state.rare < 5) return log("Потрібно 5 Rare кристалів.", "warn");
    fn = "mintRobotWithRare";
    requiredText = "5 Rare";
  } else if (type === "epic") {
    if (state.epic < 2) return log("Потрібно 2 Epic кристали.", "warn");
    fn = "mintRobotWithEpic";
    requiredText = "2 Epic";
  } else {
    if (state.legendary < 1) return log("Потрібно 1 Legendary кристал.", "warn");
    fn = "mintRobotWithLegendary";
    requiredText = "1 Legendary";
  }

  try {
    const tx = await state.contract[fn]();
    log(`Mint tx (${requiredText}) відправлено: ${tx.hash}`);

    const receipt = await tx.wait();
    const parsed = parseEvent(receipt.logs, "RobotMinted");

    if (parsed) {
      setLatestMint(
        parsed.tokenId.toString(),
        Number(parsed.robotModel),
        crystalNameLocal(Number(parsed.sourceCrystal)),
        Number(parsed.magnitude)
      );
      el.mintState.textContent = `Minted Token #${parsed.tokenId.toString()}`;
    } else {
      const tokenId = await getLatestTokenId();
      if (tokenId) {
        await hydrateMintFromToken(tokenId);
      }
      el.mintState.textContent = "NFT успішно замінчено.";
    }

    logWithExplorer("Mint підтверджено", tx.hash);
    await refreshAll();
  } catch (error) {
    log(`Mint помилка: ${formatError(error)}`, "error");
  }
}

function parseEvent(logs, eventName) {
  for (const item of logs) {
    try {
      const parsed = state.contract.interface.parseLog(item);
      if (parsed && parsed.name === eventName) return parsed.args;
    } catch {
      // ignore non-contract logs
    }
  }

  return null;
}

async function getLatestTokenId() {
  try {
    const num = Number(await state.contract.nextTokenId());
    return num > 0 ? num : null;
  } catch {
    return null;
  }
}

async function hydrateMintFromToken(tokenId) {
  try {
    const meta = await state.contract.robotMeta(tokenId);
    setLatestMint(tokenId, Number(meta[0]), crystalNameLocal(Number(meta[1])), Number(meta[2]));
  } catch (error) {
    log(`Не вдалося прочитати token meta: ${formatError(error)}`, "warn");
  }
}

function setLatestMint(tokenId, robotModel, sourceCrystal, magnitude) {
  el.latestTokenId.textContent = `Token: #${tokenId}`;
  el.latestRobot.textContent = `Robot: #${robotModel}`;
  el.latestSource.textContent = `Source crystal: ${sourceCrystal}`;
  el.latestMagnitude.textContent = `Magnitude: ${magnitude}`;
}

function updateCrystalPreview(crystalType) {
  if (crystalType === CRYSTAL.RARE) {
    setImageSafe(el.crystalPreview, images.rareCrystal, "RARE");
    return;
  }
  if (crystalType === CRYSTAL.EPIC) {
    setImageSafe(el.crystalPreview, images.epicCrystal || images.rareCrystal, "EPIC");
    return;
  }
  setImageSafe(el.crystalPreview, images.legendaryCrystal || images.epicCrystal || images.rareCrystal, "LEGENDARY");
}

function crystalNameLocal(crystalType) {
  if (crystalType === CRYSTAL.RARE) return "Rare";
  if (crystalType === CRYSTAL.EPIC) return "Epic";
  if (crystalType === CRYSTAL.LEGENDARY) return "Legendary";
  return "Unknown";
}

function updateUi() {
  const connected = Boolean(state.account);
  const contractReady = Boolean(state.contract);
  const canCheckInNow = getCanCheckInNow();
  const enoughBalance = state.walletBalanceWei >= state.checkInFeeWei;

  el.checkInBtn.disabled = !connected || !contractReady || !canCheckInNow || !enoughBalance;
  el.openBoxBtn.disabled = !connected || !contractReady || state.boxBalance < 1;

  el.mintRareBtn.disabled = !connected || !contractReady || state.rare < 5;
  el.mintEpicBtn.disabled = !connected || !contractReady || state.epic < 2;
  el.mintLegendBtn.disabled = !connected || !contractReady || state.legendary < 1;

  if (!connected) {
    el.contractState.textContent = "Підключи wallet для старту.";
    el.payHintText.textContent = "Підключи wallet, щоб забрати check-in.";
    return;
  }

  if (!contractReady) {
    el.payHintText.textContent = "Вкажи адресу контракту в config.js.";
    return;
  }

  if (!canCheckInNow) {
    el.payHintText.textContent = "Check-in доступний раз на 24 години.";
    return;
  }

  if (!enoughBalance) {
    el.payHintText.textContent = "Недостатньо SEIS для check-in. Використай Faucet.";
    return;
  }

  el.payHintText.textContent = "Check-in доступний: після оплати отримаєш 1 box.";
}

async function playOpenAnimation(minDurationMs = 2500) {
  el.openAnimModal.classList.add("active");

  const start = Date.now();
  const video = el.boxOpenVideo;
  if (videos.boxOpenVideo) {
    try {
      video.currentTime = 0;
      await video.play();
    } catch {
      // fallback to timer only
    }
  }

  const elapsed = Date.now() - start;
  const remaining = Math.max(0, minDurationMs - elapsed);
  if (remaining > 0) {
    await wait(remaining);
  }

  hideOpenAnimation();
}

function hideOpenAnimation() {
  el.openAnimModal.classList.remove("active");
  try {
    el.boxOpenVideo.pause();
    el.boxOpenVideo.currentTime = 0;
  } catch {
    // noop
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logWithExplorer(message, txHash) {
  const base = cfg.explorerBase || "";
  const url = base ? `${base.replace(/\/$/, "")}/tx/${txHash}` : txHash;
  log(`${message}: ${url}`);
}

function log(message, level = "info") {
  const p = document.createElement("p");
  p.className = `log-line ${level === "info" ? "" : level}`.trim();
  p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  el.logBox.prepend(p);
}

function shortAddr(address) {
  if (!address || address.length < 10) return address || "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatSeis(weiValue) {
  return trimEth(ethers.formatEther(weiValue));
}

function trimEth(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return parsed.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function formatError(error) {
  if (!error) return "Unknown error";
  return error.reason || error.shortMessage || error.message || String(error);
}

function formatHms(totalSec) {
  const h = Math.floor(totalSec / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((totalSec % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSec % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatDateTime(ts) {
  return new Date(ts * 1000).toLocaleString();
}

function setImageSafe(target, src, label) {
  target.onerror = () => {
    target.onerror = null;
    target.src = fallbackImage(label);
  };
  target.src = src || fallbackImage(label);
}

function fallbackImage(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="100%" height="100%" fill="#10263d"/><text x="50%" y="50%" fill="#e7f4ff" font-family="monospace" font-size="24" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
