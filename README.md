# Pearl V2

This repository contains the core and periphery smart contracts for the [PearlV2](https://www.pearl.exchange) Protocol

## Local deployment

In order to deploy this code to a local testnet, you should use

'artifacts/contracts/**.sol/**.json'

// deploy the bytecode

```
This will ensure that you are testing against the same bytecode that is deployed to
mainnet and public testnets, and all Uniswap code will correctly interoperate with
your local deployment.
```

Licensing

The primary license for Uniswap V3 Core is the Business Source License 1.1 (BUSL-1.1), see LICENSE. However, some files are dual licensed under GPL-2.0-or-later:

All files in contracts/interfaces/ may also be licensed under GPL-2.0-or-later (as indicated in their SPDX headers), see contracts/interfaces/LICENSE
Several files in contracts/libraries/ may also be licensed under GPL-2.0-or-later (as indicated in their SPDX headers), see contracts/libraries/LICENSE
Other Exceptions

contracts/libraries/FullMath.sol is licensed under MIT (as indicated in its SPDX header), see contracts/libraries/LICENSE_MIT
All files in contracts/test remain unlicensed (as indicated in their SPDX headers).
