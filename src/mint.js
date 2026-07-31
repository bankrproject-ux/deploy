import readline from "node:readline";

import {
  Contract,
  JsonRpcProvider,
  Wallet,
  formatEther,
  parseUnits,
} from "ethers";

// ======================================================
// TYCON MINTER
// Robinhood Chain Mainnet
// ======================================================

const NETWORK_NAME =
  "Robinhood Chain Mainnet";

const RPC_URL =
  "https://rpc.mainnet.chain.robinhood.com";

const CHAIN_ID =
  4663;

// TYCON CONTRACT YANG SUDAH LU DEPLOY
const TYCON_CONTRACT =
  "0xC30f570fBECa24b8EFbEb5A61B7b9b0064ffB01e";

const EXPLORER_URL =
  "https://robinhoodchain.blockscout.com";

// ======================================================
// ABI MINIMAL
// ======================================================

const TYCON_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function owner() view returns (address)",
  "function minter() view returns (address)",
  "function balanceOf(address account) view returns (uint256)",
  "function mint(address to, uint256 amount)",
];

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
// HIDDEN PRIVATE KEY
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
            "Interactive terminal required."
          )
        );

        return;
      }

      stdout.write(
        "Enter MINTER private key: "
      );

      let value =
        "";

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

          // Ignore control characters
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
// PRIVATE KEY
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

