enum NetworkId {
  Mainnet = 1,
  Testnet = 0,
}

enum NetworkName {
  Mainnet = "mainnet",
  Preprod = "preprod",
  Preview = "preview",
}

interface Network {
  networkName: NetworkName;
  networkId: NetworkId;
}

const MAINNET: Network = {
  networkName: NetworkName.Mainnet,
  networkId: NetworkId.Mainnet,
};

const PREPROD: Network = {
  networkName: NetworkName.Preprod,
  networkId: NetworkId.Testnet,
};

const PREVIEW: Network = {
  networkName: NetworkName.Preview,
  networkId: NetworkId.Testnet,
};

export { Network, NetworkId, NetworkName, MAINNET, PREPROD, PREVIEW };
