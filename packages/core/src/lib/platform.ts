// Lumio platform configuration for Trustless Work escrow roles

export const LUMIO_PLATFORM_ADDRESS = process.env.LUMIO_PLATFORM_ADDRESS || "";
export const LUMIO_BACKEND_ADDRESS = process.env.LUMIO_BACKEND_ADDRESS || "";
export const LUMIO_PLATFORM_FEE = "5"; // 5% platform fee on escrow release

export const USDC_TESTNET_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export const TW_API_BASE_URL = process.env.TW_API_BASE_URL || "https://dev.api.trustlesswork.com";
export const TW_API_KEY = process.env.TW_API_KEY || "";
