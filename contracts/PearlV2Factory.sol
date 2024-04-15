// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import "openzeppelin/contracts/access/AccessControl.sol";
import "openzeppelin/contracts/proxy/Clones.sol";
import "./interfaces/IPearlV2PoolFactory.sol";
import "./interfaces/IPearlV2Pool.sol";
import "./NoDelegateCall.sol";

/// @title Canonical Uniswap V3 factory
/// @notice Deploys PearlV2 pools and manages ownership and control over pool protocol fees
contract PearlV2Factory is IPearlV2PoolFactory, AccessControl, NoDelegateCall {
    using Clones for address;

    struct Parameters {
        address factory;
        address token0;
        address token1;
        uint24 fee;
        int24 tickSpacing;
    }

    bytes32 public constant POOL_MANAGER = keccak256("POOL_MANAGER");
    // gauge manager role to set the gauge address in the pool
    bytes32 public constant GAUGE_MANAGER = keccak256("GAUGE_MANAGER");
    // manager role to set the rebase proxy address in the pool
    bytes32 public constant POOL_REBASE_PROXY_MANAGER = keccak256("POOL_REBASE_PROXY_MANAGER");
    // protocol owned rebase controller
    bytes32 public constant ADMIN_REBASE_PROXY = keccak256("ADMIN_REBASE_PROXY");

    /// @inheritdoc IPearlV2PoolFactory
    Parameters public override parameters;

    /// @inheritdoc IPearlV2PoolFactory
    address[] public override allPairs;

    /// @inheritdoc IPearlV2PoolFactory
    address public override poolImplementation;

    /// @inheritdoc IPearlV2PoolFactory
    address public override poolManager;

    /// @inheritdoc IPearlV2PoolFactory
    address public override gaugeManager;

    /// @inheritdoc IPearlV2PoolFactory
    mapping(address => address) public override poolRebaseProxy; // pool => rebaseProxy

    /// @inheritdoc IPearlV2PoolFactory
    mapping(uint24 => int24) public override feeAmountTickSpacing;

    /// @inheritdoc IPearlV2PoolFactory
    mapping(address => mapping(address => mapping(uint24 => address))) public override getPool;

    mapping(address => bool) public isPair; // simplified check if its a pair, given that `stable` flag might not be available in peripherals

    event GaugeManagerChanged(address oldAddress, address newAddress);
    event PoolManagerChanged(address oldAddress, address newAddress);
    event PoolImplementationChanged(address oldAddress, address newAddress);
    event PoolRebaseProxyChanged(address indexed poolAddress, address oldProxyAddress, address newProxyAddress);

    constructor(address _initialOwner, address _poolImplementation) {
        require(_initialOwner != address(0) || _poolImplementation != address(0), "zero addr");

        // setup admin and manager roles
        _setupRole(DEFAULT_ADMIN_ROLE, _initialOwner);
        _setupRole(POOL_MANAGER, _initialOwner);
        _setupRole(GAUGE_MANAGER, _initialOwner);

        poolImplementation = _poolImplementation;

        feeAmountTickSpacing[100] = 1;
        emit FeeAmountEnabled(100, 1);
        feeAmountTickSpacing[500] = 10;
        emit FeeAmountEnabled(500, 10);
        feeAmountTickSpacing[3000] = 60;
        emit FeeAmountEnabled(3000, 60);
        feeAmountTickSpacing[10000] = 200;
        emit FeeAmountEnabled(10000, 200);
    }

    /// @dev Prevents calling a function from anyone except the owner
    modifier onlyOwner() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    /// @inheritdoc IPearlV2PoolFactory
    function setPoolRebaseProxy(address _pool, address _rebaseProxy) external override {
        require(hasRole(POOL_REBASE_PROXY_MANAGER, msg.sender), "!proxyManager");
        require(_pool != address(0) && _rebaseProxy != address(0), "zero addr");
        emit PoolRebaseProxyChanged(_pool, poolRebaseProxy[_pool], _rebaseProxy);
        poolRebaseProxy[_pool] = _rebaseProxy;
    }

    function setPoolImplementation(address _poolImplementation) external onlyOwner {
        require(_poolImplementation != address(0), "zero addr");
        emit PoolImplementationChanged(poolImplementation, _poolImplementation);
        poolImplementation = _poolImplementation;
    }

    /// @inheritdoc IPearlV2PoolFactory
    function createPool(address tokenA, address tokenB, uint24 fee)
        external
        override
        noDelegateCall
        returns (address pool)
    {
        require(tokenA != tokenB);
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0));
        int24 tickSpacing = feeAmountTickSpacing[fee];
        require(tickSpacing != 0);
        require(getPool[token0][token1][fee] == address(0));
        pool = deploy(address(this), token0, token1, fee, tickSpacing);
        getPool[token0][token1][fee] = pool;
        // populate mapping in the reverse direction, deliberate choice to avoid the cost of comparing addresses
        getPool[token1][token0][fee] = pool;
        allPairs.push(pool);
        isPair[pool] = true;
        emit PoolCreated(token0, token1, fee, tickSpacing, pool);
    }

    // @dev Deploys a pool with the given parameters by transiently setting the parameters storage slot and then
    /// clearing it after deploying the pool.
    /// @param factory The contract address of the Uniswap V3 factory
    /// @param token0 The first token of the pool by address sort order
    /// @param token1 The second token of the pool by address sort order
    /// @param fee The fee collected upon every swap in the pool, denominated in hundredths of a bip
    /// @param tickSpacing The spacing between usable ticks
    function deploy(address factory, address token0, address token1, uint24 fee, int24 tickSpacing)
        internal
        returns (address pool)
    {
        parameters = Parameters({factory: factory, token0: token0, token1: token1, fee: fee, tickSpacing: tickSpacing});
        bytes32 salt = keccak256(abi.encode(token0, token1, fee));
        pool = poolImplementation.cloneDeterministic(salt);
        IPearlV2Pool(pool).setup();
        delete parameters;
    }

    /// @inheritdoc IPearlV2PoolFactory
    function initializePoolPrice(address pool, uint160 sqrtPriceX96) external override {
        IPearlV2Pool(pool).initialize(sqrtPriceX96);
    }

    /// @inheritdoc IPearlV2PoolFactory
    function setPoolGauge(address pool, address _gauge) external override {
        require(hasRole(POOL_MANAGER, msg.sender) || hasRole(GAUGE_MANAGER, msg.sender), "PearlV2Factory: !manager");
        require(_gauge != address(0), "PearlV2Factory: !gauge");
        IPearlV2Pool(pool).setGauge(_gauge);
    }

    /// @inheritdoc IPearlV2PoolFactory
    function enableFeeAmount(uint24 fee, int24 tickSpacing) public override onlyOwner {
        require(fee < 1000000);
        // tick spacing is capped at 16384 to prevent the situation where tickSpacing is so large that
        // TickBitmap#nextInitializedTickWithinOneWord overflows int24 container from a valid tick
        // 16384 ticks represents a >5x price change with ticks of 1 bips
        require(tickSpacing > 0 && tickSpacing < 16384);
        require(feeAmountTickSpacing[fee] == 0);

        feeAmountTickSpacing[fee] = tickSpacing;
        emit FeeAmountEnabled(fee, tickSpacing);
    }

    /// @inheritdoc IPearlV2PoolFactory
    function allPairsLength() external view override returns (uint256) {
        return allPairs.length;
    }

    /// @inheritdoc IPearlV2PoolFactory
    function isRebaseProxy(address _pool, address _manager) external view override returns (bool) {
        // admin proxy roles are allowed to skim all the pools where as pool proxy can skim specific pool
        return (hasRole(ADMIN_REBASE_PROXY, _manager) || poolRebaseProxy[_pool] == _manager);
    }
}
