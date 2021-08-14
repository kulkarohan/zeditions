# Zora Collections v1

[Mirror-style Editions](https://dev.mirror.xyz/AOoIsKPfZvf8LACKWp7gj_mg1ICCDOfPnVBOsDQoXo8) natively on Zora.

## Creator Flow
1) Creator mints a 1/1 NFT on Zora <br>
2) Creator calls `createCollection`, specifying:
- **_supply_** - number of NFTs to create for the collection
- **_price_** - price per NFT
- **_address_** - address creator wants funds to be sent to
- **_tokenId_** - Zora token id of minted 1/1 NFT underlying the collection

```typescript
import { Zora, createCollection, withdrawFunds } from '@zoralabs/zdk'
import { Wallet } from 'ethers'

// AFTER MINTING A 1/1 //

const wallet = new Wallet(privateKeyOfAddressHoldingTheMintedNFT, provider)
const zora = new Zora(wallet, 4)

const collection = createCollection(
  supply, // number of NFTs to create
  price, // price per NFT
  fundsAddress, // address to send funds
  tokenId // token id of minted NFT
)

// Collection is now active for anyone to purchase from until supply is sold out
zora.deployCollection(collection)

// At any time the creator can withdraw money raised
zora.withdrawFunds(collectionId)

```

## Buyer Flow
1) Buyer calls `buyCollection`, specifying:
- **_collectionId_** -- id of collection
- **_msg.value_** -- price of NFT set by creator <br>
2) Buyer calls `collectionMediaData` and `collectionBidShares`, specifying:
- **_tokenId_** -- id of token purchased from collection
3) Buyer mints token on Zora, using generated MediaData and BidShares set by collection creator

```typescript
import { Zora, createCollection, withdrawFunds } from '@zoralabs/zdk'
import { Wallet } from 'ethers'

const wallet = Wallet.createRandom()
const zora = new Zora(wallet, 4)

// Buyer purchases from an active collection and is provided a token id
zora.buyCollection(collectionId, {
  value: price
})

// Buyer uses the token id to access its MediaData and BidShares provided by the contract
const mediaData = zora.collectionMediaData(tokenId)
const bidShares = zora.collectionBidShares(tokenId)

// Buyer mints their ownership of a collection into a token on Zora
const tx = await zora.mint(mediaData, bidShares)
await tx.wait(8)
```
<br>

**Note:** With this implementation, the BidShares and MediaData properties (except for content hash) are mapped from the original 1/1 onto each token in the collection. A unique content hash is generated for each token by the contract.

**Goal w/ Zora protocol v2:** Eliminate the need for buyer to mint a purchased token. A better experience would be if the contract can mint for them and send to a specified address.
