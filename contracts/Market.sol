// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

import {Decimal} from "./Decimal.sol";

interface Market {
    struct BidShares {
        // % of sale value that goes to the _previous_ owner of the nft
        Decimal.D256 prevOwner;
        // % of sale value that goes to the original creator of the nft
        Decimal.D256 creator;
        // % of sale value that goes to the seller (current owner) of the nft
        Decimal.D256 owner;
    }

    function bidSharesForToken(uint256 tokenId)
        external
        view
        returns (BidShares memory);
}
