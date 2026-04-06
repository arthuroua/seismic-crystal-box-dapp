window.SEISMIC_DAPP_CONFIG = {
  projectName: "Seismic Crystal Box",
  chainIdHex: "0x1404",
  chainIdDecimal: 5124,
  chainName: "Seismic Testnet",
  rpcHttp: "https://gcp-2.seismictest.net/rpc",
  rpcWs: "wss://gcp-2.seismictest.net/ws",
  nativeCurrency: {
    name: "Seismic",
    symbol: "SEIS",
    decimals: 18
  },
  explorerBase: "https://seismic-testnet.socialscan.io",
  faucetUrl: "https://community-faucet.seismictest.net/",

  // Set deployed contract address here.
  contractAddress: "0xFc4196e80CB6f2a2b2DbC99C50feE2E83B16Df15",
  // Optional: deployed SeismicCardImageNFT minter contract for card-maker mint button.
  cardMinterAddress: "0x5636351BB0fc5f890c896b7BCa603976A88D8D45",

  // Optional local images (you said you will add them).
  assetImages: {
    rareCrystal: "./assets/rare.png",
    epicCrystal: "./assets/epic.png",
    legendaryCrystal: "./assets/legendary.png",
    nftRobot: "./assets/seismic-robot.png",
    boxImage: "./assets/box.png"
  },
  assetVideos: {
    boxOpenVideo: "./assets/box-open.mp4",
    dropRareVideo: "./assets/drop-rare.mp4",
    dropEpicVideo: "./assets/drop-epic.mp4",
    dropLegendaryVideo: "./assets/drop-legendary.mp4",
    mintReadyVideo: "./assets/mint-ready.mp4"
  }
};


