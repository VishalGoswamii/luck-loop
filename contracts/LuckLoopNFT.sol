// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract LuckLoopNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct NFTMetadata {
        string name;
        string description;
        string rarity;
        string symbols;
        uint256 timestamp;
        address player;
    }

    mapping(uint256 => NFTMetadata) public nftMetadata;
    mapping(address => uint256[]) public playerNFTs;
    mapping(string => uint256) public rarityCount;

    event NFTMinted(
        address indexed player,
        uint256 indexed tokenId,
        string rarity,
        string symbols,
        string name
    );

    constructor() ERC721("LuckLoop", "LOOP") {}

    function mintNFT(
        address player,
        string memory name,
        string memory description,
        string memory rarity,
        string memory symbols,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(player, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        nftMetadata[newTokenId] = NFTMetadata({
            name: name,
            description: description,
            rarity: rarity,
            symbols: symbols,
            timestamp: block.timestamp,
            player: player
        });

        playerNFTs[player].push(newTokenId);
        rarityCount[rarity]++;

        emit NFTMinted(player, newTokenId, rarity, symbols, name);
        return newTokenId;
    }

    function getPlayerNFTs(address player) public view returns (uint256[] memory) {
        return playerNFTs[player];
    }

    function getNFTMetadata(uint256 tokenId) public view returns (NFTMetadata memory) {
        require(_exists(tokenId), "Token does not exist");
        return nftMetadata[tokenId];
    }

    function getTotalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    function getRarityStats() public view returns (
        uint256 legendary,
        uint256 epic,
        uint256 rare,
        uint256 common
    ) {
        return (
            rarityCount["legendary"],
            rarityCount["epic"],
            rarityCount["rare"],
            rarityCount["common"]
        );
    }
}
