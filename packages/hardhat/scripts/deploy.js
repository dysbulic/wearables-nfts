const fs = require('fs')
const chalk = require('chalk')
const { config, ethers, tenderly, run } = require('hardhat')
const { utils } = require('ethers')
const R = require('ramda')

const main = async () => {
  console.log('\n\n 📡 Deploying...\n')
  console.debug({ config })

  const yourContract = await deploy('WearablesNFTs') // <-- add in constructor args like line 19 vvvv

  //const yourContract = await ethers.getContractAt('YourContract', '0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A') //<-- if you want to instantiate a version of a contract at a specific address!
  //const secondContract = await deploy('SecondContract')

  // const exampleToken = await deploy('ExampleToken')
  // const examplePriceOracle = await deploy('ExamplePriceOracle')
  // const smartContractWallet = await deploy('SmartContractWallet',[exampleToken.address,examplePriceOracle.address])

  /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: '0x34aA3F359A9D614239015126635CE7732c18fDF3',
    value: ethers.utils.parseEther('0.001')
  })
  */


  /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const yourContract = await deploy('YourContract', [], {
  value: ethers.utils.parseEther('0.05')
  });
  */


  /*
  //If you want to link a library into your contract:
  // reference: https://github.com/austintgriffith/scaffold-eth/blob/using-libraries-example/packages/hardhat/scripts/deploy.js#L19
  const yourContract = await deploy('YourContract', [], {}, {
   LibraryName: **LibraryAddress**
  });
  */


  //If you want to verify your contract on tenderly.co (see setup details in the scaffold-eth README!)
  /*
  await tenderlyVerify(
    {contractName: 'YourContract',
     contractAddress: yourContract.address
  })
  */

  // If you want to verify your contract on etherscan
  /*
  console.log(chalk.blue('verifying on etherscan'))
  await run('verify:verify', {
    address: yourContract.address,
    // constructorArguments: args // If your contract has constructor arguments, you can pass them as an array
  })
  */

  console.log(
    ' 💾  Artifacts (address, abi, and args) saved to:'
    + chalk.blue(__dirname)
    + "\n\n"
  )
}

const fileTemplates = {
  address: 'artifacts/{contract}.address',
  args: 'artifacts/{contract}.args',
}

const deploy = async (contract, _args = [], overrides = {}, libraries = {}) => {
  const files = Object.fromEntries(
    Object.entries(fileTemplates), (([name, template]) => [
      name,
      template.replace(/\{contract\}/g, contract)
    ])
  )

  console.log(` 🛰  Deploying: ${contract}`)

  const args = _args ?? []
  const artifacts = await ethers.getContractFactory(
    contract, { libraries }
  )
  const deployed = await artifacts.deploy(...args, overrides)

  console.debug({ deployed })

  const {
    address,
    signer: { address: signer },
    deployTransaction: { gasPrice, hash: tx, chainId: chain },
  } = deployed
  console.log(
    ` 📄 ${chalk.cyan(contract)},`
    + ` deployed to ${chalk.magenta(address)}`
    + ` by ${chalk.bgGreen(signer)}`
    + ` on chain ${chalk.yellow(`#${chain}`)}`
    + ` ${chalk.green(`(saved to ${files.address})`)}.`
  )
  fs.writeFileSync(files.address, deployed.address)

  let gasInfo = '𐌵ⲛⲕⲛⲟⲱⲛ'
  if(deployed?.deployTransaction) {
    const gasUsed = (
      deployed.deployTransaction.gasLimit.mul(gasPrice)
    )
    gasInfo = (
      `${utils.formatEther(gasUsed)} ETH, TX Hash: ${tx}`
    )
  }

  console.log(` ⛽ ${chalk.grey(gasInfo)}`)

  await tenderly.persistArtifacts({
    name: contract,
    address,
  })

  const encoded = abiEncodeArgs(deployed, args)

  if (encoded.length > 2) {
    console.log(
      ` 📚 Serializing ${encoded.length}`
      + ` arguments to ${chalk.blue(files.args)}.`
    )
    fs.writeFileSync(files.args, encoded.slice(2))
  }

  const verification = tenderlyVerify({ contract, address })
  console.debug({ verification })

  return deployed
}

// ------ utils -------

// abi encodes contract arguments
// useful when you want to manually verify the contracts
// for example, on Etherscan
const abiEncodeArgs = (deployed, args) => {
  // not writing abi encoded args if this does not pass
  if (
    args
    && deployed
    && R.hasPath(['interface', 'deploy'], deployed)
  ) {
    return (
      utils.defaultAbiCoder.encode(
        deployed.interface.deploy.inputs, args
      )
    )
  }
}

// checks if it is a Solidity file
const isSolidity = (filename) => (
  /\.(sol|swp|swap)$/i.test(filename)
)

const sleep = (ms) => (
  new Promise(resolve => setTimeout(resolve, ms))
)

// If you want to verify on https://tenderly.co/
const tenderlyVerify = async ({
  contract: name, address, network = null,
}) => {
  let tenderlyNetworks = [
    'kovan', 'goerli', 'mainnet', 'rinkeby', 'ropsten',
    'matic', 'mumbai', 'xDai', 'POA',
  ]
  network ??= (
    process.env.HARDHAT_NETWORK ?? config.defaultNetwork
  )

  if(!tenderlyNetworks.includes(network)) {
    console.error(chalk.grey(
      ` 🧐 Contract verification not supported`
      + ` on ${chalk.blue(network)}.`
    ))
  } else {
    console.log(
      ' 📁 Attempting tenderly verification of'
      + `${chalk.blue(name)} on`
      + ` ${chalk.green(network)}.`
    )

    await tenderly.persistArtifacts({ name, address })

    return (
      tenderly.verify({
        name, address, network
      })
    )
  }
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error({ error })
  process.exit(-1)
})
