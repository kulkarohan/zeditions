import { expect } from 'chai'
import { ethers } from 'hardhat'
import { BigNumber, Contract, Wallet, Signer, Transaction } from 'ethers'
import * as dotenv from 'dotenv'
import { CollectionsABI } from './abi/collections'

dotenv.config()

const LOCAL_DEPLOY = process.env.LOCAL_DEPLOY
const PROVIDER = new ethers.providers.JsonRpcProvider(LOCAL_DEPLOY)

const ADDRESSES: Record<string, string> = {
    DEPLOYER: process.env.DEPLOYER_KEY,
    CREATOR: process.env.CREATOR_KEY,
    BUYER: process.env.BUYER_KEY,
}

let CollectionsContract: Contract
let CollectionsContractAddress: string

let WalletCreator: Wallet
let WalletBuyer: Wallet

let ContractCreator: Contract
let ContractBuyer: Contract

async function deploy(): Promise<void> {
    const signer = new ethers.Wallet(ADDRESSES.DEPLOYER, PROVIDER)

    const Collections = await ethers.getContractFactory('Collections')
    const contractWithSigner = Collections.connect(signer)
    const contract = await contractWithSigner.deploy()
    await contract.deployed()

    CollectionsContract = contract
    CollectionsContractAddress = contract.address.toString()

    WalletCreator = new Wallet(ADDRESSES.CREATOR, PROVIDER)
    ContractCreator = CollectionsContract.connect(WalletCreator)

    WalletBuyer = new Wallet(ADDRESSES.BUYER, PROVIDER)
    ContractBuyer = CollectionsContract.connect(WalletBuyer)
}

describe('Collections', () => {
    beforeEach(async () => {
        await deploy()
    })
    describe('Collection creation', () => {
        const collectionSupply = 10
        const pricePerNFT = '0.5'
        const creatorAddressToPay = '0xa3c784F717EFa8d3A44DF80A5d33E734F5c1A7Ee'
        const mintedZoraTokenId = 0

        const sample_collection = {
            supply: collectionSupply,
            price: ethers.utils.parseEther(pricePerNFT),
            creator: ethers.utils.getAddress(creatorAddressToPay),
            tokenId: mintedZoraTokenId,
        }
        it('Should allow creating a collection of an NFT owned', async () => {
            expect(async () => {
                const tx: Transaction = await ContractCreator.createCollection(
                    sample_collection.supply,
                    sample_collection.price,
                    sample_collection.creator,
                    sample_collection.tokenId
                )
            }).to.not.throw()
        })
        it('Should prevent creating a collection of an NFT not owned ', async () => {
            const tx: Transaction = ContractBuyer.createCollection(
                sample_collection.supply,
                sample_collection.price,
                sample_collection.creator,
                sample_collection.tokenId
            )
            await expect(tx).revertedWith('You do not own this token')
        })
    })

    describe('Collection buying', () => {
        it('Should allow buying from collection with supply remaining', async () => {})
        it('Should prevent buying from collection that does not exist', async () => {})
        it('Should prevent buying from collection that has run out', async () => {})
        it('Should prevent buying from collection with insufficient funds', async () => {})
    })

    describe('Collection minting', () => {
        it('Should allow receiving the BidShares of a token purchased', async () => {})
        it('Should prevent receiving the BidShares of a token not purchased', async () => {})
        it('Should allow receiving the MediaData of a token purchased', async () => {})
        it('Should prevent receiving the MediaData of a token not purchased', async () => {})
    })
})
