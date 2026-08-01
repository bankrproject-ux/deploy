import readline from "node:readline";

import {
    Contract,
    JsonRpcProvider,
    Wallet,
} from "ethers";

// ======================================================
// CONFIG
// ======================================================

const RPC =
    "https://rpc.mainnet.chain.robinhood.com";

const CHAIN_ID =
    4663;

const CONTRACT =
    "0xC30f570fBECa24b8EFbEb5A61B7b9b0064ffB01e";

const ABI = [
    "function owner() view returns(address)",
    "function minter() view returns(address)",
    "function setMinter(address)",
];

// ======================================================

const rl =
    readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

function ask(question) {
    return new Promise(resolve =>
        rl.question(question, resolve)
    );
}

function normalizePrivateKey(key) {
    key = key.trim();

    if (!key.startsWith("0x"))
        key = "0x" + key;

    return key;
}

async function main() {

    console.clear();

    console.log("======================================");
    console.log("TYCON SET MINTER");
    console.log("======================================");
    console.log("");

    const privateKey =
        normalizePrivateKey(
            await ask(
                "Owner Private Key : "
            )
        );

    const newMinter =
        (
            await ask(
                "New Minter Address : "
            )
        ).trim();

    const provider =
        new JsonRpcProvider(
            RPC,
            CHAIN_ID
        );

    const wallet =
        new Wallet(
            privateKey,
            provider
        );

    const contract =
        new Contract(
            CONTRACT,
            ABI,
            wallet
        );

    const owner =
        await contract.owner();

    const current =
        await contract.minter();

    console.log("");
    console.log(
        "Owner           :",
        owner
    );

    console.log(
        "Current Minter  :",
        current
    );

    console.log(
        "New Minter      :",
        newMinter
    );

    console.log("");

    if (
        wallet.address.toLowerCase() !==
        owner.toLowerCase()
    ) {
        throw new Error(
            "Wallet is not owner."
        );
    }

    const confirm =
        (
            await ask(
                'Type "SET" : '
            )
        )
            .trim()
            .toUpperCase();

    if (confirm !== "SET") {
        console.log(
            "Cancelled."
        );

        process.exit(0);
    }

    console.log("");
    console.log(
        "Sending transaction..."
    );

    const tx =
        await contract.setMinter(
            newMinter
        );

    console.log(
        "Tx:",
        tx.hash
    );

    await tx.wait();

    const after =
        await contract.minter();

    console.log("");
    console.log(
        "SUCCESS"
    );

    console.log(
        "Current Minter:",
        after
    );

    console.log("");

    console.log(
        "Explorer:"
    );

    console.log(
        `https://robinhoodchain.blockscout.com/address/${CONTRACT}`
    );

    rl.close();
}

main().catch(err => {

    console.error(err);

    rl.close();
});
