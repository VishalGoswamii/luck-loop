// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./LuckLoopNFT.sol";

// WARNING: This version is INSECURE and has no signature verification.
// It should not be used in production.
contract LuckLoopGame {
    LuckLoopNFT public immutable nftContract;

    struct GameResult {
        address player;
        string symbols;
        string rarity;
        uint256 timestamp;
        bool minted;
    }

    mapping(bytes32 => GameResult) public gameResults;
    mapping(address => uint256) public playerSpins;
    mapping(address => uint256) public lastSpinTimestamp;

    uint256 public constant SPIN_COOLDOWN = 1 hours;

    event GameResultStored(bytes32 indexed gameId, address indexed player, string rarity);
    event NFTMintedByUser(bytes32 indexed gameId, address indexed player, uint256 tokenId);

    constructor(address _nftContractAddress) {
        nftContract = LuckLoopNFT(_nftContractAddress);
    }

    function canSpin(address player) public view returns (bool) {
        return block.timestamp >= lastSpinTimestamp[player] + SPIN_COOLDOWN;
    }

    // This function is now insecure as it trusts any data passed to it.
    function storeGameResult(
        string memory symbols,
        string memory rarity,
        bytes32 gameId
    ) external {
        require(canSpin(msg.sender), "Cooldown active");
        require(!gameResults[gameId].minted, "Game ID already used");

        gameResults[gameId] = GameResult({
            player: msg.sender,
            symbols: symbols,
            rarity: rarity,
            timestamp: block.timestamp,
            minted: false
        });

        playerSpins[msg.sender]++;
        lastSpinTimestamp[msg.sender] = block.timestamp;

        emit GameResultStored(gameId, msg.sender, rarity);
    }

    function mintNFTFromGame(bytes32 gameId, string memory tokenURI) external {
        GameResult storage result = gameResults[gameId];
        require(result.player == msg.sender, "Not the owner of this game result");
        require(result.timestamp != 0, "Game result not found");
        require(!result.minted, "NFT already minted for this game");

        result.minted = true;
        uint256 tokenId = nftContract.mint(msg.sender, tokenURI, result.rarity);

        emit NFTMintedByUser(gameId, msg.sender, tokenId);
    }
}
