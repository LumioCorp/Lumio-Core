"use client";

import { useCallback } from "react";
import {
  useInitializeEscrow,
  useFundEscrow,
  useChangeMilestoneStatus,
  useSendTransaction,
  useGetEscrowFromIndexerByContractIds,
} from "@trustless-work/escrow";
import type { InitializeSingleReleaseEscrowPayload } from "@trustless-work/escrow";
import { useWallet } from "@/components/ui/WalletProvider";
import * as api from "@/lib/api";

/**
 * Hook to deploy a TW escrow for an event.
 * Flow: get config from backend → deploy via TW → sign XDR → send → register escrow in backend
 */
export function useDeployEscrow() {
  const { address, signTransaction } = useWallet();
  const { deployEscrow } = useInitializeEscrow();
  const { sendTransaction } = useSendTransaction();

  const deploy = useCallback(
    async (eventId: string) => {
      if (!address) throw new Error("Wallet not connected");

      // 1. Get escrow config from backend
      const config = await api.getEscrowConfig(eventId);

      // 2. Build payload for TW SDK
      const payload: InitializeSingleReleaseEscrowPayload = {
        signer: address,
        engagementId: eventId,
        title: config.title,
        description: config.description || "",
        roles: config.roles,
        amount: Number(config.amount),
        platformFee: Number(config.platformFee),
        milestones: config.milestones,
        trustline: { address: config.trustline.address, symbol: "USDC" },
      };

      // 3. Deploy escrow via TW (returns unsigned XDR)
      const response = await deployEscrow(payload, "single-release");

      if (!response.unsignedTransaction) {
        throw new Error("No unsigned transaction returned from TW");
      }

      // 4. Sign the XDR with user's wallet
      const signedXdr = await signTransaction(response.unsignedTransaction);

      // 5. Send the signed transaction
      const sendResult = await sendTransaction(signedXdr);

      // 6. Extract contractId from the response
      const contractId = "contractId" in sendResult ? (sendResult as { contractId: string }).contractId : "";

      if (!contractId) {
        throw new Error("No contractId returned after escrow deployment");
      }

      // 7. Register escrow in backend
      await api.registerEscrow(eventId, contractId);

      return contractId;
    },
    [address, signTransaction, deployEscrow, sendTransaction]
  );

  return { deploy };
}

/**
 * Hook to fund a TW escrow with USDC (investment flow).
 * Flow: fund escrow via TW → sign XDR → send → report to backend
 */
export function useInvestViaEscrow() {
  const { address, signTransaction } = useWallet();
  const { fundEscrow } = useFundEscrow();
  const { sendTransaction } = useSendTransaction();

  const invest = useCallback(
    async (
      eventId: string,
      escrowContractId: string,
      tokenAmount: number,
      usdcAmount: number
    ) => {
      if (!address) throw new Error("Wallet not connected");

      // 1. Fund escrow via TW SDK (returns unsigned XDR)
      const response = await fundEscrow(
        {
          contractId: escrowContractId,
          amount: usdcAmount,
          signer: address,
        },
        "single-release"
      );

      if (!response.unsignedTransaction) {
        throw new Error("No unsigned transaction returned from TW");
      }

      // 2. Sign the XDR with user's wallet
      const signedXdr = await signTransaction(response.unsignedTransaction);

      // 3. Send the signed transaction
      const sendResult = await sendTransaction(signedXdr);
      const escrowFundingTxHash =
        "message" in sendResult ? sendResult.message : "unknown";

      // 4. Report investment to backend (backend will issue tokens)
      const result = await api.recordInvestment(eventId, {
        investorAddress: address,
        tokenAmount,
        usdcPaid: usdcAmount,
        escrowFundingTxHash,
      });

      return result;
    },
    [address, signTransaction, fundEscrow, sendTransaction]
  );

  return { invest };
}

/**
 * Hook to mark a milestone as done on the TW escrow.
 */
export function useMarkMilestoneDone() {
  const { address, signTransaction } = useWallet();
  const { changeMilestoneStatus } = useChangeMilestoneStatus();
  const { sendTransaction } = useSendTransaction();

  const markDone = useCallback(
    async (contractId: string, milestoneIndex: string) => {
      if (!address) throw new Error("Wallet not connected");

      const response = await changeMilestoneStatus(
        {
          contractId,
          milestoneIndex,
          newStatus: "completed",
          serviceProvider: address,
        },
        "single-release"
      );

      if (!response.unsignedTransaction) {
        throw new Error("No unsigned transaction returned from TW");
      }

      const signedXdr = await signTransaction(response.unsignedTransaction);
      await sendTransaction(signedXdr);
    },
    [address, signTransaction, changeMilestoneStatus, sendTransaction]
  );

  return { markDone };
}

/**
 * Hook to query escrow details from TW indexer.
 */
export function useEscrowDetails(contractId: string | null) {
  const { getEscrowByContractIds } = useGetEscrowFromIndexerByContractIds();

  const fetchDetails = useCallback(async () => {
    if (!contractId) return null;

    const results = await getEscrowByContractIds({
      contractIds: [contractId],
    });

    return results.length > 0 ? results[0] : null;
  }, [contractId, getEscrowByContractIds]);

  return { fetchDetails };
}
