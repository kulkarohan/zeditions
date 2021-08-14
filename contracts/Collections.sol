// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;
pragma experimental ABIEncoderV2;

// ============ Imports ============

import "./Media.sol";
import "./Market.sol";

/**
 * @title Collections: Mirror-style Editions on Zora
 * @author Rohan Kulkarni
 */
contract Collections {
    // ============ Constants ============

    // Contract deployer
    address private owner;
    // Zora media address
    address public mediaContract;
    // Zora market address
    address public marketContract;

    // ============ Structs ============

    // Individual collection
    struct Collection {
        // Address of collection creator
        address creator;
        // Address to deposit funds raised
        address payable depositAddress;
        // Number of NFTs in the collection
        uint256 supply;
        // Price of each NFT
        uint256 price;
        // Token id of media minted on Zora representing this collection
        uint256 zMediaId;
        // Amount of NFTs sold
        uint256 sold;
    }

    // ============ Mutable Storage ============

    // Mapping of collection id to collection struct
    mapping(uint256 => Collection) public collections;
    // Mapping of collection id to amount of its funds withdrawn by creator
    mapping(uint256 => uint256) public amountWithdrawnToCreator;
    // Mapping of purchased token id to buyer
    mapping(uint256 => address) public tokenToBuyer;
    // Mapping of token id to media data
    mapping(uint256 => Media.MediaData) private tokenToMediaData;
    // Mapping of token id to bid shares
    mapping(uint256 => Market.BidShares) private tokenToBidShares;

    // Collection id counter
    uint256 private nextCollectionId = 1;
    // Token id counter
    uint256 private nextTokenId = 1;

    // ============ Events ============

    event CollectionCreated(
        uint256 indexed collectionId,
        uint256 indexed zMediaId,
        address indexed creator,
        uint256 supply,
        uint256 price
    );

    event CollectionPurchased(
        uint256 indexed collectionId,
        address indexed buyer,
        uint256 indexed tokenId
    );

    // ============ Modifers ============

    // Only the contract deployer can set the media and market contract addresses
    modifier onlyContractOwner() {
        require(msg.sender == owner, "You did not deploy this contract.");
        _;
    }

    // Only the owner of a media minted on Zora can create a collection of it
    modifier onlyMediaOwner(uint256 zMediaId) {
        require(
            msg.sender == Media(mediaContract).tokenCreators(zMediaId),
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
    // Only the creator of a collection can withdraw funds
    modifier onlyCreator(uint256 collectionId) {
        require(
            msg.sender == collections[collectionId].creator,
            "You did not create this collection."
        );
        _;
    }

    modifier onlyValidPurchase(uint256 collectionId) {
        require(
            collections[collectionId].supply > 0,
            "Collection does not exist."
        );
        require(
            collections[collectionId].sold < collections[collectionId].supply,
            "Collection sold out :("
        );
        require(
            msg.value == collections[collectionId].price,
            "Must send enough to purchase from this collection."
        );
        _;
    }

    // ============ Constructor ============
    constructor() {
        owner = msg.sender;
    }

    // ============ Collection Methods ============

    /**
     * Enables an Zora media owner to create a collection, specifying parameters
     * @param supply number of NFTs to create as part of the collection
     * @param price price to set for each NFT
     * @param depositAddress address to receive funds
     * @param zMediaId id of media owned on Zora to create collection for
     */
    function createCollection(
        uint256 supply,
        uint256 price,
        address payable depositAddress,
        uint256 zMediaId
    ) public onlyMediaOwner(zMediaId) {
        collections[nextCollectionId] = Collection({
            creator: msg.sender,
            depositAddress: depositAddress,
            supply: supply,
            price: price,
            zMediaId: zMediaId,
            sold: 0
        });

        emit CollectionCreated(
            nextCollectionId,
            zMediaId,
            msg.sender,
            supply,
            price
        );

        nextCollectionId++;
    }

    /**
     * Enables anyone to own a piece of a collection, specifying parameter
     * @param collectionId id of collection to purchase a piece of
     */
    function buyCollection(uint256 collectionId)
        external
        payable
        onlyValidPurchase(collectionId)
    {
        _storeMediaData(collectionId, nextTokenId);
        _storeBidShares(collectionId, nextTokenId);

        tokenToBuyer[nextTokenId] = msg.sender;

        emit CollectionPurchased(collectionId, msg.sender, nextTokenId);

        collections[collectionId].sold++;
        nextTokenId++;
    }

    /**
     * Provides a buyer of a token its MediaData to mint on Zora, specifying parameter
     * @param tokenId id of the token purchased
     */
    function collectionMediaData(uint256 tokenId)
        public
        view
        onlyBuyer(tokenId)
        returns (Media.MediaData memory)
    {
        return tokenToMediaData[tokenId];
    }

    /**
     * Provides a buyer of a token its BidShares to mint on Zora, specifying parameter
     * @param tokenId id of the token purchased
     */
    function collectionBidShares(uint256 tokenId)
        public
        view
        onlyBuyer(tokenId)
        returns (Market.BidShares memory)
    {
        return tokenToBidShares[tokenId];
    }

    // ============ Operational Methods ============

    /**
     * Enables creator to withdraw funds received for a collection at any time, specifying parameter
     * @param collectionId id of collection to withdraw funds from
     */
    function withdrawFunds(uint256 collectionId)
        external
        onlyCreator(collectionId)
    {
        uint256 amountRemaining = (collections[collectionId].price *
            collections[collectionId].sold) -
            amountWithdrawnToCreator[collectionId];

        amountWithdrawnToCreator[collectionId] += amountRemaining;
        _sendFunds(collections[collectionId].depositAddress, amountRemaining);
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
    function _storeMediaData(uint256 collectionId, uint256 userTokenId)
        private
    {
        uint256 zMediaId = collections[collectionId].zMediaId;
        // Get collection's token uri
        string memory tokenURI = Media(mediaContract).tokenURI(zMediaId);
        // Get collection's token metadata uri
        string memory tokenMetadataURI = Media(mediaContract).tokenMetadataURI(
            zMediaId
        );
        // Get collection's token metadata hash
        bytes32 tokenMetadataHash = Media(mediaContract).tokenMetadataHashes(
            zMediaId
        );
        // Generate new content hash for token to mint
        bytes32 newContentHash = keccak256(
            // Hash of collection's token id + current amount sold counter + current time
            abi.encode(
                zMediaId,
                collections[collectionId].sold,
                block.timestamp
            )
        );
        // Contruct MediaData of new token to mint
        Media.MediaData memory mediaData = Media.MediaData(
            tokenURI,
            tokenMetadataURI,
            newContentHash,
            tokenMetadataHash
        );

        // Store MediaData for buyer to access
        tokenToMediaData[userTokenId] = mediaData;
    }

    function _storeBidShares(uint256 collectionId, uint256 userTokenId)
        private
    {
        // Get BidShares from collection's token id
        Market.BidShares memory bidShares = Market(marketContract)
            .bidSharesForToken(collections[collectionId].zMediaId);

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
