const { ethers } = require("hardhat")

async function main() {
  const network = await ethers.provider.getNetwork()
  const hre = require("hardhat")
  console.log("Deploying CryptoGame contract...")

  // Get the ContractFactory and Signers
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with account:", deployer.address)
  console.log("Account balance:", (await deployer.getBalance()).toString())

  // Deploy the contract
  const CryptoGame = await ethers.getContractFactory("CryptoGame")
  const cryptoGame = await CryptoGame.deploy()

  await cryptoGame.deployed()

  console.log("CryptoGame deployed to:", cryptoGame.address)
  console.log("Transaction hash:", cryptoGame.deployTransaction.hash)

  // Verify contract on Etherscan (if not local network)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...")
    await cryptoGame.deployTransaction.wait(6)

    console.log("Verifying contract on Etherscan...")
    try {
      await hre.run("verify:verify", {
        address: cryptoGame.address,
        constructorArguments: [],
      })
    } catch (error) {
      console.log("Verification failed:", error.message)
    }
  }

  // Save deployment info
  const fs = require("fs")
  const deploymentInfo = {
    address: cryptoGame.address,
    network: network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: cryptoGame.deployTransaction.hash,
  }

  fs.writeFileSync(`deployments/${network.name}.json`, JSON.stringify(deploymentInfo, null, 2))

  console.log("Deployment info saved to deployments/" + network.name + ".json")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
