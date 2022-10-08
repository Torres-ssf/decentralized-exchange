// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract Token {
    string public name = "Torres Token";
    string public symbol = "TT";
    uint256 public decimals = 18;
    uint256 public totalSupply = 1000000 * (10**decimals);
}
