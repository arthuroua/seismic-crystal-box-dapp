# Seismic Crystal Box dApp

Frontend + Solidity contract for Seismic Testnet (EVM L1, chainId `5124`).

## Game flow
- `checkIn()` is available once every 24h and costs testnet SEIS.
- Each daily check-in gives `+1 box`.
- `openBox()` gives one crystal:
  - `Rare` (72%)
  - `Epic` (23%)
  - `Legendary` (5%)
- Mint Seismic Robot NFT by spending crystals:
  - `5 Rare` or
  - `2 Epic` or
  - `1 Legendary`

## Network settings
- Name: `Seismic Testnet`
- Chain ID: `5124` (`0x1404`)
- RPC HTTP: `https://gcp-2.seismictest.net/rpc`
- RPC WS: `wss://gcp-2.seismictest.net/ws`
- Explorer: `https://seismic-testnet.socialscan.io/`
- Faucet: `https://community-faucet.seismictest.net/`

## Project files
- `index.html` - UI
- `styles.css` - styles
- `app.js` - wallet + contract logic
- `config.js` - editable config (`contractAddress`, image paths)
- `assets/README.txt` - where to place `rare/epic/legendary/nft` images
- `contracts/SeismicAvatarMagnitudeNFT.sol` - contract source (`SeismicCrystalRobotNFT`)
- `contracts/README.md` - deployment guide
- `contracts/VERIFY-SOCIALSCAN.md` - verification guide

## Quick start
1. Deploy contract from `contracts/SeismicAvatarMagnitudeNFT.sol`.
2. Put deployed address into `config.js` (`contractAddress`).
3. Add images into `assets/` (optional but recommended).
4. Run static server:

```powershell
cd J:\seismic-avatar-nft
npx serve .
```

5. Open URL, connect wallet, do daily check-ins, open boxes, mint robots.

