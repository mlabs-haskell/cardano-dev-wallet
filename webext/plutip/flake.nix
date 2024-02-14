{
  inputs = {
    nixpkgs.url = "nixpkgs"; # Resolves to github:NixOS/nixpkgs
    # Helpers for system-specific outputs
    flake-utils.url = "github:numtide/flake-utils";
    plutip.url = "github:mlabs-haskell/plutip";
    ogmios-nixos = {
      url = "github:mlabs-haskell/ogmios-nixos/78e829e9ebd50c5891024dcd1004c2ac51facd80";
    };
    kupo-nixos = {
      url = "github:mlabs-haskell/kupo-nixos/6f89cbcc359893a2aea14dd380f9a45e04c6aa67";
    };
    cardano-cli.url = "github:intersectmbo/cardano-node/8.7.3";
  };
  outputs =
    { self
    , nixpkgs
    , flake-utils
    , plutip
    , ogmios-nixos
    , kupo-nixos
    , cardano-cli
    , ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
        plutipBin = plutip.apps.${system}."plutip-core:exe:local-cluster".program;
        ogmiosBin = ogmios-nixos.apps.${system}."ogmios:exe:ogmios".program;
        kupoBin = kupo-nixos.packages.${system}.kupo.exePath;
        cardanoCliBin = cardano-cli.apps.${system}.cardano-cli.program;

        mprocsBin = "${pkgs.mprocs}/bin/mprocs";
        jqBin = "${pkgs.jq}/bin/jq";

        scriptCommon = ''
          sleep 1;

          echo -e "Waiting for cluster info ..";
          cluster_info="local-cluster-info.json";
          while [ ! -f $cluster_info ]; do sleep 1; done;

          echo -e "Waiting for socket ..";
          do=true;
          while $do || [ ! -S $socket ]; do
            do=false;
            socket=$(jq .ciNodeSocket $cluster_info --raw-output)
            sleep 1;
          done
          echo "Socket found: " $socket "       "

          config=''${socket/node.socket/node.config}
        '';
      in
      {
        packages.startKupo = pkgs.writeScript "startKupo" ''
          ${scriptCommon}

          ${kupoBin} \
            --node-socket $socket \
            --node-config $config \
            --match '*' \
            --since origin \
            --in-memory \
            --host 0.0.0.0
        '';
        packages.startOgmios = pkgs.writeScript "startOgmios" ''
          ${scriptCommon}

          ${ogmiosBin} \
            --node-socket $socket \
            --node-config $config \
            --host 0.0.0.0
        '';
        packages.startPlutip = pkgs.writeScript "startPlutip" ''
          rm local-cluster-info.json
          rm -rf wallets
          ${plutipBin} --wallet-dir wallets
        '';
        packages.fundAda = pkgs.writeScript "fundAda" ''
          ${scriptCommon}

          while [ ! -d wallets ]; do sleep 1; done

          do=true;
          while $do || [ ! -f $vkey ]; do
            do=false;
            vkey="wallets/$(ls wallets | grep verification)"
            sleep 1;
          done;

          export CARDANO_NODE_SOCKET_PATH=$socket
          address=$( \
              ${cardanoCliBin} latest \
              address \
              build \
              --payment-verification-key-file \
              $vkey \
              --mainnet \
          )

          echo Address: $address

          txn=$( \
            ${cardanoCliBin} \
              query \
              utxo \
              --address $address \
              --mainnet \
            | head -n 3 | tail -n 1 \
          )

          echo $txn
          txHash=$(echo "$txn" | cut -d' ' -f 1)
          txIdx=$(echo "$txn" | cut -d' ' -f 2)

          echo Txnhash: $txHash
          echo Txnidx: $txIdx

        '';
        packages.mprocsCfg = pkgs.writeText "mprocs.yaml" ''
          procs:
            plutip:
              cmd: ["${self.packages.${system}.startPlutip}"]
            ogmios:
              cmd: ["${self.packages.${system}.startOgmios}"]
            kupo:
              cmd: ["${self.packages.${system}.startKupo}"]
            fundAda:
              cmd: ["${self.packages.${system}.fundAda}"]
        '';
        packages.cardano-cli = cardano-cli.packages.${system}.cardano-cli;
        packages.default = pkgs.writeScript "startAll" ''
          ${mprocsBin} --config ${self.packages.${system}.mprocsCfg}
        '';
        apps.default = {
          type = "app";
          program = "${self.packages.${system}.default}";
        };
      }
    );
  nixConfig = {
    extra-substituters = [
      "https://cache.iog.io"
      "https://public-plutonomicon.cachix.org"
    ];
    extra-trusted-public-keys = [
      "hydra.iohk.io:f/Ea+s+dFdN+3Y/G+FDgSq+a5NEWhJGzdjvKNGv0/EQ="
      "plutonomicon.cachix.org-1:3AKJMhCLn32gri1drGuaZmFrmnue+KkKrhhubQk/CWc="
    ];
    allow-import-from-derivation = true;
  };
}

