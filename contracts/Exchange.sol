// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {

  address public feeAccount;
  uint256 public feePercent;
  uint256 public orderCount;
  mapping(address => mapping(address => uint256)) public tokens;
  mapping(uint256 => Order) public orders;

  struct Order {
    uint256 id;
    address user;
    address tokenGet;
    uint256 amountGet;
    address tokenGive;
    uint256 amountGive;
    uint256 timestamp;
  }

  event Deposit(
    address token,
    address user,
    uint256 amount,
    uint256 balance
  );

  event Withdraw(
    address token,
    address user,
    uint256 amount,
    uint256 balance
  );

  event OrderCreate(
    uint256 id,
    address user,
    address tokenGet,
    uint256 amountGet,
    address tokenGive,
    uint256 amountGive,
    uint256 timestamp
  );

  constructor(address _feeAccount, uint256 _feePercent) {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }

  function depositToken(address _token, uint256 _amount) public returns(bool) {
    require(Token(_token).transferFrom(msg.sender, address(this), _amount));

    tokens[_token][msg.sender] += _amount;

    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);

    return true;
  }

  function withdrawToken(address _token, uint256 _amount) public returns(bool) {
    require(tokens[_token][msg.sender] >= _amount, 'insufficient balance');

    require(Token(_token).transfer(msg.sender, _amount));

    tokens[_token][msg.sender] -= _amount;

    emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);

    return true;
  }

  function balanceOf(address _token, address _user) public view returns (uint256) {
    return tokens[_token][_user];
  }

  function makeOrder(
    address _tokenGet,
    uint256 _amountGet,
    address _tokenGive,
    uint256 _amountGive
  ) public {
    require(balanceOf(_tokenGive, msg.sender) >= _amountGive, 'insufficient balance');

    orderCount += 1;

    uint256 timestamp = block.timestamp;

    orders[orderCount] = Order(
      orderCount,
      msg.sender,
      _tokenGet,
      _amountGet,
      _tokenGive,
      _amountGive,
      timestamp
    );

    emit OrderCreate(
      orderCount,
      msg.sender,
      _tokenGet,
      _amountGet,
      _tokenGive,
      _amountGive,
      timestamp
    );

  }

}
