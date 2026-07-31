import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

import solc from "solc";

import {
  ContractFactory,
  JsonRpcProvider,
  Wallet,
  formatEther,
} from "ethers";

// ======================================================
// TYCON DEPLOYER
// Robinhood Chain Mainnet
// ======================================================

const NETWORK_NAME =
  "Robinhood Chain Mainnet";

const RPC_URL =
  "https://rpc.mainnet.chain.robinhood.com";

const CHAIN_ID =
  4663;

const EXPLORER_URL =
  "https://robinhoodchain.blockscout.com";

// ======================================================
// PATHS
// ======================================================

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

const projectRoot =
  path.resolve(
    __dirname,
    ".."
  );

const contractPath =
  path.join(
    projectRoot,
    "contracts",
    "TyconToken.sol"
  );

// ======================================================
// TERMINAL
// ======================================================

const rl =
  readline.createInterface({
    input:
      process.stdin,

    output:
      process.stdout,
  });

function ask(
  question
) {
  return new Promise(
    (resolve) => {
      rl.question(
        question,
        resolve
      );
    }
  );
}

// ======================================================
// HIDDEN PRIVATE KEY INPUT
//
// IMPORTANT:
//
// Do NOT pause stdin after reading the key.
// We still need readline later for DEPLOY confirmation.
// ======================================================

function askPrivateKey() {
  return new Promise(
    (resolve, reject) => {
      const stdin =
        process.stdin;

      const stdout =
        process.stdout;

      if (
        !stdin.isTTY ||
        typeof stdin.setRawMode !==
          "function"
      ) {
        reject(
          new Error(
            "Hidden private-key input requires an interactive terminal."
          )
        );

        return;
      }

      stdout.write(
        "Enter deployer private key: "
      );

      let value =
        "";

      // Temporarily stop readline from handling
      // the private-key keystrokes.
      rl.pause();

      stdin.setRawMode(
        true
      );

      stdin.resume();

      stdin.setEncoding(
        "utf8"
      );

      const finish =
        () => {
          stdin.removeListener(
            "data",
            onData
          );

          stdin.setRawMode(
            false
          );

          stdout.write(
            "\n"
          );

          // IMPORTANT:
          // Resume readline so ask() works later.
          rl.resume();

          resolve(
            value.trim()
          );
        };

      const onData =
        (key) => {
          // CTRL + C
          if (
            key === "\u0003"
          ) {
            stdin.removeListener(
              "data",
              onData
            );

            stdin.setRawMode(
              false
            );

            stdout.write(
              "\n"
            );

            rl.close();

            process.exit(
              0
            );
          }

          // ENTER
          if (
            key === "\r" ||
            key === "\n"
          ) {
            finish();

            return;
          }

          // BACKSPACE
          if (
            key === "\u007f" ||
            key === "\b"
          ) {
            if (
              value.length > 0
            ) {
              value =
                value.slice(
                  0,
                  -1
                );
            }

            return;
          }

          // Ignore escape/control sequences.
          if (
            key.charCodeAt(0) <
            32
          ) {
            return;
          }

          value +=
            key;
        };

      stdin.on(
        "data",
        onData
      );
    }
  );
}

// ======================================================
// NORMALIZE PRIVATE KEY
// ======================================================

function normalizePrivateKey(
  value
) {
  const trimmed =
    String(
      value
    ).trim();

  if (
    trimmed.startsWith(
      "0x"
    )
  ) {
    return trimmed;
  }

  return `0x${trimmed}`;
}

// ======================================================
// PRIVATE KEY VALIDATION
// ======================================================

function isValidPrivateKey(
  privateKey
) {
  return /^0x[a-fA-F0-9]{64}$/.test(
    privateKey
  );
}

// ======================================================
// COMPILE
// ======================================================

