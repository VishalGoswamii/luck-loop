// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// We've added ERC721URIStorage to handle the token URI
contract LuckLoopNFT is ERC721, ERC721URIStorage, Ownable {
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
        // This will now work correctly!
        _setTokenURI(tokenId, tokenURI);
        emit NFTMinted(player, tokenId, rarity);
        return tokenId;
    }
    
    // The functions below are required by ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
