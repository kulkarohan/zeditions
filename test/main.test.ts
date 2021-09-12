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
    BUYER: process.env.BUYER_KEY
}

let CreatorWallet: Wallet = new Wallet(KEYS.CREATOR, PROVIDER)
let BuyerWallet: Wallet = new Wallet(KEYS.BUYER, PROVIDER)

let ContractReadOnly: Contract
let ContractForCreator: Contract
let ContractForBuyer: Contract

async function deploy(): Promise<void> {
    const signer = new ethers.Wallet(KEYS.DEPLOYER, PROVIDER)

    const Zeditions = await ethers.getContractFactory('Zeditions')
    const contractWithSigner = Zeditions.connect(signer)
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

describe('Zeditions', () => {
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
    describe('Edition creation', () => {
        const sampleEdition = {
            supply: 1,
            price: ethers.utils.parseEther('0.5'),
            fundsAddress: ethers.utils.getAddress(
                '0xa3c784F717EFa8d3A44DF80A5d33E734F5c1A7Ee'
            ),
            zMediaId: 0 // id of token minted on Zora
        }
        it('Should allow a creator to create a edition of their owned NFT', async () => {
            const tx = await ContractForCreator.createEdition(
                sampleEdition.supply,
                sampleEdition.price,
                sampleEdition.fundsAddress,
                sampleEdition.zMediaId
            )
            const editionCreated = await ContractReadOnly.editions(1)

            expect(editionCreated.supply).to.equal(sampleEdition.supply)
            expect(editionCreated.price).to.equal(sampleEdition.price)
            expect(editionCreated.fundsAddress).to.equal(sampleEdition.fundsAddress)
            expect(editionCreated.zMediaId).to.equal(sampleEdition.zMediaId)
        })
        it('Should prevent a buyer from creating a edition of an NFT they do not own', async () => {
            expect(
                ContractForBuyer.createEdition(
                    sampleEdition.supply,
                    sampleEdition.price,
                    sampleEdition.fundsAddress,
                    sampleEdition.zMediaId
                )
            ).to.be.revertedWith('You do not own this token')
        })
    })
    describe('Edition buying', () => {
        const sampleEdition = {
            supply: 1,
            price: ethers.utils.parseEther('0.5'),
            fundsAddress: ethers.utils.getAddress(
                '0xa3c784F717EFa8d3A44DF80A5d33E734F5c1A7Ee'
            ),
            zMediaId: 0
        }
        it('Should allow buying from edition with supply remaining', async () => {
            const tx = await ContractForCreator.createEdition(
                sampleEdition.supply,
                sampleEdition.price,
                sampleEdition.fundsAddress,
                sampleEdition.zMediaId
            )

            await expect(
                await ContractForBuyer.buyEdition(1, {
                    value: ethers.utils.parseEther('0.5')
                })
            ).to.emit(ContractForBuyer, 'EditionPurchased')
        })
        it('Should prevent buying from edition that does not exist', async () => {
            expect(
                ContractForBuyer.buyEdition(2, {
                    value: ethers.utils.parseEther('0.5')
                })
            ).to.be.revertedWith('Edition does not exist.')
        })
        it('Should prevent buying from edition that has run out', async () => {
            const tx = await ContractForCreator.createEdition(
                sampleEdition.supply,
                sampleEdition.price,
                sampleEdition.fundsAddress,
                sampleEdition.zMediaId
            )
            const soldOut = await ContractForBuyer.buyEdition(1, {
                value: ethers.utils.parseEther('0.5')
            })

            expect(
                ContractForBuyer.buyEdition(1, {
                    value: ethers.utils.parseEther('0.5')
                })
            ).to.be.revertedWith('Edition sold out :(')
        })
        it('Should prevent buying from edition with insufficient funds', async () => {
            const tx = await ContractForCreator.createEdition(
                sampleEdition.supply,
                sampleEdition.price,
                sampleEdition.fundsAddress,
                sampleEdition.zMediaId
            )
            expect(
                ContractForBuyer.buyEdition(1, {
                    value: ethers.utils.parseEther('0.33')
                })
            ).to.be.revertedWith('Must send enough to purchase from this edition.')
        })
    })

    describe('Edition minting', () => {
        const sampleEdition = {
            supply: 10,
            price: ethers.utils.parseEther('0.5'),
            fundsAddress: ethers.utils.getAddress(
                '0xa3c784F717EFa8d3A44DF80A5d33E734F5c1A7Ee'
            ),
            zMediaId: 0
        }
        it('Should allow receiving the BidShares of a token purchased', async () => {
            const tx = await ContractForCreator.createEdition(
                sampleEdition.supply,
                sampleEdition.price,
                sampleEdition.fundsAddress,
                sampleEdition.zMediaId
            )
            const bought = await ContractForBuyer.buyEdition(1, {
                value: ethers.utils.parseEther('0.5')
            })
            const bidShares = await ContractForBuyer.editionBidShares(1)

            expect(bidShares).to.have.property('prevOwner')
            expect(bidShares).to.have.property('creator')
            expect(bidShares).to.have.property('owner')
        })
        it('Should prevent receiving the BidShares of a token not purchased', async () => {
            const tx = await ContractForCreator.createEdition(
                sampleEdition.supply,
                sampleEdition.price,
                sampleEdition.fundsAddress,
                sampleEdition.zMediaId
            )
            const bought = await ContractForBuyer.buyEdition(1, {
                value: ethers.utils.parseEther('0.5')
            })
            expect(ContractReadOnly.editionBidShares(1)).to.be.revertedWith(
                'You did not purchase this token.'
            )
        })
        it('Should allow receiving the MediaData of a token purchased', async () => {
            const tx = await ContractForCreator.createEdition(
                sampleEdition.supply,
                sampleEdition.price,
                sampleEdition.fundsAddress,
                sampleEdition.zMediaId
            )
            const bought = await ContractForBuyer.buyEdition(1, {
                value: ethers.utils.parseEther('0.5')
            })
            const mediaData = await ContractForBuyer.editionMediaData(1)

            expect(mediaData).to.have.property('tokenURI')
            expect(mediaData).to.have.property('metadataURI')
            expect(mediaData).to.have.property('contentHash')
            expect(mediaData).to.have.property('metadataHash')
        })
        it('Should prevent receiving the MediaData of a token not purchased', async () => {
            const tx = await ContractForCreator.createEdition(
                sampleEdition.supply,
                sampleEdition.price,
                sampleEdition.fundsAddress,
                sampleEdition.zMediaId
            )
            const bought = await ContractForBuyer.buyEdition(1, {
                value: ethers.utils.parseEther('0.5')
            })
            expect(ContractReadOnly.editionMediaData(1)).to.be.revertedWith(
                'You did not purchase this token.'
            )
        })
    })
})
