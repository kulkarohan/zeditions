// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.7;
pragma experimental ABIEncoderV2;

// ============ Imports ============

import "./IMedia.sol";
import "./IMarket.sol";

/**
 * @title zeditions: Mirror-style Editions on Zora
 * @author Rohan Kulkarni
 */
contract Zeditions {
    // ============ Constants ============

    // Contract deployer
    address private owner;
    // Zora media address
    address public mediaContract;
    // Zora market address
    address public marketContract;

    // ============ Structs ============

    struct Edition {
        // Address of edition creator
        address creator;
        // Address to send funds raised
        address payable depositAddress;
        // Number of edition copies
        uint256 supply;
        // Price per copy
        uint256 price;
        // Zora media id underyling edition copies
        uint256 zMediaId;
        // Amount sold counter
        uint256 sold;
    }

    // ============ Mutable Storage ============

    // Mapping of edition id to edition struct
    mapping(uint256 => Edition) public editions;
    // Mapping of edition id to amount of its funds withdrawn by creator
    mapping(uint256 => uint256) public amountWithdrawnToCreator;
    // Mapping of purchased token id to buyer
    mapping(uint256 => address) public tokenToBuyer;
    // Mapping of token id to media data
    mapping(uint256 => IMedia.MediaData) private tokenToMediaData;
    // Mapping of token id to bid shares
    mapping(uint256 => IMarket.BidShares) private tokenToBidShares;

    // Edition id counter
    uint256 private nextEditionId = 1;
    // Token id counter
    uint256 private nextTokenId = 1;

    // ============ Events ============

    event EditionCreated(
        address indexed creator,
        uint256 indexed editionId,
        uint256 indexed zMediaId,
        uint256 supply,
        uint256 price
    );

    event EditionPurchased(
        address indexed buyer,
        uint256 indexed editionId,
        uint256 indexed tokenId
    );

    // ============ Modifers ============

    // Only the contract deployer can set the media and market contract addresses
    modifier onlyContractOwner() {
        require(msg.sender == owner, "You did not deploy this contract.");
        _;
    }

    // Only the owner of media minted on Zora can create editions for it
    modifier onlyMediaOwner(uint256 zMediaId) {
        require(
            msg.sender == IMedia(mediaContract).tokenCreators(zMediaId),
            "You do not own this token."
        );
        _;
    }
    // Only the buyer of a token can access its data for minting
    modifier onlyBuyer(uint256 tokenId) {
        require(
            msg.sender == tokenToBuyer[tokenId],
            "You did not purchase this token."
        );
        _;
    }
    // Only the creator of a edition can withdraw funds
    modifier onlyCreator(uint256 editionId) {
        require(
            msg.sender == editions[editionId].creator,
            "You did not create this edition."
        );
        _;
    }

    modifier onlyValidPurchase(uint256 editionId) {
        require(
            editions[editionId].supply > 0,
            "Edition does not exist."
        );
        require(
            editions[editionId].sold < editions[editionId].supply,
            "Edition sold out :("
        );
        require(
            msg.value == editions[editionId].price,
            "Must send enough to purchase from this edition."
        );
        _;
    }

    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
    }

    // ============ Edition Methods ============

    /**
     * Enables an Zora media owner to create a edition, specifying parameters
     * @param supply number of NFTs to create as part of the edition
     * @param price price to set for each NFT
     * @param depositAddress address to receive funds
     * @param zMediaId id of media owned on Zora to create edition for
     */
    function createEdition(
        uint256 supply,
        uint256 price,
        address payable depositAddress,
        uint256 zMediaId
    ) public onlyMediaOwner(zMediaId) {
        editions[nextEditionId] = Edition({
            creator: msg.sender,
            depositAddress: depositAddress,
            supply: supply,
            price: price,
            zMediaId: zMediaId,
            sold: 0
        });

        emit EditionCreated(
            msg.sender,
            nextEditionId,
            zMediaId,
            supply,
            price
        );

        nextEditionId++;
    }

    /**
     * Enables anyone to own a piece of a edition, specifying parameter
     * @param editionId id of edition to purchase a piece of
     */
    function buyEdition(uint256 editionId)
        external
        payable
        onlyValidPurchase(editionId)
    {
        _storeMediaData(editionId, nextTokenId);
        _storeBidShares(editionId, nextTokenId);

        tokenToBuyer[nextTokenId] = msg.sender;

        emit EditionPurchased(msg.sender, editionId, nextTokenId);

        editions[editionId].sold++;
        nextTokenId++;
    }

    /**
     * Provides a buyer of a token its MediaData to mint on Zora, specifying parameter
     * @param tokenId id of the token purchased
     */
    function editionMediaData(uint256 tokenId)
        public
        view
        onlyBuyer(tokenId)
        returns (IMedia.MediaData memory)
    {
        return tokenToMediaData[tokenId];
    }

    /**
     * Provides a buyer of a token its BidShares to mint on Zora, specifying parameter
     * @param tokenId id of the token purchased
     */
    function editionBidShares(uint256 tokenId)
        public
        view
        onlyBuyer(tokenId)
        returns (IMarket.BidShares memory)
    {
        return tokenToBidShares[tokenId];
    }

    // ============ Operational Methods ============

    /**
     * Enables creator to withdraw funds received for a edition at any time, specifying parameter
     * @param editionId id of edition to withdraw funds from
     */
    function withdrawFunds(uint256 editionId)
        external
        onlyCreator(editionId)
    {
        uint256 amountRemaining = (editions[editionId].price *
            editions[editionId].sold) -
            amountWithdrawnToCreator[editionId];

        amountWithdrawnToCreator[editionId] += amountRemaining;
        _sendFunds(editions[editionId].depositAddress, amountRemaining);
    }

    function setMediaAddress(address mediaAddress) external onlyContractOwner {
        mediaContract = mediaAddress;
    }

    function setMarketAddress(address marketAddress)
        external
        onlyContractOwner
    {
        marketContract = marketAddress;
    }

    // ============ Private Methods ============

    function _storeMediaData(uint256 editionId, uint256 userTokenId)
        private
    {
        uint256 zMediaId = editions[editionId].zMediaId;
        // Get edition's token uri
        string memory tokenURI = IMedia(mediaContract).tokenURI(zMediaId);
        // Get edition's token metadata uri
        string memory tokenMetadataURI = IMedia(mediaContract).tokenMetadataURI(
            zMediaId
        );
        // Get edition's token metadata hash
        bytes32 tokenMetadataHash = IMedia(mediaContract).tokenMetadataHashes(
            zMediaId
        );
        // Generate new content hash for token to mint
        bytes32 newContentHash = keccak256(
            // Hash of edition's token id + current amount sold counter + current time
            abi.encode(
                zMediaId,
                editions[editionId].sold,
                block.timestamp
            )
        );
        // Contruct MediaData of new token to mint
        IMedia.MediaData memory mediaData = IMedia.MediaData(
            tokenURI,
            tokenMetadataURI,
            newContentHash,
            tokenMetadataHash
        );

        // Store MediaData for buyer to access
        tokenToMediaData[userTokenId] = mediaData;
    }

    function _storeBidShares(uint256 editionId, uint256 userTokenId)
        private
    {
        // Get BidShares from edition's token id
        IMarket.BidShares memory bidShares = IMarket(marketContract)
            .bidSharesForToken(editions[editionId].zMediaId);

        // Store BidShares for buyer to access
        tokenToBidShares[userTokenId] = bidShares;
    }

    function _sendFunds(address payable depositAddress, uint256 amount)
        private
    {
        require(
            address(this).balance >= amount,
            "Insufficient balance to send"
        );

        (bool success, ) = depositAddress.call{value: amount}("");
        require(success, "Unable to send: creator may have reverted");
    }
}
