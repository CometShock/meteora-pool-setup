import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  DEFAULT_COMMITMENT_LEVEL,
  MeteoraConfig,
  getAmountInLamports,
  getQuoteMint,
  getQuoteDecimals,
  safeParseKeypairFromFile,
  runSimulateTransaction,
  parseConfigFromCli,
} from ".";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { BN } from "bn.js";
import DLMM, {
  LBCLMM_PROGRAM_IDS,
  deriveCustomizablePermissionlessLbPair,
  getBinArrayLowerUpperBinId,
  getPriceOfBinByBinId,
} from "@meteora-ag/dlmm";
import Decimal from "decimal.js";

async function main() {
  let config: MeteoraConfig = parseConfigFromCli();

  console.log(`> Using keypair file path ${config.keypairFilePath}`);
  let keypair = safeParseKeypairFromFile(config.keypairFilePath);

  console.log("\n> Initializing with general configuration...");
  console.log(`- Using RPC URL ${config.rpcUrl}`);
  console.log(`- Dry run = ${config.dryRun}`);
  console.log(`- Using payer ${keypair.publicKey} to execute commands`);

  const connection = new Connection(config.rpcUrl, DEFAULT_COMMITMENT_LEVEL);
  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: connection.commitment,
  });

  if (!config.baseMint) {
    throw new Error("Missing baseMint in configuration");
  }
  const baseMint = new PublicKey(config.baseMint);
  let quoteMint = getQuoteMint(config.quoteSymbol);
  const quoteDecimals = getQuoteDecimals(config.quoteSymbol);

  console.log(`- Using base token mint ${baseMint.toString()}`);
  console.log(`- Using quote token mint ${quoteMint.toString()}`);

  let poolKey: PublicKey;
  [poolKey] = deriveCustomizablePermissionlessLbPair(
    baseMint,
    quoteMint,
    new PublicKey(LBCLMM_PROGRAM_IDS["mainnet-beta"]),
  );
  console.log(`- Using pool key ${poolKey.toString()}`);

  if (!config.singleBinSeedLiquidity) {
    throw new Error(`Missing DLMM Single bin seed liquidity in configuration`);
  }

  const pair = await DLMM.create(connection, poolKey, {
    cluster: "mainnet-beta",
  });

  const seedAmount = getAmountInLamports(
    config.singleBinSeedLiquidity.seedAmount,
    config.baseDecimals,
  );
  const price = config.singleBinSeedLiquidity.price;
  const selectiveRounding = config.singleBinSeedLiquidity.selectiveRounding;
  if (
    selectiveRounding != "up" &&
    selectiveRounding != "down" &&
    selectiveRounding != "none"
  ) {
    throw new Error(
      "Invalid selective rounding value. Must be 'up' or 'down' or 'none'",
    );
  }
  const basePositionKey = new PublicKey(
    config.singleBinSeedLiquidity.basePositionKey,
  );
  const baseKeypair = safeParseKeypairFromFile(
    config.singleBinSeedLiquidity.basePositionKeypairFilepath,
  );
}
main();
