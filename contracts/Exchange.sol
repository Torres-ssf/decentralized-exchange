// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract Exchange {

  address public feeAccount;
  uint256 public feePercent;

  constructor(address _feeAccount, uint256 _feePercent) {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }

  // It should be possible to:
  // 1 - Deposit tokens
  // 2 - Withdraw tokens
  // 3 - Check balance
  // 4 - Make orders
  // 5 - Cancel Orders
  // 6 - Fill Orders
  // 7 - Charge Fees
  // 8 - Track fee account - DONE

}
