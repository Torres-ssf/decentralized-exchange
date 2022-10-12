// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {

  address public feeAccount;
  uint256 public feePercent;
  mapping(address => mapping(address => uint256)) public tokens;

  event Deposit(
    address token,
    address user,
    uint256 amount,
    uint256 balance
  );

  constructor(address _feeAccount, uint256 _feePercent) {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }

  function depositToken(address _token, uint256 _amount) public {
    require(Token(_token).transferFrom(msg.sender, address(this), _amount));

    tokens[_token][msg.sender] += _amount;

    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  function balanceOf(address _token, address _user) public view returns (uint256) {
    return tokens[_token][_user];
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
