import { ethers } from 'hardhat'

async function main() {
    const [owner] = await ethers.getSigners()

    console.log('\nDeploying contracts with the account:', owner.address)
    console.log('Account balance:', (await owner.getBalance()).toString())

    const Collections = await ethers.getContractFactory('Collections')
    const collections = await Collections.deploy()
    await collections.deployed()

    console.log(`\nCollections Contract deployed at: ${collections.address}`)
    console.log(
        `Collections Contract signed by: ${collections.signer.getAddress()}\n`
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
