/* eslint-disable prefer-const */
import { BigDecimal, Address } from "@graphprotocol/graph-ts/index";
import { Pair, Token, Bundle } from "../../generated/schema";
import { ZERO_BD, factoryContract, ADDRESS_ZERO, ONE_BD } from "./utils";

// TODO: Farms & Pools are using only USDC pair for calculating ETH price
let WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
let USDC_WETH_PAIR = "0x2d22e163ae5fd9c7b529e0864b69c204a895bc30"; // created block 12774680
// let USDT_WETH_PAIR = "0x5feE0c80d26cC393e48F0774A56f0362E82b76e4"; // created block 	12774710
let USDT_WETH_PAIR = "";

export function getEthPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let usdcPair = Pair.load(USDC_WETH_PAIR); // usdc is token0
  let usdtPair = Pair.load(USDT_WETH_PAIR); // usdt is token1

  if (usdcPair !== null && usdtPair !== null) {
    let totalLiquidityETH = usdcPair.reserve1.plus(usdtPair.reserve0);
    if (totalLiquidityETH.notEqual(ZERO_BD)) {
      let usdcWeight = usdcPair.reserve1.div(totalLiquidityETH);
      let usdtWeight = usdtPair.reserve0.div(totalLiquidityETH);
      return usdcPair.token0Price.times(usdcWeight).plus(usdtPair.token1Price.times(usdtWeight));
    } else {
      return ZERO_BD;
    }
  } else if (usdcPair !== null) {
    return usdcPair.token0Price;
  } else if (usdtPair !== null) {
    return usdtPair.token1Price;
  } else {
    return ZERO_BD;
  }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
  "0x46884d7849223e057226a69e5f8215d6ff1b8bd6", // WETH
  "0x9c8fa1ee532f8afe9f2e27f06fd836f3c9572f71", // USDC
  "0x897ad6a487bd9b490d537b3860860863ae414f1e", // USDT
  // "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
  // "0x23396cf899ca06c4472205fc903bdb4de249d6fc", // UST
  // "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", // BTCB
  // "0x2170ed0880ac9a755fd29b2688956bd959f933f8", // WETH
];

// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString("1");

/**
 * Search through graph to find derived ETH per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export function findEthPerToken(token: Token): BigDecimal {
  if (token.id == WETH_ADDRESS) {
    return ONE_BD;
  }
  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]));
    if (pairAddress.toHex() != ADDRESS_ZERO) {
      let pair = Pair.load(pairAddress.toHex());
      if (pair.token0 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
        let token1 = Token.load(pair.token1);
        return pair.token1Price.times(token1.derivedETH as BigDecimal); // return token1 per our token * ETH per token 1
      }
      if (pair.token1 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
        let token0 = Token.load(pair.token0);
        return pair.token0Price.times(token0.derivedETH as BigDecimal); // return token0 per our token * ETH per token 0
      }
    }
  }
  return ZERO_BD; // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export function getTrackedVolumeUSD(
  bundle: Bundle,
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let price0 = token0.derivedETH.times(bundle.ethPrice);
  let price1 = token1.derivedETH.times(bundle.ethPrice);

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1)).div(BigDecimal.fromString("2"));
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0);
  }

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1);
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD;
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedLiquidityUSD(
  bundle: Bundle,
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let price0 = token0.derivedETH.times(bundle.ethPrice);
  let price1 = token1.derivedETH.times(bundle.ethPrice);

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1));
  }

  // take double value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).times(BigDecimal.fromString("2"));
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1).times(BigDecimal.fromString("2"));
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD;
}
