// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./Token.sol";

contract Exchange {
    using SafeMath for uint256;

    // State Variables
    address public feeAccount; // account receiving exchange fees
    uint256 public feePercent; // exchange fee amount
    address constant ETHER = address(0); // stores Ether in tokens mapping
    uint256 public orderCount; // tracks the number of orders placed on exchange

    mapping(address => mapping(address => uint256)) public tokens; // tracks the users that own each token
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public ordersCancelled;
    mapping(uint256 => bool) public ordersFilled;

    // Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdrawal(
        address token,
        address user,
        uint256 amount,
        uint256 balance
    );
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Trade(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address userFill,
        uint256 timestamp
    );

    // Structs
    struct _Order {
        uint256 id;
        address user; // order  creator
        address tokenGet; // address of token to be purchased
        uint256 amountGet; // amount of token to be purchased
        address tokenGive; // address of token to be provided
        uint256 amountGive; // amount of token to be provided
        uint256 timestamp; // time when order was created
    }

    constructor(address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // fallback function reverts if ether sent directly to Exchange contract
    function() external {
        revert();
    }

    function createOrder() public returns (bool success) {}

    function depositEther() public payable {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function withdrawEther(uint256 _amount) public payable {
        require(tokens[ETHER][msg.sender] >= _amount);
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        msg.sender.transfer(_amount);
        emit Withdrawal(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }

    function depositToken(address _token, uint256 _amount) public {
        require(Token(_token).transferFrom(msg.sender, address(this), _amount)); // generates an instance of the Token contract on the Ethereum network
        require(_token != ETHER);
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) public {
        require(tokens[_token][msg.sender] >= _amount);
        require(_token != ETHER);
        require(Token(_token).transfer(msg.sender, _amount)); // generates an instance of the Token contract on the Ethereum network
        //require(_token != ETHER);
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        emit Withdrawal(
            _token,
            msg.sender,
            _amount,
            tokens[_token][msg.sender]
        );
    }

    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        /*
        _Order memory order = _Order({
            id: 9876,
            user: msg.sender,
            tokenGet: _tokenGet,
            amountGet: _amountGet,
            tokenGive: _tokenGive,
            amountGive: _amountGive,
            timestamp: now
        });
        */
        orderCount = orderCount.add(1);
        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            now
        );
        emit Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            now
        );
    }

    function cancelOrder(uint256 _id) public {
        _Order storage _order = orders[_id];
        require(msg.sender == address(_order.user));
        require(_id == _order.id);
        ordersCancelled[_id] = true;
        emit Cancel(
            _order.id,
            _order.user,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive,
            now
        );
    }

    function fillOrder(uint256 _id) public {
        require(_id > 0 && _id <= orderCount);
        require(!ordersCancelled[_id]);
        require(!ordersFilled[_id]);
        // fetch the order
        _Order storage _order = orders[_id];
        _trade(
            _order.id,
            _order.user,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive
        );
        ordersFilled[_order.id] = true;
    }

    function _trade(
        uint256 _orderId,
        address _user,
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) internal {
        // fee is subtracted from the amount received by the address that fills the order
        uint256 _feeAmount = _amountGive.mul(feePercent).div(100);

        tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(
            _amountGet.add(_feeAmount)
        );
        tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);
        tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(
            _feeAmount
        );

        tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
        tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(
            _amountGive
        );
        emit Trade(
            _orderId,
            _user,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            msg.sender,
            now
        );
        // mark order as filled
    }
}
