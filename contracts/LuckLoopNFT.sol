// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LuckLoopNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    address private _authorizedMinter;

    event NFTMinted(address indexed player, uint256 indexed tokenId, string rarity);

    modifier onlyAuthorizedMinter() {
        require(msg.sender == _authorizedMinter, "Not authorized to mint");
        _;
    }

    constructor() ERC721("Luck Loop NFT", "LLN") {}

    function setAuthorizedMinter(address minterAddress, bool isAuthorized) public onlyOwner {
        if (isAuthorized) {
            _authorizedMinter = minterAddress;
        } else {
            _authorizedMinter = address(0);
        }
    }

    function mint(address player, string memory tokenURI, string memory rarity)
        public
        onlyAuthorizedMinter
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(player, tokenId);
        _setTokenURI(tokenId, tokenURI);
        emit NFTMinted(player, tokenId, rarity);
        return tokenId;
    }
}
