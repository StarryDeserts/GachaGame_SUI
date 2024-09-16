import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("https://fullnode.testnet.sui.io:443"),
    },
    mainnet: {
      url: getFullnodeUrl("https://sui-mainnet.nodeinfra.com:443"),
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
