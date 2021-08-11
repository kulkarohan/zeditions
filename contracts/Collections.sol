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

    // Deployment address
    address private _owner;
    // Zora media address
    address public mediaContract = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;
    // Zora market address
    address public marketContract = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;

    // ============ Structs ============

    // Individual collection
    struct Collection {
        // Number of NFTs in the collection
        uint256 supply;
        // Price of each NFT
        uint256 price;
        // Address to pay creator
        address payable creator;
        // Token id of media minted on Zora representing this collection
        uint256 tokenId;
        // Amount of NFTs sold
        uint256 sold;
    }

    // ============ Mutable Storage ============

    // Mapping of collection id to collection struct
    mapping(uint256 => Collection) public collections;
    // Mapping of collection id to amount of funds creator has withdrawn
    mapping(uint256 => uint256) public amountWithdrawnToCreator;
    // Mapping of token buyer to purchased token id
    mapping(address => uint256) public buyerToToken;
    // Mapping of token id to media data
    mapping(uint256 => Media.MediaData) private tokenToMediaData;
    // Mapping of token id to bid shares
    mapping(uint256 => Market.BidShares) private tokenToBidShares;
    // Collection id counter
    uint256 private nextCollectionId = 1;
    // Counter of all collection token ids
    uint256 private nextGlobalToken = 1;

    // ============ Events ============

    // Collection creation event
    event CollectionCreated(
        uint256 indexed collectionId,
        uint256 indexed tokenId,
        address creator,
        uint256 supply,
        uint256 price
    );

    // NFT in collection purchased
    event CollectionPurchased(
        uint256 indexed collectionId,
        address indexed buyer,
        uint256 indexed tokenId
    );

    // ============ Modifers ============

    // Only contract deployer can set Zora media and market contract addresses
    modifier onlyContractOwner() {
        require(msg.sender == _owner);
        _;
    }

    // Only the owner of token is allowed to create a collection of it
    modifier onlyCreator(uint256 _tokenId) {
        require(
            msg.sender == Media(mediaContract).tokenCreators(_tokenId),
            "You do not own this token"
        );
        _;
    }
    // Only the buyer of a token can receive its generated MediaData and BidShares before minting
    modifier onlyBuyer(uint256 _tokenId) {
        require(buyerToToken[msg.sender] == _tokenId);
        _;
    }

    // ============ Constructor ============
    constructor() {
        _owner = msg.sender;
    }

    // ============ Collection Methods ============

    /**
     * Enables an NFT owner to create a collection, specifying parameters
     * @param _supply number of NFTs to create as part of the collection
     * @param _price price to set for each NFT
     * @param _creator address to receive funds
     * @param _tokenId id of media owned on Zora to create collection for
     */
    function createCollection(
        uint256 _supply,
        uint256 _price,
        address payable _creator,
        uint256 _tokenId
    ) public onlyCreator(_tokenId) {
        collections[nextCollectionId] = Collection({
            supply: _supply,
            price: _price,
            creator: _creator,
            tokenId: _tokenId,
            sold: 0
        });

        emit CollectionCreated(
            nextCollectionId,
            _tokenId,
            _creator,
            _supply,
            _price
        );

        nextCollectionId++;
    }

    /**
     * Enables anyone to own a piece of a collection, specifying parameter
     * @param _collectionId id of collection to purchase a piece of
     */
    function buyCollection(uint256 _collectionId) external payable {
        require(
            collections[_collectionId].supply > 0,
            "Collection does not exist."
        );
        require(
            collections[_collectionId].sold < collections[_collectionId].supply,
            "Collection sold out :("
        );
        require(
            msg.value == collections[_collectionId].price,
            "Must send enough to purchase from this collection."
        );
        uint256 tokenId = collections[_collectionId].tokenId;

        // Generate and store token's MediaData for buyer to mint
        _storeMediaData(tokenId, _collectionId);
        // Store token's BidShares for buyer to mint
        _storeBidShares(tokenId);

        // Store buyer as owner of this token
        buyerToToken[msg.sender] = nextGlobalToken;

        emit CollectionPurchased(_collectionId, msg.sender, nextGlobalToken);

        collections[_collectionId].sold++;
        nextGlobalToken++;
    }

    /**
     * Provides buyer MediaData to mint a token purchased from a collection , specifying parameter
     * @param _tokenId id of the token purchased
     */
    function collectionMediaData(uint256 _tokenId)
        public
        view
        onlyBuyer(_tokenId)
        returns (Media.MediaData memory)
    {
        return tokenToMediaData[_tokenId];
    }

    /**
     * Provides buyer BidShares to mint a token purchased from a collection, specifying parameter
     * @param _tokenId id of the token purchased
     */
    function collectionBidShares(uint256 _tokenId)
        public
        view
        onlyBuyer(_tokenId)
        returns (Market.BidShares memory)
    {
        return tokenToBidShares[_tokenId];
    }

    // ============ Operational Methods ============

    /**
     * Enables creator to withdraw funds received for a collection at any time, specifying parameter
     * @param _collectionId id of collection to withdraw funds from
     */
    function withdrawFunds(uint256 _collectionId) external {
        uint256 amountRemaining = (collections[_collectionId].price *
            collections[_collectionId].sold) -
            amountWithdrawnToCreator[_collectionId];

        amountWithdrawnToCreator[_collectionId] += amountRemaining;
        _sendFunds(collections[_collectionId].creator, amountRemaining);
    }

    function setMediaAddress(address _address) external onlyContractOwner {
        mediaContract = _address;
    }

    function setMarketAddress(address _address) external onlyContractOwner {
        marketContract = _address;
    }

    // ============ Private Methods ============
    function _storeMediaData(uint256 _tokenId, uint256 _collectionId) private {
        // Get collection's token uri
        string memory tokenURI = Media(mediaContract).tokenURI(_tokenId);
        // Get collection's token metadata uri
        string memory tokenMetadataURI = Media(mediaContract).tokenMetadataURI(
            _tokenId
        );
        // Get collection's token metadata hash
        bytes32 tokenMetadataHash = Media(mediaContract).tokenMetadataHashes(
            _tokenId
        );
        // Generate new content hash for token to mint
        bytes32 newContentHash = keccak256(
            // Hash of collection's token id + current amount sold counter + current time
            abi.encode(
                _tokenId,
                collections[_collectionId].sold,
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

        // Store MediaData for buyer
        tokenToMediaData[nextGlobalToken] = mediaData;
    }

    function _storeBidShares(uint256 _tokenId) private {
        // Get BidShares from collection's token id
        Market.BidShares memory bidShares = Market(marketContract)
            .bidSharesForToken(_tokenId);

        // Store BidShares for buyer
        tokenToBidShares[nextGlobalToken] = bidShares;
    }

    function _sendFunds(address payable _creator, uint256 _amount) private {
        require(
            address(this).balance >= _amount,
            "Insufficient balance to send"
        );

        (bool success, ) = _creator.call{value: _amount}("");
        require(success, "Unable to send: creator may have reverted");
    }
}
