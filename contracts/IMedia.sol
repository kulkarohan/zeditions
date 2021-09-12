// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.7;

import {IMarket} from "./IMarket.sol";

interface IMedia {
    struct EIP712Signature {
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct MediaData {
        // A valid URI of the content represented by this token
        string tokenURI;
        // A valid URI of the metadata associated with this token
        string metadataURI;
        // A SHA256 hash of the content pointed to by tokenURI
        bytes32 contentHash;
        // A SHA256 hash of the content pointed to by metadataURI
        bytes32 metadataHash;
    }

    function tokenCreators(uint256 tokenId) external view returns (address);

    function tokenURI(uint256 tokenId) external view returns (string memory);

    function mintWithSigNonces(address creator) external view returns (uint256);

    function tokenMetadataURI(uint256 tokenId)
        external
        view
        returns (string memory);

    function tokenMetadataHashes(uint256 tokenId)
        external
        view
        returns (bytes32);

    function tokenContentHashes(uint256 tokenId)
        external
        view
        returns (bytes32);

    function mint(MediaData calldata data, IMarket.BidShares calldata bidShares)
        external;

    function mintWithSig(
        address creator,
        MediaData calldata data,
        IMarket.BidShares calldata bidShares,
        EIP712Signature calldata sig
    ) external;
}