function compileContract() {
  console.log(
    "\nCompiling TyconToken.sol..."
  );

  if (
    !fs.existsSync(
      contractPath
    )
  ) {
    throw new Error(
      `Contract not found: ${contractPath}`
    );
  }

  const source =
    fs.readFileSync(
      contractPath,
      "utf8"
    );

  const input = {
    language:
      "Solidity",

    sources: {
      "TyconToken.sol": {
        content:
          source,
      },
    },

    settings: {
      optimizer: {
        enabled:
          true,

        runs:
          200,
      },

      outputSelection: {
        "*": {
          "*": [
            "abi",
            "evm.bytecode.object",
          ],
        },
      },
    },
  };

  const output =
    JSON.parse(
      solc.compile(
        JSON.stringify(
          input
        )
      )
    );

  if (
    Array.isArray(
      output.errors
    )
  ) {
    const fatalErrors =
      output.errors.filter(
        (error) =>
          error.severity ===
          "error"
      );

    for (
      const error
      of output.errors
    ) {
      console.log(
        error.formattedMessage
      );
    }

    if (
      fatalErrors.length >
      0
    ) {
      throw new Error(
        "Solidity compilation failed."
      );
    }
  }

  const compiled =
    output.contracts[
      "TyconToken.sol"
    ]?.TyconToken;

  if (
    !compiled
  ) {
    throw new Error(
      "Compiled TYCON contract was not found."
    );
  }

  const bytecode =
    compiled.evm
      .bytecode.object;

  if (
    !bytecode
  ) {
    throw new Error(
      "Contract bytecode is empty."
    );
  }

  console.log(
    "Compilation successful."
  );

  return {
    abi:
      compiled.abi,

    bytecode:
      `0x${bytecode}`,
  };
}

// ======================================================
// HEADER
// ======================================================

function printHeader() {
  console.clear();

  console.log(
    "=========================================="
  );

  console.log(
    "          TYCON TOKEN DEPLOYER"
  );

  console.log(
    "=========================================="
  );

  console.log(
    ""
  );

  console.log(
    `Network : ${NETWORK_NAME}`
  );

  console.log(
    `Chain ID: ${CHAIN_ID}`
  );

  console.log(
    "Supply   : 0 TYCON"
  );

  console.log(
    ""
  );

  console.log(
    "WARNING: THIS DEPLOYS TO MAINNET."
  );

  console.log(
    "Deployment will spend real ETH for gas."
  );

  console.log(
    ""
  );
}

// ======================================================
// MAIN
// ======================================================

