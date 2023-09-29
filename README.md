## How To Build
- create a blockfrost preview network key and set it in /pages/config.ts
- in the terminal, install dependencies and packages
    ```bash
    yarn
    ```
- run the app 
    ```bash
    yarn run dev
    ```
- the mint button will give detials about the multisig contract. it works fine so there is no need to look into it.    
- the withdraw button is supposed to withdraw the funds from a contract which requires exactly one reference input which is a UTxO with a specific token. the details are available in `Withdraw.tsx`
- the simpleTx button will send some ada to a specific address in the output. details are available in SimpleTx.tsx

## Problems
- Mesh somehow converts V2 transactions to V1 in `Withdraw.tsx`
- Tried using CSL to convert V2 script to V1 but it is not working.  
- also set plutus_data in witness_set to null/undefined and made changes to the script_data_hash accordiongly
- the different script data hashes generated using different cost models are available at the end of `Withdraw.tsx`

## Issues Discovered
- there is no issue creating and building simple transactions as in `SimpleTx.tsx`
- there is a version conflict (to my knowledge, i might be wrong) while executing a `Withdraw.tsx`