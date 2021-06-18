/* eslint-disable prefer-const */
import { Address, BigDecimal, log } from "@graphprotocol/graph-ts";
import { Bundle, Competition, Team, User } from "../../generated/schema";
import { Swap } from "../../generated/templates/Pair/Pair";
import { BD_1E18, BI_ONE, TRACKED_PAIRS } from "./utils";

/**
 * SWAP
 */

export function handleSwap(event: Swap): void {
  let competition = Competition.load("1");
  // Competition is not in progress, ignoring trade.
  if (competition.status.notEqual(BI_ONE)) {
    log.info("Competition is not in progress, ignoring trade; status: {}", [competition.status.toString()]);
    return;
  }

  // User is not registered for the competition, skipping.
  let user = User.load(event.transaction.from.toHex());
  if (user === null) {
    log.info("User is not registered, ignoring trade; user: {}", [event.transaction.from.toHex()]);
    return;
  }

  // We load other entities as the trade is doomed valid and competition is in progress.
  let bundle = Bundle.load("1");
  let team = Team.load(user.team);

  let ethIN: BigDecimal;
  let ethOUT: BigDecimal;

  if (event.address.equals(Address.fromString(TRACKED_PAIRS[0]))) {
    ethIN = event.params.amount0In.toBigDecimal().div(BD_1E18);
    ethOUT = event.params.amount0Out.toBigDecimal().div(BD_1E18);
  } else {
    ethIN = event.params.amount1In.toBigDecimal().div(BD_1E18);
    ethOUT = event.params.amount1Out.toBigDecimal().div(BD_1E18);
  }

  let volumeETH = ethOUT.plus(ethIN);
  let volumeUSD = volumeETH.times(bundle.ethPrice);

  log.info("Volume: {} for {} ETH, or {} USD", [
    event.transaction.from.toHex(),
    volumeETH.toString(),
    volumeUSD.toString(),
  ]);

  user.volumeUSD = user.volumeUSD.plus(volumeUSD);
  user.volumeETH = user.volumeETH.plus(volumeETH);
  user.txCount = user.txCount.plus(BI_ONE);
  user.save();

  // Team statistics.
  team.volumeUSD = team.volumeUSD.plus(volumeUSD);
  team.volumeETH = team.volumeETH.plus(volumeETH);
  team.txCount = team.txCount.plus(BI_ONE);
  team.save();

  // Competition statistics.
  competition.volumeUSD = competition.volumeUSD.plus(volumeUSD);
  competition.volumeETH = competition.volumeETH.plus(volumeETH);
  competition.txCount = competition.txCount.plus(BI_ONE);
  competition.save();
}
