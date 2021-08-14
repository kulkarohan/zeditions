import chai, { expect } from 'chai'
import asPromised from 'chai-as-promised'
import { ethers } from 'hardhat'
import { Contract, Wallet } from 'ethers'
import * as dotenv from 'dotenv'

chai.use(asPromised)
dotenv.config()

const LOCAL_MEDIA_ADDRESS = process.env.LOCAL_MEDIA_ADDRESS
const LOCAL_MARKET_ADDRESS = process.env.LOCAL_MARKET_ADDRESS

const LOCAL_DEPLOY = process.env.LOCAL_DEPLOY
const PROVIDER = new ethers.providers.JsonRpcProvider(LOCAL_DEPLOY)

const KEYS: Record<string, string> = {
    DEPLOYER: process.env.DEPLOYER_KEY,
    CREATOR: process.env.CREATOR_KEY,
    BUYER: process.env.BUYER_KEY,
}

let CreatorWallet: Wallet = new Wallet(KEYS.CREATOR, PROVIDER)
let BuyerWallet: Wallet = new Wallet(KEYS.BUYER, PROVIDER)

let ContractReadOnly: Contract
let ContractForCreator: Contract
let ContractForBuyer: Contract

async function deploy(): Promise<void> {
    const signer = new ethers.Wallet(KEYS.DEPLOYER, PROVIDER)

    const Collections = await ethers.getContractFactory('Collections')
    const contractWithSigner = Collections.connect(signer)
    const contract = await contractWithSigner.deploy()
    await contract.deployed()

    await contract.setMediaAddress(LOCAL_MEDIA_ADDRESS)
    await contract.setMarketAddress(LOCAL_MARKET_ADDRESS)

    const abi = contract.interface
    const address = contract.address.toString()

    ContractReadOnly = new ethers.Contract(address, abi, PROVIDER)
    ContractForCreator = new ethers.Contract(address, abi, CreatorWallet)
    ContractForBuyer = new ethers.Contract(address, abi, BuyerWallet)
}

