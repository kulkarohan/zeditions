import { ethers } from 'hardhat'

async function main() {
    const [owner] = await ethers.getSigners()

    console.log('\nDeploying contracts with the account:', owner.address)
    console.log('Account balance:', (await owner.getBalance()).toString())

    const Zeditions = await ethers.getContractFactory('Zeditions')
    const zeditions = await Zeditions.deploy()
    await zeditions.deployed()

    console.log(`Zeditions Contract deployed at: ${zeditions.address}`)
    console.log(`Zeditions Contract signed by: ${zeditions.signer.getAddress()}\n`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
