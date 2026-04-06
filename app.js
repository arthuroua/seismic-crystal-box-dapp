import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.15.0/+esm";

const cfg = window.SEISMIC_DAPP_CONFIG || {};
const images = cfg.assetImages || {};
const videos = cfg.assetVideos || {};

const CONTRACT_ABI = [
  "function checkInFeeWei() view returns (uint256)",
  "function CHECKIN_COOLDOWN() view returns (uint64)",
  "function balanceOf(address owner) view returns (uint256)",
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

const I18N = {
  uk: {
    heroTitle: "Crystal Box -> Seismic Robot NFT",
    heroSubtitle:
      "1 бокс на день після check-in. З бокса падає кристал Rare/Epic/Legendary. Для мінту робота потрібно: 5 Rare або 2 Epic або 1 Legendary.",
    walletSectionTitle: "1) Гаманець",
    checkinSectionTitle: "2) Щоденний Check-In",
    openSectionTitle: "3) Відкрити Бокс",
    mintSectionTitle: "4) Мінт Robot NFT",
    activityTitle: "Активність",
    connectWallet: "Підключити гаманець",
    connectRabby: "Підключити Rabby",
    switchWallet: "Змінити гаманець",
    disconnect: "Відключити",
    addNetwork: "Додати Seismic Network",
    cardMakerLink: "Post Card Builder + Mint",
    openCardMaker: "Відкрити Card Builder + Mint",
    dailyCheckIn: "Щоденний Check-in (+1 Box)",
    openBox: "Відкрити бокс",
    mintRare: "Мінт за 5 Rare",
    mintEpic: "Мінт за 2 Epic",
    mintLegendary: "Мінт за 1 Legendary",
    provider: "Провайдер",
    wallet: "Гаманець",
    walletNotConnected: "Гаманець не підключено",
    balance: "Баланс",
    txCount: "К-сть транзакцій",
    yourNfts: "Твої NFT",
    contract: "Контракт",
    nextCheckin: "Наступний check-in",
    checkinFee: "Комісія check-in",
    boxes: "Бокси",
    ready: "ГОТОВО",
    availableNow: "доступно зараз",
    connectToStart: "Підключи гаманець для старту.",
    setContractInConfig: "Вкажи contractAddress у config.js.",
    once24h: "Check-in доступний раз на 24 години.",
    notEnoughSeis: "Недостатньо SEIS для check-in. Використай faucet.",
    checkinAvailable: "Check-in доступний зараз.",
    noBoxYet: "Ще немає бокса. Зроби щоденний check-in.",
    boxReady: "Бокс готовий.",
    lastCrystal: "Останній кристал",
    rare: "Rare",
    epic: "Epic",
    legendary: "Legendary",
    token: "Токен",
    robot: "Робот",
    sourceCrystal: "Кристал-джерело",
    magnitude: "Магнітуда",
    drop: "Випало",
    boxOpened: "Бокс відкрито.",
    openingBox: "Відкриття бокса...",
    crystalDrop: "Випадіння кристала...",
    close: "Закрити",
    wrongNetwork: "Невірна мережа",
    seismicOk: "Seismic OK"
  },
  en: {
    heroTitle: "Crystal Box -> Seismic Robot NFT",
    heroSubtitle:
      "1 box per day after check-in. The box drops a Rare/Epic/Legendary crystal. To mint a robot: 5 Rare or 2 Epic or 1 Legendary.",
    walletSectionTitle: "1) Wallet",
    checkinSectionTitle: "2) Daily Check-In",
    openSectionTitle: "3) Open Box",
    mintSectionTitle: "4) Mint Robot NFT",
    activityTitle: "Activity",
    connectWallet: "Connect Wallet",
    connectRabby: "Connect Rabby",
    switchWallet: "Switch Wallet",
    disconnect: "Disconnect",
    addNetwork: "Add Seismic Network",
    cardMakerLink: "Post Card Builder + Mint",
    openCardMaker: "Open Card Builder + Mint",
    dailyCheckIn: "Daily Check-in (+1 Box)",
    openBox: "Open Box",
    mintRare: "Mint for 5 Rare",
    mintEpic: "Mint for 2 Epic",
    mintLegendary: "Mint for 1 Legendary",
    provider: "Provider",
    wallet: "Wallet",
    walletNotConnected: "Wallet not connected",
    balance: "Balance",
    txCount: "Tx count",
    yourNfts: "Your NFTs",
    contract: "Contract",
    nextCheckin: "Next check-in",
    checkinFee: "Check-in fee",
    boxes: "Boxes",
    ready: "READY",
    availableNow: "available now",
    connectToStart: "Connect wallet to start.",
    setContractInConfig: "Set contractAddress in config.js.",
    once24h: "Check-in available once per 24h.",
    notEnoughSeis: "Not enough SEIS for check-in. Use faucet.",
    checkinAvailable: "Check-in is available now.",
    noBoxYet: "No box yet. Do daily check-in.",
    boxReady: "Box is ready.",
    lastCrystal: "Last crystal",
    rare: "Rare",
    epic: "Epic",
    legendary: "Legendary",
    token: "Token",
    robot: "Robot",
    sourceCrystal: "Source crystal",
    magnitude: "Magnitude",
    drop: "Drop",
    boxOpened: "Box opened.",
    openingBox: "Opening Box...",
    crystalDrop: "Crystal Drop...",
    mintReady: "Mint Ready...",
    close: "Close",
    wrongNetwork: "Wrong chain",
    seismicOk: "Seismic OK"
  }
};

const el = {
  langUkBtn: document.getElementById("langUkBtn"),
  langEnBtn: document.getElementById("langEnBtn"),
  heroTitle: document.getElementById("heroTitle"),
  heroSubtitle: document.getElementById("heroSubtitle"),
  walletSectionTitle: document.getElementById("walletSectionTitle"),
  checkinSectionTitle: document.getElementById("checkinSectionTitle"),
  openSectionTitle: document.getElementById("openSectionTitle"),
  mintSectionTitle: document.getElementById("mintSectionTitle"),
  activityTitle: document.getElementById("activityTitle"),
  connectBtn: document.getElementById("connectBtn"),
  connectRabbyBtn: document.getElementById("connectRabbyBtn"),
  switchWalletBtn: document.getElementById("switchWalletBtn"),
  disconnectBtn: document.getElementById("disconnectBtn"),
  addNetworkBtn: document.getElementById("addNetworkBtn"),

  walletProviderText: document.getElementById("walletProviderText"),
  walletState: document.getElementById("walletState"),
  walletBalanceText: document.getElementById("walletBalanceText"),
  walletTxCountText: document.getElementById("walletTxCountText"),
  walletNftCountText: document.getElementById("walletNftCountText"),
  contractState: document.getElementById("contractState"),

  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  nextCheckInText: document.getElementById("nextCheckInText"),
  feeText: document.getElementById("feeText"),
  boxBalanceText: document.getElementById("boxBalanceText"),
  payHintText: document.getElementById("payHintText"),
  checkInBtn: document.getElementById("checkInBtn"),

  boxImage: document.getElementById("boxImage"),
  rareCrystalImg: document.getElementById("rareCrystalImg"),
  epicCrystalImg: document.getElementById("epicCrystalImg"),
  legendaryCrystalImg: document.getElementById("legendaryCrystalImg"),
  rareCrystalCard: document.getElementById("rareCrystalCard"),
  epicCrystalCard: document.getElementById("epicCrystalCard"),
  legendaryCrystalCard: document.getElementById("legendaryCrystalCard"),
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
  openAnimCloseBtn: document.getElementById("openAnimCloseBtn"),
  dropAnimModal: document.getElementById("dropAnimModal"),
  dropVideo: document.getElementById("dropVideo"),
  dropCaption: document.getElementById("dropCaption"),
  dropAnimCloseBtn: document.getElementById("dropAnimCloseBtn"),
  mintAnimModal: document.getElementById("mintAnimModal"),
  mintReadyVideo: document.getElementById("mintReadyVideo"),
  mintReadyCaption: document.getElementById("mintReadyCaption"),
  mintAnimCloseBtn: document.getElementById("mintAnimCloseBtn"),
  openCaption: document.getElementById("openCaption"),

  explorerLink: document.getElementById("explorerLink"),
  faucetLink: document.getElementById("faucetLink"),
  cardMakerLink: document.getElementById("cardMakerLink"),
  openCardMakerBtn: document.getElementById("openCardMakerBtn"),
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
  walletTxCount: 0,
  walletNftCount: 0,
  checkInFeeWei: 0n,
  cooldownSeconds: 86400,
  canCheckIn: false,
  boxBalance: 0,
  nextCheckInAt: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
  timerId: null,
  locale: localStorage.getItem("seismic_locale") === "en" ? "en" : "uk"
};

init();

function init() {
  el.explorerLink.href = cfg.explorerBase || "#";
  el.faucetLink.href = cfg.faucetUrl || "#";

  setImageSafe(el.boxImage, images.boxImage, "BOX");
  setImageSafe(el.rareCrystalImg, images.rareCrystal, "RARE");
  setImageSafe(el.epicCrystalImg, images.epicCrystal || images.rareCrystal, "EPIC");
  setImageSafe(el.legendaryCrystalImg, images.legendaryCrystal || images.epicCrystal || images.rareCrystal, "LEGENDARY");
  setImageSafe(el.nftPreview, images.nftRobot, "ROBOT");

  if (videos.boxOpenVideo) {
    el.boxOpenVideo.src = videos.boxOpenVideo;
  }
  if (videos.mintReadyVideo) {
    el.mintReadyVideo.src = videos.mintReadyVideo;
  }

  bindEvents();
  applyLocale();
  updateCrystalCardsUi();
  startTimer();
  updateUi();

  log(tr("connectToStart"));
}

function bindEvents() {
  el.langUkBtn?.addEventListener("click", () => setLocale("uk"));
  el.langEnBtn?.addEventListener("click", () => setLocale("en"));
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
  el.openAnimCloseBtn?.addEventListener("click", hideOpenAnimation);
  el.dropAnimCloseBtn?.addEventListener("click", hideDropAnimation);
  el.mintAnimCloseBtn?.addEventListener("click", hideMintReadyAnimation);
}

function tr(key) {
  return I18N[state.locale]?.[key] || I18N.en[key] || key;
}

function setLocale(locale) {
  state.locale = locale === "en" ? "en" : "uk";
  localStorage.setItem("seismic_locale", state.locale);
  applyLocale();
  renderCountdown();
  updateUi();
}

function applyLocale() {
  el.heroTitle.textContent = tr("heroTitle");
  el.heroSubtitle.textContent = tr("heroSubtitle");
  el.walletSectionTitle.textContent = tr("walletSectionTitle");
  el.checkinSectionTitle.textContent = tr("checkinSectionTitle");
  el.openSectionTitle.textContent = tr("openSectionTitle");
  el.mintSectionTitle.textContent = tr("mintSectionTitle");
  el.activityTitle.textContent = tr("activityTitle");

  el.connectBtn.textContent = tr("connectWallet");
  el.connectRabbyBtn.textContent = tr("connectRabby");
  el.switchWalletBtn.textContent = tr("switchWallet");
  el.disconnectBtn.textContent = tr("disconnect");
  el.addNetworkBtn.textContent = tr("addNetwork");
  if (el.cardMakerLink) el.cardMakerLink.textContent = tr("cardMakerLink");
  if (el.openCardMakerBtn) el.openCardMakerBtn.textContent = tr("openCardMaker");
  el.checkInBtn.textContent = tr("dailyCheckIn");
  el.openBoxBtn.textContent = tr("openBox");
  el.mintRareBtn.textContent = tr("mintRare");
  el.mintEpicBtn.textContent = tr("mintEpic");
  el.mintLegendBtn.textContent = tr("mintLegendary");
  el.openCaption.textContent = tr("openingBox");
  el.dropCaption.textContent = tr("crystalDrop");
  el.mintReadyCaption.textContent = tr("mintReady");
  el.openAnimCloseBtn.textContent = tr("close");
  el.dropAnimCloseBtn.textContent = tr("close");
  el.mintAnimCloseBtn.textContent = tr("close");

  el.langUkBtn?.classList.toggle("active", state.locale === "uk");
  el.langEnBtn?.classList.toggle("active", state.locale === "en");

  if (!state.account) {
    el.walletProviderText.textContent = `${tr("provider")}: -`;
    el.walletState.textContent = tr("walletNotConnected");
    el.walletBalanceText.textContent = `${tr("balance")}: -`;
    el.walletTxCountText.textContent = `${tr("txCount")}: -`;
    el.walletNftCountText.textContent = `${tr("yourNfts")}: -`;
    el.contractState.textContent = `${tr("contract")}: -`;
    el.feeText.textContent = `${tr("checkinFee")}: -`;
    el.boxBalanceText.textContent = `${tr("boxes")}: 0`;
    el.nextCheckInText.textContent = `${tr("nextCheckin")}: -`;
    el.payHintText.textContent = tr("connectToStart");
    el.lastCrystalType.textContent = `${tr("lastCrystal")}: -`;
    el.rareCount.textContent = `${tr("rare")}: 0`;
    el.epicCount.textContent = `${tr("epic")}: 0`;
    el.legendaryCount.textContent = `${tr("legendary")}: 0`;
    el.latestTokenId.textContent = `${tr("token")}: -`;
    el.latestRobot.textContent = `${tr("robot")}: -`;
    el.latestSource.textContent = `${tr("sourceCrystal")}: -`;
    el.latestMagnitude.textContent = `${tr("magnitude")}: -`;
    updateCrystalCardsUi();
    return;
  }

  el.walletProviderText.textContent = `${tr("provider")}: ${state.providerName || "-"}`;
  el.walletState.textContent = `${tr("wallet")}: ${shortAddr(state.account)} | ${tr("seismicOk")}`;
  el.walletBalanceText.textContent = `${tr("balance")}: ${formatSeis(state.walletBalanceWei)} SEIS`;
  el.walletTxCountText.textContent = `${tr("txCount")}: ${state.walletTxCount ?? "-"}`;
  el.walletNftCountText.textContent = `${tr("yourNfts")}: ${state.walletNftCount ?? "-"}`;
  el.feeText.textContent = `${tr("checkinFee")}: ${state.checkInFeeWei > 0n ? `${formatSeis(state.checkInFeeWei)} SEIS` : "-"}`;
  el.boxBalanceText.textContent = `${tr("boxes")}: ${state.boxBalance}`;
  el.rareCount.textContent = `${tr("rare")}: ${state.rare}`;
  el.epicCount.textContent = `${tr("epic")}: ${state.epic}`;
  el.legendaryCount.textContent = `${tr("legendary")}: ${state.legendary}`;
  updateCrystalCardsUi();
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

    el.walletProviderText.textContent = `${tr("provider")}: ${state.providerName}`;

    if (chainId !== Number(cfg.chainIdDecimal)) {
      el.walletState.textContent = `${tr("wallet")}: ${shortAddr(state.account)} | ${tr("wrongNetwork")}: ${chainId}`;
      el.walletBalanceText.textContent = `${tr("balance")}: ${tr("wrongNetwork")}`;
      el.walletTxCountText.textContent = `${tr("txCount")}: ${tr("wrongNetwork")}`;
      el.walletNftCountText.textContent = `${tr("yourNfts")}: ${tr("wrongNetwork")}`;
      el.contractState.textContent = `Contract: ${tr("wrongNetwork")}`;
      updateUi();
      return;
    }

    el.walletState.textContent = `${tr("wallet")}: ${shortAddr(state.account)} | ${tr("seismicOk")}`;

    if (!isContractReady()) {
      el.contractState.textContent = tr("setContractInConfig");
      await refreshWalletBalance();
      updateUi();
      return;
    }

    state.contract = new ethers.Contract(cfg.contractAddress, CONTRACT_ABI, state.signer);
    el.contractState.textContent = `${tr("contract")}: ${shortAddr(cfg.contractAddress)}`;

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
  state.walletTxCount = 0;
  state.walletNftCount = 0;
  state.checkInFeeWei = 0n;
  state.canCheckIn = false;
  state.boxBalance = 0;
  state.nextCheckInAt = 0;
  state.rare = 0;
  state.epic = 0;
  state.legendary = 0;

  el.walletProviderText.textContent = `${tr("provider")}: -`;
  el.walletState.textContent = tr("walletNotConnected");
  el.walletBalanceText.textContent = `${tr("balance")}: -`;
  el.walletTxCountText.textContent = `${tr("txCount")}: -`;
  el.walletNftCountText.textContent = `${tr("yourNfts")}: -`;
  el.contractState.textContent = `${tr("contract")}: -`;
  el.progressText.textContent = "00:00:00";
  el.nextCheckInText.textContent = `${tr("nextCheckin")}: -`;
  el.progressBar.style.width = "0%";
  el.feeText.textContent = `${tr("checkinFee")}: -`;
  el.boxBalanceText.textContent = `${tr("boxes")}: 0`;
  el.rareCount.textContent = `${tr("rare")}: 0`;
  el.epicCount.textContent = `${tr("epic")}: 0`;
  el.legendaryCount.textContent = `${tr("legendary")}: 0`;
  updateCrystalCardsUi();
  el.payHintText.textContent = tr("connectToStart");

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
  await Promise.all([refreshWalletBalance(), refreshWalletStats(), refreshOnchainState()]);
  renderCountdown();
  updateUi();
}

async function refreshWalletBalance() {
  if (!state.provider || !state.account) {
    state.walletBalanceWei = 0n;
    el.walletBalanceText.textContent = `${tr("balance")}: -`;
    return;
  }

  try {
    const balance = await state.provider.getBalance(state.account);
    state.walletBalanceWei = balance;
    el.walletBalanceText.textContent = `${tr("balance")}: ${formatSeis(balance)} SEIS`;
  } catch (error) {
    state.walletBalanceWei = 0n;
    log(`Balance read failed: ${formatError(error)}`, "warn");
  }
}

async function refreshWalletStats() {
  if (!state.provider || !state.account) {
    state.walletTxCount = 0;
    state.walletNftCount = 0;
    el.walletTxCountText.textContent = `${tr("txCount")}: -`;
    el.walletNftCountText.textContent = `${tr("yourNfts")}: -`;
    return;
  }

  try {
    const txCount = await state.provider.getTransactionCount(state.account, "latest");
    state.walletTxCount = Number(txCount);
    el.walletTxCountText.textContent = `${tr("txCount")}: ${state.walletTxCount}`;
  } catch (error) {
    el.walletTxCountText.textContent = `${tr("txCount")}: -`;
    log(`Tx count read failed: ${formatError(error)}`, "warn");
  }

  if (!state.contract) {
    state.walletNftCount = 0;
    el.walletNftCountText.textContent = `${tr("yourNfts")}: -`;
    return;
  }

  try {
    const nftCount = await state.contract.balanceOf(state.account);
    state.walletNftCount = Number(nftCount);
    el.walletNftCountText.textContent = `${tr("yourNfts")}: ${state.walletNftCount}`;
  } catch (error) {
    el.walletNftCountText.textContent = `${tr("yourNfts")}: -`;
    log(`NFT count read failed: ${formatError(error)}`, "warn");
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
    state.canCheckIn = Boolean(status[3]);
    state.nextCheckInAt = Number(status[2]);

    state.rare = Number(balances[0]);
    state.epic = Number(balances[1]);
    state.legendary = Number(balances[2]);

    el.feeText.textContent = `${tr("checkinFee")}: ${formatSeis(state.checkInFeeWei)} SEIS`;
    el.boxBalanceText.textContent = `${tr("boxes")}: ${state.boxBalance}`;
    el.rareCount.textContent = `${tr("rare")}: ${state.rare}`;
    el.epicCount.textContent = `${tr("epic")}: ${state.epic}`;
    el.legendaryCount.textContent = `${tr("legendary")}: ${state.legendary}`;
    updateCrystalCardsUi();

    el.openState.textContent = state.boxBalance > 0 ? tr("boxReady") : tr("noBoxYet");
  } catch (error) {
    state.canCheckIn = false;
    updateCrystalCardsUi();
    log(`Contract read failed: ${formatError(error)}`, "error");
  }
}

function getCanCheckInNow() {
  return Boolean(state.canCheckIn);
}

function renderCountdown() {
  if (!state.account || !state.contract) {
    el.progressText.textContent = "00:00:00";
    el.nextCheckInText.textContent = `${tr("nextCheckin")}: -`;
    el.progressBar.style.width = "0%";
    return;
  }

  if (getCanCheckInNow()) {
    el.progressText.textContent = tr("ready");
    el.nextCheckInText.textContent = `${tr("nextCheckin")}: ${tr("availableNow")}`;
    el.progressBar.style.width = "100%";
    return;
  }

  const nowTs = Math.floor(Date.now() / 1000);
  const remaining = Math.max(0, state.nextCheckInAt - nowTs);
  if (state.nextCheckInAt > nowTs) {
    el.progressText.textContent = formatHms(remaining);
    el.nextCheckInText.textContent = `${tr("nextCheckin")}: ${formatDateTime(state.nextCheckInAt)}`;
  } else {
    el.progressText.textContent = "WAIT";
    el.nextCheckInText.textContent = `${tr("nextCheckin")}: syncing...`;
  }

  const cooldown = Math.max(1, state.cooldownSeconds);
  const elapsed = Math.max(0, cooldown - remaining);
  el.progressBar.style.width = `${Math.min(100, Math.round((elapsed / cooldown) * 100))}%`;
}

async function handleCheckIn() {
  if (!state.contract) return log("Connect wallet and contract first.", "warn");

  await refreshAll();

  if (!getCanCheckInNow()) return log(tr("once24h"), "warn");
  if (state.walletBalanceWei < state.checkInFeeWei) return log(tr("notEnoughSeis"), "warn");

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

    const animPromise = playOpenAnimation(5600);
    const receipt = await tx.wait();
    await animPromise;

    const parsed = parseEvent(receipt.logs, "BoxOpened");
    if (parsed) {
      const crystalType = Number(parsed.crystalRarity);
      const crystalName = crystalNameLocal(crystalType);
      updateCrystalPreview(crystalType);
      el.lastCrystalType.textContent = `${tr("lastCrystal")}: ${crystalName}`;
      el.openState.textContent = `${tr("drop")}: ${crystalName}`;
      await playDropAnimation(crystalType, 6000);
    } else {
      el.openState.textContent = tr("boxOpened");
    }

    logWithExplorer("Box opened", tx.hash);
    await refreshAll();
  } catch (error) {
    hideOpenAnimation();
    hideDropAnimation();
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
    let mintedTokenId = null;
    let mintedRobotModel = null;
    let mintedSourceCrystal = null;
    let mintedMagnitude = null;

    await playMintReadyAnimation(6000);
    const tx = await state.contract[fn]();
    log(`Mint tx (${requiredText}) sent: ${tx.hash}`);

    const receipt = await tx.wait();
    const parsed = parseEvent(receipt.logs, "RobotMinted");

    if (parsed) {
      mintedTokenId = parsed.tokenId.toString();
      mintedRobotModel = Number(parsed.robotModel);
      mintedSourceCrystal = crystalNameLocal(Number(parsed.sourceCrystal));
      mintedMagnitude = Number(parsed.magnitude);

      setLatestMint(
        mintedTokenId,
        mintedRobotModel,
        mintedSourceCrystal,
        mintedMagnitude
      );
      el.mintState.textContent = `Minted token #${mintedTokenId}`;
    } else {
      const tokenId = await getLatestTokenId();
      if (tokenId) {
        mintedTokenId = String(tokenId);
        const meta = await state.contract.robotMeta(tokenId);
        mintedRobotModel = Number(meta[0]);
        mintedSourceCrystal = crystalNameLocal(Number(meta[1]));
        mintedMagnitude = Number(meta[2]);
        setLatestMint(mintedTokenId, mintedRobotModel, mintedSourceCrystal, mintedMagnitude);
      }
      el.mintState.textContent = "Mint success.";
    }

    logWithExplorer("Mint confirmed", tx.hash);
    await refreshAll();

    if (mintedTokenId) {
      openMintSuccessPage({
        tokenId: mintedTokenId,
        robotModel: mintedRobotModel ?? 0,
        sourceCrystal: mintedSourceCrystal || "Unknown",
        magnitude: mintedMagnitude ?? 0,
        txHash: tx.hash
      });
    }
  } catch (error) {
    hideMintReadyAnimation();
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
  el.latestTokenId.textContent = `${tr("token")}: #${tokenId}`;
  el.latestRobot.textContent = `${tr("robot")}: #${robotModel}`;
  el.latestSource.textContent = `${tr("sourceCrystal")}: ${sourceCrystal}`;
  el.latestMagnitude.textContent = `${tr("magnitude")}: ${magnitude}`;
}

function updateCrystalPreview(crystalType) {
  setLastDropCard(crystalType);
}

function updateCrystalCardsUi() {
  updateCrystalCardState(el.rareCrystalCard, state.rare);
  updateCrystalCardState(el.epicCrystalCard, state.epic);
  updateCrystalCardState(el.legendaryCrystalCard, state.legendary);
}

function updateCrystalCardState(card, amount) {
  if (!card) return;
  card.classList.toggle("has-amount", amount > 0);
  card.classList.toggle("is-empty", amount < 1);
}

function setLastDropCard(crystalType) {
  el.rareCrystalCard?.classList.remove("last-drop");
  el.epicCrystalCard?.classList.remove("last-drop");
  el.legendaryCrystalCard?.classList.remove("last-drop");

  if (crystalType === CRYSTAL.RARE) {
    el.rareCrystalCard?.classList.add("last-drop");
    return;
  }
  if (crystalType === CRYSTAL.EPIC) {
    el.epicCrystalCard?.classList.add("last-drop");
    return;
  }
  if (crystalType === CRYSTAL.LEGENDARY) {
    el.legendaryCrystalCard?.classList.add("last-drop");
  }
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
    el.payHintText.textContent = tr("connectToStart");
    return;
  }

  if (!contractReady) {
    el.payHintText.textContent = tr("setContractInConfig");
    return;
  }

  if (!canCheckInNow) {
    el.payHintText.textContent = tr("once24h");
    return;
  }

  if (!enoughBalance) {
    el.payHintText.textContent = tr("notEnoughSeis");
    return;
  }

  el.payHintText.textContent = tr("checkinAvailable");
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
  if (remaining > 0) await waitWithClose(el.openAnimCloseBtn, remaining);

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

function dropVideoByCrystal(crystalType) {
  if (crystalType === CRYSTAL.RARE) return videos.dropRareVideo || "";
  if (crystalType === CRYSTAL.EPIC) return videos.dropEpicVideo || "";
  if (crystalType === CRYSTAL.LEGENDARY) return videos.dropLegendaryVideo || "";
  return "";
}

async function playDropAnimation(crystalType, minDurationMs = 6000) {
  const crystalName = crystalNameLocal(crystalType);
  const videoSrc = dropVideoByCrystal(crystalType);

  el.dropCaption.textContent = `${tr("drop")}: ${crystalName}`;
  el.dropAnimModal.classList.add("active");

  const start = Date.now();
  if (videoSrc) {
    try {
      el.dropVideo.src = videoSrc;
      el.dropVideo.currentTime = 0;
      await el.dropVideo.play();
    } catch {
      // timer fallback
    }
  }

  const remaining = Math.max(0, minDurationMs - (Date.now() - start));
  if (remaining > 0) await waitWithClose(el.dropAnimCloseBtn, remaining);

  hideDropAnimation();
}

function hideDropAnimation() {
  el.dropAnimModal.classList.remove("active");
  try {
    el.dropVideo.pause();
    el.dropVideo.currentTime = 0;
  } catch {
    // noop
  }
}

async function playMintReadyAnimation(minDurationMs = 6000) {
  el.mintAnimModal.classList.add("active");

  const start = Date.now();
  if (videos.mintReadyVideo) {
    try {
      el.mintReadyVideo.currentTime = 0;
      await el.mintReadyVideo.play();
    } catch {
      // timer fallback
    }
  }

  const remaining = Math.max(0, minDurationMs - (Date.now() - start));
  if (remaining > 0) await waitWithClose(el.mintAnimCloseBtn, remaining);

  hideMintReadyAnimation();
}

function hideMintReadyAnimation() {
  el.mintAnimModal.classList.remove("active");
  try {
    el.mintReadyVideo.pause();
    el.mintReadyVideo.currentTime = 0;
  } catch {
    // noop
  }
}

function openMintSuccessPage({ tokenId, robotModel, sourceCrystal, magnitude, txHash }) {
  const params = new URLSearchParams({
    tokenId: String(tokenId),
    robotModel: String(robotModel),
    sourceCrystal: String(sourceCrystal),
    magnitude: String(magnitude),
    txHash: String(txHash || ""),
    image: String(images.nftRobot || "")
  });
  window.location.href = `./minted.html?${params.toString()}`;
}

function waitWithClose(closeButton, ms) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      closeButton?.removeEventListener("click", onClose);
      resolve();
    };
    const onClose = () => finish();
    closeButton?.addEventListener("click", onClose, { once: true });
    setTimeout(finish, ms);
  });
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
