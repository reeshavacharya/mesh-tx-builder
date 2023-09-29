
import { blockfrost, multisig } from "./config"


export function listVault() {
    return getBlockfrost("/addresses/" + multisig.vaultContract.address + "/utxos?order=desc")
}

export function getAssetDetail(asset: string) {
    return getBlockfrost("/assets/" + asset)
}

export function getDatum(hash: string) {
    return getBlockfrost("/scripts/datum/" + hash)
}
export function getTransactionDetails(txHash: any) {
    return getBlockfrost("/txs/" + txHash + "/utxos")
}

export function getTransactions(addr: any) {
    return getBlockfrost("/addresses/" + addr + "/utxos")
}

function getBlockfrost(path: any) {
    const url = blockfrost.apiUrl + path
    return fetch(url, { 
        headers: { project_id: blockfrost.apiKey }
    }).then(res => {
        if (res.status === 200) {
            return res.json()
        } else {
            return res.text().then(txt => {
                let err
                let json: any
                try {
                    json = JSON.parse(txt)
                    if (json) {
                        err = Error(`BlockfrostApi [Status ${res.status}] : ${json.message ? json.message : txt}`)
                    } else {
                        err = Error(`BlockfrostApi [Status ${res.status}] : ${txt}`)
                    }
                } catch (e) {
                    err = Error(`BlockfrostApi [Status ${res.status}] : ${txt}`)
                }
                throw (err)
            })
        }
    })
}