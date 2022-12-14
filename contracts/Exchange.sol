// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {

  address public feeAccount;
  uint256 public feePercent;
  uint256 public orderCount;
  mapping(address => mapping(address => uint256)) public tokens;
  mapping(address => mapping(address => uint256)) public tokensInOrders;
  mapping(uint256 => Order) public orders;
  mapping(uint256 => bool) public canceledOrders;
  mapping(uint256 => bool) public filledOrders;

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

  event OrderCreated(
    uint256 id,
    address user,
    address tokenGet,
    uint256 amountGet,
    address tokenGive,
    uint256 amountGive,
    uint256 timestamp
  );

  event OrderCanceled(
    uint256 id,
    address user,
    address tokenGet,
    uint256 amountGet,
    address tokenGive,
    uint256 amountGive,
    uint256 timestamp
  );

  event OrderFilled(
    uint256 id,
    address user,
    address creator,
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

    tokens[_tokenGive][msg.sender] -= _amountGive;
    tokensInOrders[_tokenGive][msg.sender] += _amountGive;

    orders[orderCount] = Order(
      orderCount,
      msg.sender,
      _tokenGet,
      _amountGet,
      _tokenGive,
      _amountGive,
      timestamp
    );

    emit OrderCreated(
      orderCount,
      msg.sender,
      _tokenGet,
      _amountGet,
      _tokenGive,
      _amountGive,
      timestamp
    );

  }

  function cancelOrder(uint256 _id) public {
    Order storage _order = orders[_id];

    require(_order.id == _id, 'order not found');
    require(_order.user == msg.sender, 'not authorized');
    require(!filledOrders[_order.id], 'order was already filled');
    require(!canceledOrders[_order.id], 'order is already canceled');

    canceledOrders[_order.id] = true;

    tokensInOrders[_order.tokenGive][msg.sender] -= _order.amountGive;
    tokens[_order.tokenGive][msg.sender] += _order.amountGive;

    emit OrderCanceled(
      orderCount,
      msg.sender,
      _order.tokenGet,
      _order.amountGet,
      _order.tokenGive,
      _order.amountGive,
      _order.timestamp
    );
  }

  function fillOrder(uint256 _id) public {
    Order storage _order = orders[_id];

    require(_order.id == _id, 'order not found');
    require(_order.user != msg.sender, 'cannot fill your own order');
    require(!canceledOrders[_order.id], 'order has been canceled');
    require(!filledOrders[_order.id], 'order is already filled');

    _trade(
      _order.id,
      _order.user,
      _order.tokenGet,
      _order.amountGet,
      _order.tokenGive,
      _order.amountGive
    );

    emit OrderFilled(
      orderCount,
      msg.sender,
      _order.user,
      _order.tokenGet,
      _order.amountGet,
      _order.tokenGive,
      _order.amountGive,
      _order.timestamp
    );

  }

  function _trade(
    uint256 _orderId,
    address _user,
    address _tokenGet,
    uint256 _amountGet,
    address _tokenGive,
    uint256 _amountGive
  ) internal {

    uint256 _feeAmount = (_amountGet * feePercent) / 100;
    uint256 _orderTotal = _amountGet + _feeAmount;

    require(balanceOf(_tokenGet, msg.sender) >= _orderTotal, 'insufficient balance');

    tokens[_tokenGet][msg.sender] -= _orderTotal;
    tokens[_tokenGet][_user] += _amountGet;

    tokens[_tokenGet][feeAccount] += _feeAmount;

    tokensInOrders[_tokenGive][_user] -= _amountGive;
    tokens[_tokenGive][msg.sender] += _amountGive;

    filledOrders[_orderId] = true;

  }

}
