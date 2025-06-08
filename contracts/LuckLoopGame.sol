// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./LuckLoopNFT.sol";

contract LuckLoopGame is Ownable, ReentrancyGuard {
    LuckLoopNFT public nftContract;
    
    struct GameResult {
        address player;
        string symbols;
        string rarity;
        uint256 timestamp;
        uint256 tokenId;
    }

    mapping(address => uint256) public lastSpinTime;
    mapping(address => uint256) public playerSpinCount;
    mapping(bytes32 => GameResult) public gameResults;

    uint256 public spinCooldown = 1 hours; // Prevent spam
    uint256 public totalSpins = 0;
    
    event GamePlayed(
        address indexed player,
        string symbols,
        string rarity,
        uint256 tokenId,
        bytes32 gameId
    );

    constructor(address _nftContract) {
        nftContract = LuckLoopNFT(_nftContract);
    }

    function canSpin(address player) public view returns (bool) {
        return block.timestamp >= lastSpinTime[player] + spinCooldown;
    }

    function recordGameResult(
        address player,
        string memory symbols,
        string memory rarity,
        string memory name,
        string memory description,
        string memory tokenURI,
        bytes32 gameId
    ) external onlyOwner nonReentrant {
        require(canSpin(player), "Spin cooldown not met");
        
        uint256 tokenId = 0;
        
        // Only mint NFT for non-common results
        if (keccak256(bytes(rarity)) != keccak256(bytes("common"))) {
            tokenId = nftContract.mintNFT(
                player,
                name,
                description,
                rarity,
                symbols,
                tokenURI
            );
        }

        gameResults[gameId] = GameResult({
            player: player,
            symbols: symbols,
            rarity: rarity,
            timestamp: block.timestamp,
            tokenId: tokenId
        });

        lastSpinTime[player] = block.timestamp;
        playerSpinCount[player]++;
        totalSpins++;

        emit GamePlayed(player, symbols, rarity, tokenId, gameId);
    }

    function getGameResult(bytes32 gameId) public view returns (GameResult memory) {
        return gameResults[gameId];
    }

    function getPlayerStats(address player) public view returns (
        uint256 spins,
        uint256 lastSpin,
        uint256[] memory nfts
    ) {
        return (
            playerSpinCount[player],
            lastSpinTime[player],
            nftContract.getPlayerNFTs(player)
        );
    }

    function setCooldown(uint256 _cooldown) external onlyOwner {
        spinCooldown = _cooldown;
    }
}
