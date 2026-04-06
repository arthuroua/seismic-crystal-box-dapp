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
  contractAddress: "0x0000000000000000000000000000000000000000",
  // Optional: deployed SeismicCardImageNFT minter contract for card-maker mint button.
  cardMinterAddress: "",

  // Optional local images (you said you will add them).
  assetImages: {
    rareCrystal: "./assets/rare.png",
    epicCrystal: "./assets/epic.png",
    legendaryCrystal: "./assets/legendary.png",
    nftRobot: "./assets/seismic-robot.png",
    boxImage: "./assets/box.png"
  },
  assetVideos: {
    boxOpenVideo: "./assets/box-open.mp4"
  }
};
