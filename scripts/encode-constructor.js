const { ethers } = require("ethers");

// Fill these values exactly as used during deployment.
const owner = "0x0000000000000000000000000000000000000000";
const feeReceiver = "0x0000000000000000000000000000000000000000";
const checkInFeeWei = "100000000000000"; // example: 0.0001
const nftImageURI = ""; // e.g. https://your-cdn.com/seismic-robot.png

const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address", "address", "uint256", "string"],
  [owner, feeReceiver, checkInFeeWei, nftImageURI]
);

console.log("Constructor args (hex):", encoded);
console.log("Constructor args (without 0x):", encoded.slice(2));
