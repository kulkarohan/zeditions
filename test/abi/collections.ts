export const CollectionsABI = [
    {
        inputs: [],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint256',
                name: 'collectionId',
                type: 'uint256',
            },
            {
                indexed: true,
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'creator',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'supply',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'price',
                type: 'uint256',
            },
        ],
        name: 'CollectionCreated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint256',
                name: 'collectionId',
                type: 'uint256',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'buyer',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'sold',
                type: 'uint256',
            },
        ],
        name: 'CollectionPurchased',
        type: 'event',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: 'amountWithdrawnToCreator',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_collectionId',
                type: 'uint256',
            },
        ],
        name: 'buyCollection',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        name: 'buyerToToken',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_tokenId',
                type: 'uint256',
            },
        ],
        name: 'collectionBidShares',
        outputs: [
            {
                components: [
                    {
                        components: [
                            {
                                internalType: 'uint256',
                                name: 'value',
                                type: 'uint256',
                            },
                        ],
                        internalType: 'struct Decimal.D256',
                        name: 'prevOwner',
                        type: 'tuple',
                    },
                    {
                        components: [
                            {
                                internalType: 'uint256',
                                name: 'value',
                                type: 'uint256',
                            },
                        ],
                        internalType: 'struct Decimal.D256',
                        name: 'creator',
                        type: 'tuple',
                    },
                    {
                        components: [
                            {
                                internalType: 'uint256',
                                name: 'value',
                                type: 'uint256',
                            },
                        ],
                        internalType: 'struct Decimal.D256',
                        name: 'owner',
                        type: 'tuple',
                    },
                ],
                internalType: 'struct Market.BidShares',
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_tokenId',
                type: 'uint256',
            },
        ],
        name: 'collectionMediaData',
        outputs: [
            {
                components: [
                    {
                        internalType: 'string',
                        name: 'tokenURI',
                        type: 'string',
                    },
                    {
                        internalType: 'string',
                        name: 'metadataURI',
                        type: 'string',
                    },
                    {
                        internalType: 'bytes32',
                        name: 'contentHash',
                        type: 'bytes32',
                    },
                    {
                        internalType: 'bytes32',
                        name: 'metadataHash',
                        type: 'bytes32',
                    },
                ],
                internalType: 'struct Media.MediaData',
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: 'collections',
        outputs: [
            {
                internalType: 'uint256',
                name: 'supply',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'price',
                type: 'uint256',
            },
            {
                internalType: 'address payable',
                name: 'creator',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'tokenId',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'sold',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_supply',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_price',
                type: 'uint256',
            },
            {
                internalType: 'address payable',
                name: '_creator',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_tokenId',
                type: 'uint256',
            },
        ],
        name: 'createCollection',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'marketContract',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'mediaContract',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_address',
                type: 'address',
            },
        ],
        name: 'setMarketAddress',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_address',
                type: 'address',
            },
        ],
        name: 'setMediaAddress',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_collectionId',
                type: 'uint256',
            },
        ],
        name: 'withdrawFunds',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
]
