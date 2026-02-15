import {
  Horizon,
  Keypair,
  Networks,
  Asset,
} from "@stellar/stellar-sdk";

export function getHorizonServer(): Horizon.Server {
  const url = process.env.HORIZON_URL || "https://horizon-testnet.stellar.org";
  return new Horizon.Server(url);
}

export function getNetworkPassphrase(): string {
  const network = process.env.STELLAR_NETWORK || "testnet";
  return network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
}

export function generateKeypair(): { publicKey: string; secret: string } {
  const keypair = Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    secret: keypair.secret(),
  };
}

export function keypairFromSecret(secret: string): Keypair {
  return Keypair.fromSecret(secret);
}

// USDC Asset configuration
export const USDC_TESTNET = new Asset(
  "USDC",
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
);

export const USDC_MAINNET = new Asset(
  "USDC",
  "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
);

export function getUSDCAsset(): Asset {
  const network = process.env.STELLAR_NETWORK || "testnet";
  return network === "mainnet" ? USDC_MAINNET : USDC_TESTNET;
}
