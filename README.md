# Zora Collections [WIP]

An attempt to bring [Mirror-style Editions](https://dev.mirror.xyz/AOoIsKPfZvf8LACKWp7gj_mg1ICCDOfPnVBOsDQoXo8) natively on Zora.

## Creator Flow
1) Creator mints a 1/1 NFT on Zora <br>
2) Creator calls `createCollection`, specifying:
- **_supply_** -- number of NFTs to create for the collection
- **_price_** -- price per NFT
- **_tokenId_** -- Zora token id of minted 1/1 NFT underlying the collection
- **_address_** -- address creator wants funds to be sent to

## Buyer Flow
1) Buyer calls `buyCollection`, specifying:
- **_collectionId_** -- id of collection
- **_msg.value_** -- price of NFT set by creator <br>
~~2) Buyer waits shortly for a token to be minted on Zora and sent to their address~~
2) Buyer calls `collectionMediaData` and `collectionBidShares`, specifying:
- **_tokenId_** -- id of token purchased from collection
3) Buyer mints token on Zora, using generated MediaData and BidShares set by collection creator

