// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

import './IUniswapV3Pool.sol';

/// @title Permissionless pool actions
/// @notice Contains pool methods
interface IPearlV2Pool is IUniswapV3Pool {
    /// @notice initial parameters for the pool
    /// @dev The parameters are called from the pearlV2Factory
    function setup() external;

    /// @notice Swap token0 for token1, or token1 for token0 (tokens that have fee on transfer or rounding rebase tokens)
    /// @dev The caller of this method receives a callback in the form of IUniswapV3SwapCallback#uniswapV3SwapCallback
    /// @param sender The address to sender the input of the swap
    /// @param recipient The address to receive the output of the swap
    /// @param zeroForOne The direction of the swap, true for token0 to token1, false for token1 to token0
    /// @param amountSpecified The amount of the swap, which implicitly configures the swap as exact input (positive), or exact output (negative)
    /// @param sqrtPriceLimitX96 The Q64.96 sqrt price limit. If zero for one, the price cannot be less than this
    /// value after the swap. If one for zero, the price cannot be greater than this value after the swap
    /// @param data Any data to be passed through to the callback
    /// @return amount0 The delta of the balance of token0 of the pool, exact when negative, minimum when positive
    /// @return amount1 The delta of the balance of token1 of the pool, exact when negative, minimum when positive
    function swapFeeOnTransfer(
        address sender,
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96,
        bytes calldata data
    ) external returns (int256 amount0, int256 amount1);

    // /// @notice Sets the initial price for the pool
    // /// @dev Price is represented as a sqrt(amountToken1/amountToken0) Q64.96 value
    // /// @param sqrtPriceX96 the initial sqrt price of the pool as a Q64.96
    // function initialize(uint160 sqrtPriceX96) external;

    /// @notice Returns the address of the gauge for the pool
    /// @return The address of the gauge
    function gauge() external view returns (address);

    /// @notice The amounts of token0 and token1 that are skimmed from the pool
    /// @dev Rebase amount will never exceed uint256 max in either token
    function rebaseAmount() external view returns (uint256 token0, uint256 token1);

    /// @notice Return the reserve amounts of token0 in the pool
    function reserve0() external view returns (uint256);

    /// @notice Return the reserve amounts of token1 in the pool
    function reserve1() external view returns (uint256);

    /// @notice skim rebasing tokens
    /// @dev Reabse amount will skimmed at the time of the rebase
    /// by the rebase proxy
    function skim() external;

    /// @notice set gauge address
    /// @param _gauge address of the gauge attached to the pool for reward staking
    function setGauge(address _gauge) external;

    /// @notice Emitted when the gauge address for lp staking
    event GaugeChanged(address gauge);
}
