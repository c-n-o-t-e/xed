// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.7.6;

import './PoolAddress.sol';

//https://forum.openzeppelin.com/t/how-to-compute-the-create2-address-for-a-minimal-proxy/3595/2

//@notice compute the INIT_HASH_CODE for determisnitic pool address
contract Bytecode {
    constructor() {}

    function compute(
        address factory,
        address poolImplementation,
        address token0,
        address token1,
        uint256 fee
    ) external pure returns (bytes32 bytecodeHash, address pool) {
        bytes32 salt = keccak256(abi.encode(token0, token1, fee));
        bytecodeHash = keccak256(getContractCreationCode(poolImplementation));
        bytes32 _data = keccak256(abi.encodePacked(bytes1(0xff), factory, salt, bytecodeHash));
        pool = address(uint160(uint256(_data)));
    }

    function computePoolAddress(
        address factory,
        address tokenA,
        address tokenB,
        uint24 fee
    ) external pure returns (address pool) {
        PoolAddress.PoolKey memory key = PoolAddress.getPoolKey(tokenA, tokenB, fee);
        pool = PoolAddress.computeAddress(factory, key);
    }

    function getContractCreationCode(address logic) internal pure returns (bytes memory) {
        bytes10 creation = 0x3d602d80600a3d3981f3;
        bytes10 prefix = 0x363d3d373d3d3d363d73;
        bytes20 targetBytes = bytes20(logic);
        bytes15 suffix = 0x5af43d82803e903d91602b57fd5bf3;
        return abi.encodePacked(creation, prefix, targetBytes, suffix);
    }
}
