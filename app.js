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
  connectRabbyBtn: document.getElementById("connectRabbyBtn"),
  switchWalletBtn: document.getElementById("switchWalletBtn"),
  disconnectBtn: document.getElementById("disconnectBtn"),
  addNetworkBtn: document.getElementById("addNetworkBtn"),

  walletProviderText: document.getElementById("walletProviderText"),
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
  ethereumProvider: null,
  providerName: "-",
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
  setImageSafe(el.nftPreview, images.nftRobot, "ROBOT");

  if (videos.boxOpenVideo) {
    el.boxOpenVideo.src = videos.boxOpenVideo;
  }

  bindEvents();
  startTimer();
  updateUi();

  log("Ready. Connect wallet to start.");
}

function bindEvents() {
  el.connectBtn.addEventListener("click", () => connectWallet("default"));
  el.connectRabbyBtn.addEventListener("click", () => connectWallet("rabby"));
  el.switchWalletBtn.addEventListener("click", switchWalletAccount);
  el.disconnectBtn.addEventListener("click", disconnectWallet);
  el.addNetworkBtn.addEventListener("click", addSeismicNetwork);

  el.checkInBtn.addEventListener("click", handleCheckIn);
  el.openBoxBtn.addEventListener("click", handleOpenBox);
  el.mintRareBtn.addEventListener("click", () => handleMint("rare"));
  el.mintEpicBtn.addEventListener("click", () => handleMint("epic"));
  el.mintLegendBtn.addEventListener("click", () => handleMint("legendary"));
}

function startTimer() {
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    renderCountdown();
    updateUi();
  }, 1000);
}

function getInjectedProviders() {
  const uniq = new Set();
  const providers = [];

  const pushProvider = (p) => {
    if (!p || uniq.has(p)) return;
    uniq.add(p);
    providers.push(p);
  };

  const eth = window.ethereum;
  if (eth) {
    if (Array.isArray(eth.providers) && eth.providers.length > 0) {
      for (const p of eth.providers) pushProvider(p);
    } else {
      pushProvider(eth);
    }
  }

  // Rabby often exposes a separate object in parallel with window.ethereum.
  if (window.rabby) {
    if (window.rabby.provider) pushProvider(window.rabby.provider);
    if (window.rabby.ethereum) pushProvider(window.rabby.ethereum);
    pushProvider(window.rabby);
  }

  return providers;
}

function detectProviderName(p) {
  if (!p) return "-";
  if (p.isRabby) return "Rabby";
  if (p.isMetaMask) return "MetaMask";
  return "Injected";
}

function pickProvider(mode = "default") {
  const providers = getInjectedProviders();
  if (providers.length === 0) return null;

  if (mode === "rabby") {
    return providers.find((p) => p.isRabby) || null;
  }

  if (mode === "metamask") {
    return providers.find((p) => p.isMetaMask && !p.isRabby) || null;
  }

  if (mode === "current" && state.ethereumProvider) {
    return state.ethereumProvider;
  }

  // Default priority: MetaMask -> Rabby -> first injected
  const mm = providers.find((p) => p.isMetaMask && !p.isRabby);
  if (mm) return mm;
  const rabby = providers.find((p) => p.isRabby);
  if (rabby) return rabby;
  return providers[0];
}

function attachProviderListeners(ethProvider) {
  if (!ethProvider || typeof ethProvider.on !== "function") return;

  ethProvider.removeListener?.("accountsChanged", onAccountsChanged);
  ethProvider.removeListener?.("chainChanged", onChainChanged);

  ethProvider.on("accountsChanged", onAccountsChanged);
  ethProvider.on("chainChanged", onChainChanged);
}

function onAccountsChanged(accounts) {
  if (!accounts || accounts.length === 0) {
    disconnectWallet();
    return;
  }

  if (state.account && accounts[0].toLowerCase() !== state.account.toLowerCase()) {
    connectWallet("current", true);
  }
}

function onChainChanged() {
  connectWallet("current", true);
}

function isContractReady() {
  const addr = cfg.contractAddress || "";
  return ethers.isAddress(addr) && addr !== ethers.ZeroAddress;
}