describe('Collections', () => {
    beforeEach(async () => {
        await deploy()
    })
    describe('Address configuration', () => {
        it('Should ensure Zora media address is configured correctly', async () => {
            const mediaContract = await ContractReadOnly.mediaContract()
            expect(mediaContract).to.equal(LOCAL_MEDIA_ADDRESS)
        })
        it('Should ensure Zora market address is configured correctly', async () => {
            const marketContract = await ContractReadOnly.marketContract()
            expect(marketContract).to.equal(LOCAL_MARKET_ADDRESS)
        })
    })
    describe('Collection creation', () => {
        const sampleCollection = {
            supply: 1,
            price: ethers.utils.parseEther('0.5'),
            fundsAddress: ethers.utils.getAddress(
                '0xa3c784F717EFa8d3A44DF80A5d33E734F5c1A7Ee'
            ),
            zMediaId: 0, // id of token minted on Zora
        }
        it('Should allow a creator to create a collection of their owned NFT', async () => {
            const tx = await ContractForCreator.createCollection(
                sampleCollection.supply,
                sampleCollection.price,
                sampleCollection.fundsAddress,
                sampleCollection.zMediaId
            )
            const collectionCreated = await ContractReadOnly.collections(1)

            expect(collectionCreated.supply).to.equal(sampleCollection.supply)
            expect(collectionCreated.price).to.equal(sampleCollection.price)
            expect(collectionCreated.fundsAddress).to.equal(
                sampleCollection.fundsAddress
            )
            expect(collectionCreated.zMediaId).to.equal(
                sampleCollection.zMediaId
            )
        })
        it('Should prevent a buyer from creating a collection of an NFT they do not own', async () => {
            expect(
                ContractForBuyer.createCollection(
                    sampleCollection.supply,
                    sampleCollection.price,
                    sampleCollection.fundsAddress,
                    sampleCollection.zMediaId
                )
            ).to.be.revertedWith('You do not own this token')
        })
    })
    describe('Collection buying', () => {
        const sampleCollection = {
            supply: 1,
            price: ethers.utils.parseEther('0.5'),
            fundsAddress: ethers.utils.getAddress(
                '0xa3c784F717EFa8d3A44DF80A5d33E734F5c1A7Ee'
            ),
            zMediaId: 0,
        }
        it('Should allow buying from collection with supply remaining', async () => {
            const tx = await ContractForCreator.createCollection(
                sampleCollection.supply,
                sampleCollection.price,
                sampleCollection.fundsAddress,
                sampleCollection.zMediaId
            )

            await expect(
                await ContractForBuyer.buyCollection(1, {
                    value: ethers.utils.parseEther('0.5'),
                })
            ).to.emit(ContractForBuyer, 'CollectionPurchased')
        })
        it('Should prevent buying from collection that does not exist', async () => {
            expect(
                ContractForBuyer.buyCollection(2, {
                    value: ethers.utils.parseEther('0.5'),
                })
            ).to.be.revertedWith('Collection does not exist.')
        })
        it('Should prevent buying from collection that has run out', async () => {
            const tx = await ContractForCreator.createCollection(
                sampleCollection.supply,
                sampleCollection.price,
                sampleCollection.fundsAddress,
                sampleCollection.zMediaId
            )
            const soldOut = await ContractForBuyer.buyCollection(1, {
                value: ethers.utils.parseEther('0.5'),
            })

            expect(
                ContractForBuyer.buyCollection(1, {
                    value: ethers.utils.parseEther('0.5'),
                })
            ).to.be.revertedWith('Collection sold out :(')
        })
        it('Should prevent buying from collection with insufficient funds', async () => {
            const tx = await ContractForCreator.createCollection(
                sampleCollection.supply,
                sampleCollection.price,
                sampleCollection.fundsAddress,
                sampleCollection.zMediaId
            )
            expect(
                ContractForBuyer.buyCollection(1, {
                    value: ethers.utils.parseEther('0.33'),
                })
            ).to.be.revertedWith(
                'Must send enough to purchase from this collection.'
            )
        })
    })

    describe('Collection minting', () => {
        const sampleCollection = {
            supply: 10,
            price: ethers.utils.parseEther('0.5'),
            fundsAddress: ethers.utils.getAddress(
                '0xa3c784F717EFa8d3A44DF80A5d33E734F5c1A7Ee'
            ),
            zMediaId: 0,
        }
        it('Should allow receiving the BidShares of a token purchased', async () => {
            const tx = await ContractForCreator.createCollection(
                sampleCollection.supply,
                sampleCollection.price,
                sampleCollection.fundsAddress,
                sampleCollection.zMediaId
            )
            const bought = await ContractForBuyer.buyCollection(1, {
                value: ethers.utils.parseEther('0.5'),
            })
            const bidShares = await ContractForBuyer.collectionBidShares(1)

            expect(bidShares).to.have.property('prevOwner')
            expect(bidShares).to.have.property('creator')
            expect(bidShares).to.have.property('owner')
        })
        it('Should prevent receiving the BidShares of a token not purchased', async () => {
            const tx = await ContractForCreator.createCollection(
                sampleCollection.supply,
                sampleCollection.price,
                sampleCollection.fundsAddress,
                sampleCollection.zMediaId
            )
            const bought = await ContractForBuyer.buyCollection(1, {
                value: ethers.utils.parseEther('0.5'),
            })
            expect(ContractReadOnly.collectionBidShares(1)).to.be.revertedWith(
                'You did not purchase this token.'
            )
        })
        it('Should allow receiving the MediaData of a token purchased', async () => {
            const tx = await ContractForCreator.createCollection(
                sampleCollection.supply,
                sampleCollection.price,
                sampleCollection.fundsAddress,
                sampleCollection.zMediaId
            )
            const bought = await ContractForBuyer.buyCollection(1, {
                value: ethers.utils.parseEther('0.5'),
            })
            const mediaData = await ContractForBuyer.collectionMediaData(1)

            expect(mediaData).to.have.property('tokenURI')
            expect(mediaData).to.have.property('metadataURI')
            expect(mediaData).to.have.property('contentHash')
            expect(mediaData).to.have.property('metadataHash')
        })
        it('Should prevent receiving the MediaData of a token not purchased', async () => {
            const tx = await ContractForCreator.createCollection(
                sampleCollection.supply,
                sampleCollection.price,
                sampleCollection.fundsAddress,
                sampleCollection.zMediaId
            )
            const bought = await ContractForBuyer.buyCollection(1, {
                value: ethers.utils.parseEther('0.5'),
            })
            expect(ContractReadOnly.collectionMediaData(1)).to.be.revertedWith(
                'You did not purchase this token.'
            )
        })
    })
})
