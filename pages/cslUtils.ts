import * as CSL from "@emurgo/cardano-serialization-lib-asmjs"

export function resolveStakeKeyHash(addr: any) {
    const cslAddress = CSL.Address.from_hex(addr)
    return (CSL.BaseAddress.from_address(cslAddress)?.stake_cred().to_hex())
}

export function resolvePaymentKeyHash(addr: any) {
    const cslAddress = CSL.Address.from_hex(addr)
    return (CSL.BaseAddress.from_address(cslAddress)?.payment_cred().to_hex())
}