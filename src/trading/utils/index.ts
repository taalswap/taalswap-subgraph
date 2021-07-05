/* eslint-disable prefer-const */
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Pair } from "../../../generated/templates/Pair/Pair";

export let BI_ZERO = BigInt.fromI32(0);
export let BI_ONE = BigInt.fromI32(1);
export let BD_ZERO = BigDecimal.fromString("0");
export let BD_1E18 = BigDecimal.fromString("1e18");

export let TRACKED_PAIRS: string[] = [
  "0x65f1eb2bcb4b1d9a043366de732f0f7e055d2fab", // WETH/USDC
  "0x112ee1ffbaebc34e3131815f8f3772dc94ffb7f6", // TAL/WETH
  // "0x70d8929d04b60af4fb9b58713ebcf18765ade422", // ETH/WETH
  // "0x7561eee90e24f3b348e1087a005f78b4c8453524", // BTCB/WETH
];

export function getEthPriceInUSD(): BigDecimal {
  // Bind WETH/BUSD contract to query the pair.
  let pairContract = Pair.bind(Address.fromString(TRACKED_PAIRS[0]));

  // Fail-safe call to get ETH price as BUSD.
  let reserves = pairContract.try_getReserves();
  if (!reserves.reverted) {
    let reserve0 = reserves.value.value0.toBigDecimal().div(BD_1E18);
    let reserve1 = reserves.value.value1.toBigDecimal().div(BD_1E18);

    if (reserve0.notEqual(BD_ZERO)) {
      return reserve1.div(reserve0);
    }
  }

  return BD_ZERO;
}