async function connectWallet(mode = "default", silent = false) {
  const ethProvider = pickProvider(mode);

  if (!ethProvider) {
    if (!silent) {
      if (mode === "rabby") {
        log("Rabby not found. Check extension is enabled and site access is allowed.", "error");
      } else {
        log("No injected wallet found.", "error");
      }
    }
    return;
  }

  try {
    await ethProvider.request({ method: "eth_requestAccounts" });

    state.ethereumProvider = ethProvider;
    state.providerName = detectProviderName(ethProvider);
    state.provider = new ethers.BrowserProvider(ethProvider);
    state.signer = await state.provider.getSigner();
    state.account = await state.signer.getAddress();

    attachProviderListeners(ethProvider);

    const network = await state.provider.getNetwork();
    const chainId = Number(network.chainId);

    el.walletProviderText.textContent = `Provider: ${state.providerName}`;

    if (chainId !== Number(cfg.chainIdDecimal)) {
      el.walletState.textContent = `Wallet: ${shortAddr(state.account)} | Wrong chain: ${chainId}`;
      el.walletBalanceText.textContent = "Balance: wrong network";
      el.contractState.textContent = "Switch to Seismic Testnet.";
      updateUi();
      return;
    }

    el.walletState.textContent = `Wallet: ${shortAddr(state.account)} | Seismic OK`;

    if (!isContractReady()) {
      el.contractState.textContent = "Set contractAddress in config.js";
      await refreshWalletBalance();
      updateUi();
      return;
    }

    state.contract = new ethers.Contract(cfg.contractAddress, CONTRACT_ABI, state.signer);
    el.contractState.textContent = `Contract: ${shortAddr(cfg.contractAddress)}`;

    await refreshAll();
    if (!silent) log(`Connected via ${state.providerName}.`);
  } catch (error) {
    if (!silent) log(`Connect error: ${formatError(error)}`, "error");
  }

  updateUi();
}

async function switchWalletAccount() {
  if (!state.ethereumProvider) {
    await connectWallet("default");
    return;
  }

  try {
    if (state.ethereumProvider.isMetaMask || state.ethereumProvider.isRabby) {
      await state.ethereumProvider.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      });
    } else {
      await state.ethereumProvider.request({ method: "eth_requestAccounts" });
    }

    await connectWallet("current", true);
    log("Wallet account switched.");
  } catch (error) {
    log(`Switch wallet failed: ${formatError(error)}`, "warn");
  }
}

function disconnectWallet() {
  const oldProvider = state.ethereumProvider;

  // Best-effort permission revoke (supported in MetaMask/Rabby on some versions).
  if (oldProvider?.request) {
    oldProvider
      .request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }]
      })
      .catch(() => {
        // Local disconnect still works even when revoke is unsupported.
      });
  }

  if (state.ethereumProvider?.removeListener) {
    state.ethereumProvider.removeListener("accountsChanged", onAccountsChanged);
    state.ethereumProvider.removeListener("chainChanged", onChainChanged);
  }

  state.ethereumProvider = null;
  state.providerName = "-";
  state.provider = null;
  state.signer = null;
  state.contract = null;
  state.account = null;
  state.walletBalanceWei = 0n;
  state.checkInFeeWei = 0n;
  state.boxBalance = 0;
  state.nextCheckInAt = 0;
  state.rare = 0;
  state.epic = 0;
  state.legendary = 0;

  el.walletProviderText.textContent = "Provider: -";
  el.walletState.textContent = "Wallet not connected";
  el.walletBalanceText.textContent = "Balance: -";
  el.contractState.textContent = "Contract: -";
  el.progressText.textContent = "00:00:00";
  el.nextCheckInText.textContent = "Next check-in: -";
  el.progressBar.style.width = "0%";
  el.feeText.textContent = "Check-in fee: -";
  el.boxBalanceText.textContent = "Boxes: 0";
  el.rareCount.textContent = "Rare: 0";
  el.epicCount.textContent = "Epic: 0";
  el.legendaryCount.textContent = "Legendary: 0";
  el.payHintText.textContent = "Connect wallet to start.";

  updateUi();
  log("Wallet disconnected (local session).", "warn");
}

