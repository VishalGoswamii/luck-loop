// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./LuckLoopNFT.sol";

// WARNING: This version is INSECURE. It has no signature verification.
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
    event GameResultStored(bytes32 indexed gameId, address indexed player, string rarity);
    event NFTMintedByUser(bytes32 indexed gameId, address indexed player, uint256 tokenId);

    constructor(address _nftContractAddress) {
        nftContract = LuckLoopNFT(_nftContractAddress);
    }

    // INSECURE: This function now trusts any data passed to it.
    function storeGameResult(
        string memory symbols,
        string memory rarity,
        bytes32 gameId
    ) external {
        require(!gameResults[gameId].minted, "Game ID already used");

        gameResults[gameId] = GameResult({
            player: msg.sender,
            symbols: symbols,
            rarity: rarity,
            timestamp: block.timestamp,
            minted: false
        });

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
