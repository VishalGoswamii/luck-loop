// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LuckLoopNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct NFTMetadata {
        string name;
        string description;
        string rarity;
        string symbols;
        uint256 timestamp;
        address player;
        bytes32 gameId;
    }

    mapping(uint256 => NFTMetadata) public nftMetadata;
    mapping(address => uint256[]) public playerNFTs;
    mapping(string => uint256) public rarityCount;
    mapping(bytes32 => bool) public usedGameIds;
    
    // Authorized game contracts that can mint
    mapping(address => bool) public authorizedMinters;

    event NFTMinted(
        address indexed player,
        uint256 indexed tokenId,
        string rarity,
        string symbols,
        string name,
        bytes32 gameId
    );

    constructor() ERC721("LuckLoop", "LOOP") {}

    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }

    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
    }

    function mintNFT(
        address player,
        string memory name,
        string memory description,
        string memory rarity,
        string memory symbols,
        string memory tokenURI,
        bytes32 gameId
    ) public onlyAuthorizedMinter nonReentrant returns (uint256) {
        require(!usedGameIds[gameId], "Game ID already used");
        require(player != address(0), "Invalid player address");
        
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
            player: player,
            gameId: gameId
        });

        playerNFTs[player].push(newTokenId);
        rarityCount[rarity]++;
        usedGameIds[gameId] = true;

        emit NFTMinted(player, newTokenId, rarity, symbols, name, gameId);
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

    function isGameIdUsed(bytes32 gameId) public view returns (bool) {
        return usedGameIds[gameId];
    }
}
