# Seismic Crystal Robot Contract

Source file: `contracts/SeismicAvatarMagnitudeNFT.sol`
Contract name: `SeismicCrystalRobotNFT`

## Mechanics
- `checkIn()` once per 24h (`CHECKIN_COOLDOWN = 1 days`), paid by `checkInFeeWei`.
- Every check-in gives `+1 box`.
- `openBox()` consumes 1 box and drops one crystal:
  - Rare 72%
  - Epic 23%
  - Legendary 5%
- NFT mint rules:
  - `mintRobotWithRare()` requires 5 Rare
  - `mintRobotWithEpic()` requires 2 Epic
  - `mintRobotWithLegendary()` requires 1 Legendary

## Constructor
`constructor(address owner_, address feeReceiver_, uint256 checkInFeeWei_, string nftImageURI_)`

Example values:
- `owner_`: your wallet
- `feeReceiver_`: your wallet/treasury
- `checkInFeeWei_`: `100000000000000` (0.0001)
- `nftImageURI_`: `https://.../seismic-robot.png` or `""` (fallback on-chain SVG)

## Deploy with Remix
1. Open [Remix](https://remix.ethereum.org/).
2. Paste `SeismicAvatarMagnitudeNFT.sol`.
3. Compile with Solidity `0.8.24`.
4. Deploy to Seismic Testnet with constructor args above.
5. Put deployed address into `config.js`.

## UI-used methods
- `checkInFeeWei()`
- `CHECKIN_COOLDOWN()`
- `getUserStatus(address)`
- `getCrystalBalances(address)`
- `checkIn()`
- `openBox()`
- `mintRobotWithRare()`
- `mintRobotWithEpic()`
- `mintRobotWithLegendary()`
- `robotMeta(uint256)`
- `nextTokenId()`