async function addSeismicNetwork() {
  const eth = state.ethereumProvider || window.ethereum;
  if (!eth) {
    log("No injected wallet found.", "error");
    return;
  }

  try {
    await eth.request({
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
    log("Seismic Testnet added.");
  } catch (error) {
    log(`Network add failed: ${formatError(error)}`, "error");
  }
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
    log(`Balance read failed: ${formatError(error)}`, "warn");
  }
}

async function refreshOnchainState() {
  if (!state.contract || !state.account) return;

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

    el.openState.textContent = state.boxBalance > 0 ? "Box is ready." : "No box yet. Do daily check-in.";
  } catch (error) {
    log(`Contract read failed: ${formatError(error)}`, "error");
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
    el.nextCheckInText.textContent = "Next check-in: available now";
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
  if (!state.contract) return log("Connect wallet and contract first.", "warn");

  await refreshAll();

  if (!getCanCheckInNow()) return log("Check-in available once per 24h.", "warn");
  if (state.walletBalanceWei < state.checkInFeeWei) return log("Not enough SEIS. Use faucet.", "warn");

  try {
    log(`Confirm payment ${formatSeis(state.checkInFeeWei)} SEIS.`);
    const tx = await state.contract.checkIn({ value: state.checkInFeeWei });
    log(`Check-in tx sent: ${tx.hash}`);

    await tx.wait();
    logWithExplorer("Check-in confirmed", tx.hash);
    await refreshAll();
  } catch (error) {
    log(`Check-in error: ${formatError(error)}`, "error");
  }
}

async function handleOpenBox() {
  if (!state.contract) return log("Connect wallet and contract first.", "warn");

  await refreshOnchainState();
  if (state.boxBalance < 1) return log("No box available.", "warn");

  try {
    const tx = await state.contract.openBox();
    log(`Open box tx sent: ${tx.hash}`);

    const animPromise = playOpenAnimation(2600);
    const receipt = await tx.wait();
    await animPromise;

    const parsed = parseEvent(receipt.logs, "BoxOpened");
    if (parsed) {
      const crystalType = Number(parsed.crystalRarity);
      const crystalName = crystalNameLocal(crystalType);
      updateCrystalPreview(crystalType);
      el.lastCrystalType.textContent = `Last crystal: ${crystalName}`;
      el.openState.textContent = `Drop: ${crystalName}`;
    } else {
      el.openState.textContent = "Box opened.";
    }

    logWithExplorer("Box opened", tx.hash);
    await refreshAll();
  } catch (error) {
    hideOpenAnimation();
    log(`Open box error: ${formatError(error)}`, "error");
  }
}

async function handleMint(type) {
  if (!state.contract) return log("Connect wallet and contract first.", "warn");

  await refreshOnchainState();

  let fn = "";
  let requiredText = "";

  if (type === "rare") {
    if (state.rare < 5) return log("Need 5 Rare crystals.", "warn");
    fn = "mintRobotWithRare";
    requiredText = "5 Rare";
  } else if (type === "epic") {
    if (state.epic < 2) return log("Need 2 Epic crystals.", "warn");
    fn = "mintRobotWithEpic";
    requiredText = "2 Epic";
  } else {
    if (state.legendary < 1) return log("Need 1 Legendary crystal.", "warn");
    fn = "mintRobotWithLegendary";
    requiredText = "1 Legendary";
  }

  try {
    const tx = await state.contract[fn]();
    log(`Mint tx (${requiredText}) sent: ${tx.hash}`);

    const receipt = await tx.wait();
    const parsed = parseEvent(receipt.logs, "RobotMinted");

    if (parsed) {
      setLatestMint(
        parsed.tokenId.toString(),
        Number(parsed.robotModel),
        crystalNameLocal(Number(parsed.sourceCrystal)),
        Number(parsed.magnitude)
      );
      el.mintState.textContent = `Minted token #${parsed.tokenId.toString()}`;
    } else {
      const tokenId = await getLatestTokenId();
      if (tokenId) await hydrateMintFromToken(tokenId);
      el.mintState.textContent = "Mint success.";
    }

    logWithExplorer("Mint confirmed", tx.hash);
    await refreshAll();
  } catch (error) {
    log(`Mint error: ${formatError(error)}`, "error");
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
    log(`Token read failed: ${formatError(error)}`, "warn");
  }
}

function setLatestMint(tokenId, robotModel, sourceCrystal, magnitude) {
  el.latestTokenId.textContent = `Token: #${tokenId}`;
  el.latestRobot.textContent = `Robot: #${robotModel}`;
  el.latestSource.textContent = `Source crystal: ${sourceCrystal}`;
  el.latestMagnitude.textContent = `Magnitude: ${magnitude}`;
}

function updateCrystalPreview(crystalType) {
  if (crystalType === CRYSTAL.RARE) return setImageSafe(el.crystalPreview, images.rareCrystal, "RARE");
  if (crystalType === CRYSTAL.EPIC) return setImageSafe(el.crystalPreview, images.epicCrystal || images.rareCrystal, "EPIC");
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

  el.switchWalletBtn.disabled = !connected;
  el.disconnectBtn.disabled = !connected;

  el.checkInBtn.disabled = !connected || !contractReady || !canCheckInNow || !enoughBalance;
  el.openBoxBtn.disabled = !connected || !contractReady || state.boxBalance < 1;

  el.mintRareBtn.disabled = !connected || !contractReady || state.rare < 5;
  el.mintEpicBtn.disabled = !connected || !contractReady || state.epic < 2;
  el.mintLegendBtn.disabled = !connected || !contractReady || state.legendary < 1;

  if (!connected) {
    el.payHintText.textContent = "Connect wallet to start.";
    return;
  }

  if (!contractReady) {
    el.payHintText.textContent = "Set contractAddress in config.js.";
    return;
  }

  if (!canCheckInNow) {
    el.payHintText.textContent = "Check-in available once per 24h.";
    return;
  }

  if (!enoughBalance) {
    el.payHintText.textContent = "Not enough SEIS for check-in. Use faucet.";
    return;
  }

  el.payHintText.textContent = "Check-in is available now.";
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
      // timer fallback
    }
  }

  const remaining = Math.max(0, minDurationMs - (Date.now() - start));
  if (remaining > 0) await wait(remaining);

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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="100%" height="100%" fill="#1a1231"/><text x="50%" y="50%" fill="#f6ecff" font-family="monospace" font-size="24" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
