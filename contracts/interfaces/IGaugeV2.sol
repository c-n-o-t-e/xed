// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

interface IGaugeV2 {
    /**
     * @notice notify reward amount from the distribution
     * @dev reward is distributed at each epoch based on voting weights
     * @param targetTick current tick value of the pool.
     * @param zeroForOne the direction of the swap.
     * @return bool for tick cross if liquidity was staked
     */
    function crossTo(int24 targetTick, bool zeroForOne) external returns (bool);
}
