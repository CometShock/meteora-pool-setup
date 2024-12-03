import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import { parseArgs } from "util";
import {BN } from "bn.js";

export function safeParseJsonFromFile<T>(filePath: string): T {
    try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Error reading or parsing JSON file:', error);
        throw new Error(`failed to parse file ${filePath}`); 
    }
}

export function safeParseKeypairFromFile(filePath: string): Keypair {
    let keypairJson: Array<number> = safeParseJsonFromFile(filePath);
    let keypairBytes = Uint8Array.from(keypairJson);
    let keypair = Keypair.fromSecretKey(keypairBytes);
    return keypair; 
}

export function parseKeypairFromSecretKey(secretKey: string): Keypair {
    const keypairBytes = bs58.decode(secretKey);
    const keypair = Keypair.fromSecretKey(keypairBytes);
    return keypair;
}

export function getAmountInLamports(amount: string, decimals: number): BN {
    return new BN(amount) * new BN(10 ** decimals)
}

export function getDecimalizedAmount(amountLamport: BN, decimals: number): BN {
    return amountLamport / new BN(10 ** decimals)
}

export interface CliArguments {
    // Config filepath
    config: string | undefined;
}

export function parseCliArguments(): CliArguments {
    const { values, positionals } = parseArgs({
    args: Bun.argv,
    options: {
      config: {
        type: 'string',
      },
    },
    strict: true,
    allowPositionals: true,
  });

  return values;
}
