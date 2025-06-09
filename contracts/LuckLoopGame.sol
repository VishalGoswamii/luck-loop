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
        string name;
        string description;
        uint256 timestamp;
        bool minted;
        bytes32 gameId;
    }

    mapping(address => uint256) public lastSpinTime;
    mapping(address => uint256) public playerSpinCount;
    mapping(bytes32 => GameResult) public gameResults;
    mapping(address => bytes32[]) public playerGameHistory;

    uint256 public spinCooldown = 1 hours;
    uint256 public totalSpins = 0;
    
    // Game verification system
    mapping(address => bool) public authorizedVerifiers;
    
    event GameResultStored(
        address indexed player,
        bytes32 indexed gameId,
        string symbols,
        string rarity
    );
    
    event NFTMintedByUser(
        address indexed player,
        uint256 indexed tokenId,
        bytes32 indexed gameId
    );

    constructor(address _nftContract) {
        nftContract = LuckLoopNFT(_nftContract);
        authorizedVerifiers[msg.sender] = true;
    }

    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner(), "Not authorized verifier");
        _;
    }

    function setAuthorizedVerifier(address verifier, bool authorized) external onlyOwner {
        authorizedVerifiers[verifier] = authorized;
    }

    function canSpin(address player) public view returns (bool) {
        return block.timestamp >= lastSpinTime[player] + spinCooldown;
    }

    // Backend stores game result after generating it
    function storeGameResult(
        address player,
        string memory symbols,
        string memory rarity,
        string memory name,
        string memory description,
        bytes32 gameId,
        bytes memory signature
    ) external onlyAuthorizedVerifier nonReentrant {
        require(gameResults[gameId].player == address(0), "Game ID already exists");
        require(canSpin(player), "Spin cooldown not met");
        
        // Verify signature to prevent tampering
        bytes32 messageHash = keccak256(abi.encodePacked(player, symbols, rarity, gameId));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        require(recoverSigner(ethSignedMessageHash, signature) == owner(), "Invalid signature");
        
        gameResults[gameId] = GameResult({
            player: player,
            symbols: symbols,
            rarity: rarity,
            name: name,
            description: description,
            timestamp: block.timestamp,
            minted: false,
            gameId: gameId
        });

        playerGameHistory[player].push(gameId);
        lastSpinTime[player] = block.timestamp;
        playerSpinCount[player]++;
        totalSpins++;

        emit GameResultStored(player, gameId, symbols, rarity);
    }

    // User calls this function to mint their NFT (pays gas)
    function mintNFTFromGame(
        bytes32 gameId,
        string memory tokenURI
    ) external nonReentrant {
        GameResult storage result = gameResults[gameId];
        require(result.player == msg.sender, "Not your game result");
        require(!result.minted, "NFT already minted");
        require(keccak256(bytes(result.rarity)) != keccak256(bytes("common")), "Common results don't get NFTs");

        result.minted = true;

        uint256 tokenId = nftContract.mintNFT(
            msg.sender,
            result.name,
            result.description,
            result.rarity,
            result.symbols,
            tokenURI,
            gameId
        );

        emit NFTMintedByUser(msg.sender, tokenId, gameId);
    }

    function getGameResult(bytes32 gameId) public view returns (GameResult memory) {
        return gameResults[gameId];
    }

    function getPlayerGameHistory(address player) public view returns (bytes32[] memory) {
        return playerGameHistory[player];
    }

    function getPlayerStats(address player) public view returns (
        uint256 spins,
        uint256 lastSpin,
        uint256[] memory nfts,
        bytes32[] memory gameHistory
    ) {
        return (
            playerSpinCount[player],
            lastSpinTime[player],
            nftContract.getPlayerNFTs(player),
            playerGameHistory[player]
        );
    }

    function setCooldown(uint256 _cooldown) external onlyOwner {
        spinCooldown = _cooldown;
    }

    function recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
        bytes32 r;
        bytes32 s;
        uint8 v;

        if (signature.length != 65) {
            return address(0);
        }

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        if (v != 27 && v != 28) {
            return address(0);
        }

        return ecrecover(hash, v, r, s);
    }
}
