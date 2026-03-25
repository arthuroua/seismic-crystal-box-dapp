# SocialScan Verification Guide (Seismic)

Verify page:
`https://seismic-testnet.socialscan.io/verify-contract/`

## Prepared files
- Flattened source:
  - `J:\seismic-avatar-nft\verification\SeismicAvatarMagnitudeNFT.flattened.sol`

## Step 1 fields
- Contract Address: `<deployed address>`
- Compiler Type: `Solidity (Single file)`
- Compiler Version: `v0.8.24+commit.e11b9ed9`
- Open Source License: `MIT License (MIT)`

## Step 2 fields
- Contract Name: `SeismicCrystalRobotNFT`
- Optimization:
  - First try `No` (if Remix default settings)
  - If deploy was optimized, set exactly same `Yes + runs`
- Constructor args: use `scripts/encode-constructor.js`

## Constructor argument order
1. `owner_` (address)
2. `feeReceiver_` (address)
3. `checkInFeeWei_` (uint256)
4. `nftImageURI_` (string)

## Source code
Paste full contents of:
`J:\seismic-avatar-nft\verification\SeismicAvatarMagnitudeNFT.flattened.sol`