function isValidPrivateKey(
  value
) {
  return /^0x[a-fA-F0-9]{64}$/.test(
    value
  );
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
    "             TYCON MINTER"
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
    `Contract: ${TYCON_CONTRACT}`
  );

  console.log(
    ""
  );

  console.log(
    "THIS WILL SEND A MAINNET TRANSACTION."
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
      "Invalid private key."
    );
  }

  // ====================================================
  // NETWORK
  // ====================================================

  console.log(
    "\nConnecting..."
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
      `Wrong network: ${network.chainId}`
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
    "Wallet:"
  );

  console.log(
    wallet.address
  );

  const ethBalance =
    await provider.getBalance(
      wallet.address
    );

  console.log(
    ""
  );

  console.log(
    `ETH: ${formatEther(
      ethBalance
    )}`
  );

  if (
    ethBalance === 0n
  ) {
    throw new Error(
      "Wallet has no ETH for gas."
    );
  }

  // ====================================================
  // CONTRACT
  // ====================================================

  const contract =
    new Contract(
      TYCON_CONTRACT,
      TYCON_ABI,
      wallet
    );

  console.log(
    "\nReading TYCON contract..."
  );

  const [
    name,
    symbol,
    decimals,
    totalSupply,
    owner,
    minter,
  ] =
    await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
      contract.owner(),
      contract.minter(),
    ]);

  console.log(
    ""
  );

  console.log(
    `Name    : ${name}`
  );

  console.log(
    `Symbol  : ${symbol}`
  );

  console.log(
    `Decimals: ${decimals}`
  );

  console.log(
    `Supply  : ${formatEther(
      totalSupply
    )} ${symbol}`
  );

  console.log(
    ""
  );

  console.log(
    `Owner   : ${owner}`
  );

  console.log(
    `Minter  : ${minter}`
  );

  // ====================================================
  // CHECK MINTER
  // ====================================================

  if (
    wallet.address.toLowerCase() !==
    String(
      minter
    ).toLowerCase()
  ) {
    throw new Error(
      "This wallet is NOT the authorized TYCON minter."
    );
  }

  console.log(
    ""
  );

  console.log(
    "Minter authorization: OK"
  );

  // ====================================================
  // RECIPIENT
  // ====================================================

  const recipientInput =
    String(
      await ask(
        "\nRecipient wallet (press ENTER to mint to yourself): "
      )
    ).trim();

  const recipient =
    recipientInput ||
    wallet.address;

  if (
    !/^0x[a-fA-F0-9]{40}$/.test(
      recipient
    )
  ) {
    throw new Error(
      "Invalid recipient wallet."
    );
  }

  // ====================================================
  // AMOUNT
  // ====================================================

  const amountInput =
    String(
      await ask(
        "TYCON amount to mint (example 1): "
      )
    ).trim();

  if (
    !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(
      amountInput
    )
  ) {
    throw new Error(
      "Invalid TYCON amount."
    );
  }

  const amount =
    parseUnits(
      amountInput,
      Number(
        decimals
      )
    );

  if (
    amount <= 0n
  ) {
    throw new Error(
      "Mint amount must be greater than zero."
    );
  }

  // ====================================================
  // CURRENT BALANCE
  // ====================================================

  const balanceBefore =
    await contract.balanceOf(
      recipient
    );

  console.log(
    ""
  );

  console.log(
    "=========================================="
  );

  console.log(
    "              MINT SUMMARY"
  );

  console.log(
    "=========================================="
  );

  console.log(
    `Recipient : ${recipient}`
  );

  console.log(
    `Amount    : ${amountInput} ${symbol}`
  );

  console.log(
    `Before    : ${formatEther(
      balanceBefore
    )} ${symbol}`
  );

  console.log(
    ""
  );

  // ====================================================
  // GAS ESTIMATE
  // ====================================================

  console.log(
    "Estimating gas..."
  );

  const estimatedGas =
    await contract.mint
      .estimateGas(
        recipient,
        amount
      );

  const feeData =
    await provider.getFeeData();

  console.log(
    `Estimated gas: ${estimatedGas.toString()}`
  );

  if (
    feeData.gasPrice
  ) {
    const estimatedCost =
      estimatedGas *
      feeData.gasPrice;

    console.log(
      `Estimated gas cost: ~${formatEther(
        estimatedCost
      )} ETH`
    );

    if (
      ethBalance <
      estimatedCost
    ) {
      throw new Error(
        "Not enough ETH for estimated gas."
      );
    }
  }

  // ====================================================
  // CONFIRM
  // ====================================================

  console.log(
    ""
  );

  const confirmation =
    String(
      await ask(
        'Type "MINT" to continue: '
      )
    )
      .trim()
      .toUpperCase();

  if (
    confirmation !==
    "MINT"
  ) {
    console.log(
      "\nMint cancelled."
    );

    return;
  }

  // ====================================================
  // MINT
  // ====================================================

  console.log(
    "\nSending mint transaction..."
  );

  const tx =
    await contract.mint(
      recipient,
      amount
    );

  console.log(
    ""
  );

  console.log(
    "Transaction:"
  );

  console.log(
    tx.hash
  );

  console.log(
    ""
  );

  console.log(
    "Explorer:"
  );

  console.log(
    `${EXPLORER_URL}/tx/${tx.hash}`
  );

  console.log(
    "\nWaiting for confirmation..."
  );

  const receipt =
    await tx.wait();

  if (
    !receipt ||
    receipt.status !== 1
  ) {
    throw new Error(
      "Mint transaction failed."
    );
  }

  // ====================================================
  // RESULT
  // ====================================================

  const [
    balanceAfter,
    supplyAfter,
  ] =
    await Promise.all([
      contract.balanceOf(
        recipient
      ),

      contract.totalSupply(),
    ]);

  console.log(
    "\n=========================================="
  );

  console.log(
    "            MINT SUCCESSFUL"
  );

  console.log(
    "=========================================="
  );

  console.log(
    `Recipient: ${recipient}`
  );

  console.log(
    `Balance  : ${formatEther(
      balanceAfter
    )} ${symbol}`
  );

  console.log(
    `Supply   : ${formatEther(
      supplyAfter
    )} ${symbol}`
  );

  console.log(
    ""
  );

  console.log(
    `Token: ${EXPLORER_URL}/address/${TYCON_CONTRACT}`
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
        "\nMINT FAILED"
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