async function main() {
  printHeader();

  // ====================================================
  // PRIVATE KEY
  // ====================================================

  const rawPrivateKey =
    await askPrivateKey();

  const privateKey =
    normalizePrivateKey(
      rawPrivateKey
    );

  if (
    !isValidPrivateKey(
      privateKey
    )
  ) {
    throw new Error(
      "Invalid private key. Expected 32-byte hex private key."
    );
  }

  // ====================================================
  // PROVIDER
  // ====================================================

  console.log(
    "\nConnecting to Robinhood Chain..."
  );

  const provider =
    new JsonRpcProvider(
      RPC_URL,
      CHAIN_ID
    );

  const network =
    await provider.getNetwork();

  if (
    Number(
      network.chainId
    ) !==
    CHAIN_ID
  ) {
    throw new Error(
      `Wrong network. Expected ${CHAIN_ID}, received ${network.chainId}.`
    );
  }

  // ====================================================
  // WALLET
  // ====================================================

  const wallet =
    new Wallet(
      privateKey,
      provider
    );

  console.log(
    ""
  );

  console.log(
    "Deployer:"
  );

  console.log(
    wallet.address
  );

  const balance =
    await provider.getBalance(
      wallet.address
    );

  console.log(
    ""
  );

  console.log(
    `ETH balance: ${formatEther(
      balance
    )} ETH`
  );

  if (
    balance === 0n
  ) {
    throw new Error(
      "Wallet has no ETH for deployment gas."
    );
  }

  // ====================================================
  // COMPILE
  // ====================================================

  const compiled =
    compileContract();

  const factory =
    new ContractFactory(
      compiled.abi,
      compiled.bytecode,
      wallet
    );

  // ====================================================
  // ESTIMATE
  // ====================================================

  console.log(
    "\nEstimating deployment..."
  );

  const deploymentTx =
    await factory
      .getDeployTransaction();

  const estimatedGas =
    await provider.estimateGas({
      ...deploymentTx,

      from:
        wallet.address,
    });

  const feeData =
    await provider.getFeeData();

  console.log(
    `Estimated gas: ${estimatedGas.toString()}`
  );

  let estimatedCost =
    null;

  if (
    feeData.gasPrice
  ) {
    estimatedCost =
      estimatedGas *
      feeData.gasPrice;

    console.log(
      `Estimated maximum gas cost: ~${formatEther(
        estimatedCost
      )} ETH`
    );

    if (
      balance <
      estimatedCost
    ) {
      throw new Error(
        "Wallet ETH balance is below the estimated deployment gas cost."
      );
    }
  }

  // ====================================================
  // TOKEN INFO
  // ====================================================

  console.log(
    ""
  );

  console.log(
    "Token:"
  );

  console.log(
    "Name    : Mining Tycoon"
  );

  console.log(
    "Symbol  : TYCON"
  );

  console.log(
    "Decimals: 18"
  );

  console.log(
    "Supply  : 0"
  );

  console.log(
    ""
  );

  // ====================================================
  // MAINNET CONFIRMATION
  // ====================================================

  const confirmation =
    String(
      await ask(
        'Type "DEPLOY" to deploy TYCON to MAINNET: '
      )
    )
      .trim()
      .toUpperCase();

  if (
    confirmation !==
    "DEPLOY"
  ) {
    console.log(
      "\nDeployment cancelled."
    );

    return;
  }

  // ====================================================
  // DEPLOY
  // ====================================================

  console.log(
    "\nDeploying TYCON..."
  );

  const contract =
    await factory.deploy();

  const transaction =
    contract.deploymentTransaction();

  if (
    transaction
  ) {
    console.log(
      ""
    );

    console.log(
      "Transaction:"
    );

    console.log(
      transaction.hash
    );

    console.log(
      ""
    );

    console.log(
      "Explorer transaction:"
    );

    console.log(
      `${EXPLORER_URL}/tx/${transaction.hash}`
    );
  }

  // ====================================================
  // WAIT FOR DEPLOYMENT
  // ====================================================

  console.log(
    "\nWaiting for confirmation..."
  );

  await contract
    .waitForDeployment();

  // ====================================================
  // VERIFY RESULT
  // ====================================================

  const contractAddress =
    await contract.getAddress();

  const owner =
    await contract.owner();

  const minter =
    await contract.minter();

  const totalSupply =
    await contract.totalSupply();

  // ====================================================
  // SUCCESS
  // ====================================================

  console.log(
    "\n=========================================="
  );

  console.log(
    "          TYCON DEPLOYED"
  );

  console.log(
    "=========================================="
  );

  console.log(
    ""
  );

  console.log(
    `Contract: ${contractAddress}`
  );

  console.log(
    `Owner   : ${owner}`
  );

  console.log(
    `Minter  : ${minter}`
  );

  console.log(
    `Supply  : ${totalSupply.toString()}`
  );

  console.log(
    ""
  );

  console.log(
    "Explorer:"
  );

  console.log(
    `${EXPLORER_URL}/address/${contractAddress}`
  );

  console.log(
    ""
  );

  console.log(
    "SAVE THE CONTRACT ADDRESS."
  );

  console.log(
    "=========================================="
  );
}

// ======================================================
// RUN
// ======================================================

main()
  .catch(
    (error) => {
      console.error(
        "\nDEPLOYMENT FAILED"
      );

      console.error(
        error instanceof Error
          ? error.message
          : error
      );

      process.exitCode =
        1;
    }
  )
  .finally(
    () => {
      rl.close();
    }
  );
