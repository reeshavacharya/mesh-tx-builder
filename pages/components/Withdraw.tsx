// getTransactionDetails is calling blockfrost api to get transactiondetails from transactionhash
// selectedOrganization :: 
// row :: 

import { Data, PlutusScript, Transaction, resolvePaymentKeyHash, resolveStakeKeyHash } from "@meshsdk/core";
import * as CSL from "@emurgo/cardano-serialization-lib-asmjs"
import { blockfrost, multisig } from "../config"
import { getTransactionDetails, getTransactions } from "../ blockfrost";
import { kuberTxCbor, row, selectedOrganization, simpleContract } from "./SelectedOrganization";
import { encode, decode } from 'cborg'

export const withdrawOffChainTransaction = async (
    walletData
        : any) => {
    const depositUtxoBlockfrost = await getTransactionDetails("1c66897f5ba7085df27c3cac73f4e4c952d1b5053ef955aba1fb8f41dafa5694")
    const referenceUtxoBlockfrost = await getTransactionDetails("45e4b496d192ef91112193e20db8c8d28df414cf4e9f5e6268b4e730b81b0f66")

    const collateral = await walletData?.getCollateral()
    const simpleScript: PlutusScript = {
        code: simpleContract.script.cborHex,
        version: "V2"
    }
    const simpleRedeemer = {
        data: {
            alternative: 0,
            fields: []
        }
    }
    const outputAddr = "addr_test1qpw57k84mzwmpqyx6n9smye79mxt8rqpfpvx7p6chz95sm7a3aw5tgv4fc9weuwme2u29aerv5hk0m2lkpkgasn7gtxqwen0r7"
    const referenceAddr = "addr_test1qr0k5uczwvzdt6g6c2e9l92r24f528dfnmu9qq6lssrc3z56l3lczn30u56k4vlf948etel5d63zj20yg6wymu2gp4gsyum3sz"
    const filterActualDepositUtxo = depositUtxoBlockfrost?.outputs.filter((item: any) => item.address == simpleContract.address)
    const filterActualReferenceUtxo = referenceUtxoBlockfrost?.outputs.filter((item: any) => item.address == referenceAddr)
    const info = {
        Blockfrost: {
            deposit: depositUtxoBlockfrost,
            reference: referenceUtxoBlockfrost
        },
        Parsed: {
            deposit: filterActualDepositUtxo,
            reference: filterActualReferenceUtxo
        }
    }
    console.log("information: ", info);

    const depositUtxo = {
        input: {
            txHash: depositUtxoBlockfrost.hash,
            outputIndex: 0
        },
        output: {
            address: filterActualDepositUtxo[0]?.address,
            amount: filterActualDepositUtxo?.[0].amount?.map((item: any, index: number) => ({
                unit: item.unit,
                quantity: item.quantity
            })),
            plutusData: filterActualDepositUtxo[0]?.inline_datum
        }
    }
    const referenceUtxo = [{
        input: {
            txHash: referenceUtxoBlockfrost.hash,
            oputputIndex: 0
        },
        output: {
            address: filterActualReferenceUtxo[0]?.address,
            amount: filterActualReferenceUtxo?.[0].amount?.map((item: any, index: number) => ({
                unit: item.unit,
                quantity: item.quantity
            })),
            plutusData: filterActualReferenceUtxo[0]?.inline_datum
        }
    }]
    function toPlutusV2(tx: CSL.TransactionJSON) {
        const plutusScript = tx.witness_set.plutus_scripts
        const plutusScriptV2 = []
        if (Array.isArray(plutusScript)) {
            const numScripts = plutusScript.length;
            for (let i = 0; i < numScripts; i++) {
                const currentScript = plutusScript[i];
                console.log("scriptCbor", currentScript);
                plutusScriptV2.push(CSL.PlutusScript.from_bytes_v2(Buffer.from(currentScript, 'hex')))
            }
        } else {
            console.error('plutusScripts is not an array.');
        }
        const txBody = CSL.TransactionBody.from_json(JSON.stringify(tx.body))
        let txAuxData = undefined;
        if (tx.auxiliary_data) {
            txAuxData = CSL.AuxiliaryData.from_json(JSON.stringify(tx.auxiliary_data))
        }
        const v2PlutusScripts = CSL.PlutusScripts.new()
        plutusScriptV2.forEach(scriptHex => {
            v2PlutusScripts.add(scriptHex)
        })
        tx.witness_set.plutus_scripts = v2PlutusScripts.to_js_value()
        const updatedWitness = CSL.TransactionWitnessSet.from_json(JSON.stringify(tx.witness_set))
        console.log("Mesh V2 Tx: ", CSL.Transaction.from_json(JSON.stringify(tx)).to_hex());
        return CSL.Transaction.new(txBody, updatedWitness, txAuxData)
    }
    function updatePPviews(redeemers: CSL.Redeemers, txBody: CSL.TransactionBody, datum?: CSL.PlutusList) {
        const costModel = CSL.TxBuilderConstants.plutus_vasil_cost_models().get(CSL.Language.new_plutus_v2())
        const costModels = CSL.Costmdls.new()
        if (costModel) costModels.insert(CSL.Language.new_plutus_v2(), costModel)
        const scriptDataHash = CSL.hash_script_data(redeemers, costModels, datum)
        txBody.set_script_data_hash(scriptDataHash)
        return txBody
    }
    try {
        const tx = new Transaction({ initiator: walletData });
        tx.setTxRefInputs(referenceUtxo)
        tx.redeemValue({
            value: depositUtxo,
            script: simpleScript,
            datum: depositUtxo,
            redeemer: simpleRedeemer
        })
        tx.setCollateral(collateral)
        tx.sendLovelace({ address: outputAddr }, "4000000");
        const unsignedMeshTx = await tx.build();
        const meshTxWithNullPlutusData = (CSL.Transaction.from_hex(unsignedMeshTx).to_js_value())
        meshTxWithNullPlutusData.witness_set.plutus_data = undefined

        // updating script data hash after setting witness datum null
        const meshTxBody = CSL.Transaction.from_json(JSON.stringify(meshTxWithNullPlutusData)).body()
        const meshTxWitness = CSL.Transaction.from_json(JSON.stringify(meshTxWithNullPlutusData)).witness_set()
        const meshRedeemers = meshTxWitness.redeemers()
        const meshPlutusData = meshTxWitness.plutus_data()
        if (meshRedeemers) {
            const updatedMeshTxBody = updatePPviews(meshRedeemers, meshTxBody, meshPlutusData)
            meshTxWithNullPlutusData.body = updatedMeshTxBody.to_js_value()
        }
        const changedToPlutusV2 = toPlutusV2(meshTxWithNullPlutusData).to_hex()
        console.log("check in cbor: ", changedToPlutusV2); // This gives PlutusScriptV1 (index 3)
        const signedTx = await walletData.signTx
            (changedToPlutusV2
                , true)
        const txHash = await walletData.submitTx(signedTx);
        return txHash;
    }
    catch (error) {
        console.log(error, 'error')
    }
};

// Script Data Hashes from different cost models: 
// "c1db80cbfdc585710e73fb6f6520bfe743e75f3e1e3d7bf0bad51892e3feaa46" --unchanged 
// "712078372500f941e748a58447cb52ae27b1e38dea859e204f19213e23abff16" --vasil
// "fdb250853abdfc325f019323a23affcb480ff86b2f07e459c041b1c601c9391f" --alonzo
// "712078372500f941e748a58447cb52ae27b1e38dea859e204f19213e23abff16" --default