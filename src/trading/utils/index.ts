/* eslint-disable prefer-const */
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Pair } from "../../../generated/templates/Pair/Pair";

export let BI_ZERO = BigInt.fromI32(0);
export let BI_ONE = BigInt.fromI32(1);
export let BD_ZERO = BigDecimal.fromString("0");
export let BD_1E18 = BigDecimal.fromString("1e18");

export let TRACKED_PAIRS: string[] = [
  "0xd3ebd345775b0491e8842fdbad71256f5b15bf8a", // WETH/USDT
  "0x0f8c6983fed6617dc72874b17c4849e765bafc23", // TAL/WETH
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
