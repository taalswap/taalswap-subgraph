# TaalSwap Subgraph

TheGraph exposes a GraphQL endpoint to query the events and entities within the Ethereum and TaalSwap ecosystem.

Currently, there are multiple subgraphs, but additional subgraphs can be added to this repo:

1. **[Blocks](https://thegraph.com/explorer/subgraph/taalswap/blocks)**: Tracks all blocks on Ethereum.

2. **[Pairs](https://thegraph.com/explorer/subgraph/taalswap/pairs)**: Tracks all TaalSwap Pairs and Tokens.

3. **[Exchange](https://thegraph.com/explorer/subgraph/taalswap/exchange)**: Tracks all TaalSwap Exchange data with price, volume, liquidity, ...

4. **[Profile](https://thegraph.com/explorer/subgraph/taalswap/profile)**: Tracks all TaalSwap Profile with teams, users, points and campaign.

5. **[Timelock](https://thegraph.com/explorer/subgraph/taalswap/timelock)**: Tracks all timelock transactions queued, executed, and cancelled.

6. **[SmartChef](https://thegraph.com/explorer/subgraph/taalswap/smartchef)**: Tracks all TaalSwap SmartChef (also known as Pools) contract, with related tokens.

7. **[Trading Competition v1](https://thegraph.com/explorer/subgraph/taalswap/trading-competition-v1)**: Tracks all metrics for the Easter Battle (April 07—14, 2021).

## To setup and deploy

For any of the subgraph: `blocks` as `[subgraph]`

1. Run the `yarn run codegen:[subgraph]` command to prepare the TypeScript sources for the GraphQL (generated/*).

2. Run the `yarn run build:[subgraph]` command to build the subgraph, and check compilation errors before deploying.

3. Run `graph auth https://api.thegraph.com/deploy/ '<ACCESS_TOKEN>'`

4. Deploy via `yarn run deploy:[subgraph]`.
