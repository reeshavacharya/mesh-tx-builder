import React, { useState } from "react";
import { useWallet } from "@meshsdk/react";
import { Transaction, ForgeScript, readTransaction } from "@meshsdk/core";
import type {
  Mint,
  AssetMetadata,
  PlutusScript,
  Action,
  Data,
} from "@meshsdk/core";
import axios from "axios";
import { withdrawOffChainTransaction } from "./Withdraw";
import * as CSL from "@emurgo/cardano-serialization-lib-asmjs"
import { simpleTx } from "./SimpleTx";

export default function Mint() {


  const { connected, wallet } = useWallet();
  const [txhash, setTxhash] = useState("");
  //add participants public key and public key hash
  const members = [
    {
      public_key:
        "",
      public_key_hash:
        "",
    },
    {
      public_key:
        "",
      public_key_hash:
        "",
    },
    {
      public_key:
        "",
      public_key_hash:
        "",
    },
  ];

  const mintingFunc = async () => {
    const utxo = await wallet.getUtxos();
    const txHash = utxo[0].input.txHash;
    const txIndex = utxo[0].input.outputIndex;
    const body = {
      network: "preview",
      utxo: `${txHash}#${txIndex}`,
    };
    console.log(body);

    const generateContractResponse = await axios.post(
      "https://multisig.cardanoapi.io/api/contract/generate",
      body
    );
    const redeemer: Partial<Action> = {
      data: {
        alternative: 0,
        fields: [],
      },
      tag: "MINT",
    };
    const script: PlutusScript = {
      code: generateContractResponse?.data?.mintingContract?.cborHex,
      version: "V2",
    };

    const usersPk: any = members.map((item) => item.public_key);
    const usersPkh = members.map((item) => item.public_key_hash);

    const datumConstructor: Data = {
      alternative: 0,
      fields: [],
    };

    const datumMap = {
      alternative: 0,
      fields: [usersPk, usersPkh, 2],
    };

    const asset1: Mint | any = {
      assetName: "Proposal",
      assetQuantity: "1",
      recipient: {
        address: generateContractResponse?.data?.proposalContract?.address,
        datum: {
          value: datumConstructor,
          inline: true,
        },
      },
    };
    const asset9: Mint | any = {
      assetName: "Proposal",
      assetQuantity: "1",
      recipient: {
        address: generateContractResponse?.data?.proposalContract?.address,
        datum: {
          value: datumConstructor,
          inline: true,
        },
      },
    };
    const asset8: Mint | any = {
      assetName: "Proposal",
      assetQuantity: "1",
      recipient: {
        address: generateContractResponse?.data?.proposalContract?.address,
        datum: {
          value: datumConstructor,
          inline: true,
        },
      },
    };
    const asset7: Mint | any = {
      assetName: "Proposal",
      assetQuantity: "1",
      recipient: {
        address: generateContractResponse?.data?.proposalContract?.address,
        datum: {
          value: datumConstructor,
          inline: true,
        },
      },
    };
    const asset2: Mint | any = {
      assetName: "Quorum",
      assetQuantity: "1",
      recipient: {
        address: generateContractResponse?.data?.quorumContract?.address,
        datum: {
          value: datumMap,
          inline: true,
        },
      },
    };

    try {
      const tx = new Transaction({ initiator: wallet });
      tx.setRequiredSigners([])
      tx.mintAsset(script, asset1, redeemer);
      tx.mintAsset(script, asset2, redeemer);
      tx.mintAsset(script, asset9, redeemer);
      tx.mintAsset(script, asset8, redeemer);
      tx.mintAsset(script, asset7, redeemer);
      const unsignedTx = await tx.build();
      // const cslJsonTx = (CSL.Transaction.from_hex(unsignedTx).to_json())
      const signedTx = (await wallet).signTx(unsignedTx)
      const submitTx = (await wallet).submitTx(await signedTx)
      console.log("txHash: ", await submitTx);

    } catch (error) {
      console.log(error);
    }
  };

  // const mint = async () => {
  //   try {
  //     const utxos = await wallet.getUtxos();
  //     const collateral = await wallet.getCollateral();
  //     const txHash = utxos[0].input.txHash;
  //     const txIndex = utxos[0].input.outputIndex;
  //     const body = {
  //       network: "preview",
  //       utxo: `${txHash}#${txIndex}`,
  //     };
  //     const res = await axios.post(
  //       "https://multisig.cardanoapi.io/api/contract/generate",
  //       body
  //     );
  //     const response = res.data;

  //     const minting_contract = response["mintingContract"];
  //     const sig_contract = response["proposalContract"]["script"];
  //     const sig_address = response["proposalContract"]["address"];
  //     const multi_sig_state_token = response["proposalToken"]["policy"];

  //     const quorum_contract = response["quorumContract"]["script"];
  //     const quorum_address = response["quorumContract"]["address"];
  //     const quorum_nft = response["quorumNft"]["policy"];

  //     const vault_contract = response["vaultContract"]["script"];
  //     const vault_address = response["vaultContract"]["address"];

  //     const proposal_token = `${multi_sig_state_token}.Proposal`;
  //     const quorum_token = `{quorum_nft}.Quorum`;

  //     const script: PlutusScript = {
  //       code: minting_contract.cborHex,
  //       version: "V2",
  //     };

  //     const asset1: Mint | any = {
  //       assetName: "Proposal",
  //       assetQuantity: "4",
  //       label: "20",
  //       recipient: { address: sig_address },
  //     };
  //     const asset2: Mint | any = {
  //       assetName: "Quorum",
  //       assetQuantity: "1",
  //       recipient: { address: quorum_address },
  //       label: "721",
  //     };
  //     const redeemer: Partial<Action> = {
  //       data: {
  //         alternative: 0,
  //         fields: [],
  //       },
  //       tag: "MINT",
  //     };
  //     const tx = new Transaction({ initiator: wallet });
  //     tx.mintAsset(script, asset1, redeemer);
  //     tx.mintAsset(script, asset2, redeemer);

  //     tx.setTxInputs(utxos);

  //     tx.setCollateral(collateral);
  //     // tx.mintAsset(forgingScript, asset);

  //     const unsignedTx = await tx.build();
  //     const signedTx = await wallet.signTx(unsignedTx);
  //     const txhash = await wallet.submitTx(signedTx);
  //     setTxHash(txhash);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // };
  return (
    <div>
      {connected ? (
        <div>
          <p>Wallet connected</p>
          <button onClick={mintingFunc}>Mint</button>
          <p>{txhash}</p>
          <div>
            <button onClick={async () => await withdrawOffChainTransaction(wallet)}>Withdraw</button>
          </div>
          <div>
            <button onClick={async () => await simpleTx(wallet)}>SimpleTx</button>
          </div>
        </div>
      ) : (
        <p>Connect wallet to continue</p>
      )}
    </div>
  );
}
