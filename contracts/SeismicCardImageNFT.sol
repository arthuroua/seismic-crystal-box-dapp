// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract SeismicCardImageNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    error EmptyMetadataURI();

    event CardMinted(address indexed user, uint256 indexed tokenId, string metadataURI);

    constructor(address owner_) ERC721("Seismic Info Card", "SCARD") Ownable(owner_) {}

    function mintCard(string calldata metadataURI) external returns (uint256 tokenId) {
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();

        tokenId = ++nextTokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit CardMinted(msg.sender, tokenId, metadataURI);
    }
}

