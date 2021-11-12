// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Token {
    using SafeMath for uint256;

    // State Variables
    string public name = "OSD Token"; // optional
    string public symbol = "OSD"; // optional
    uint256 public decimals = 18; // optional
    uint256 public totalSupply; // required
    string tempVariable = "tempVariable";

    mapping(address => uint256) public balanceOf; // required
    mapping(address => mapping(address => uint256)) public allowance; // required

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value); // required
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    ); // required

    constructor() public {
        totalSupply = 1000000 * (10**decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    // helper function
    function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) internal {
        // requires a valid recipient address
        require(_to != address(0));

        //balanceOf[_from] -= _value;
        balanceOf[_from] = balanceOf[_from].sub(_value);

        //balanceOf[_to] += _value;
        balanceOf[_to] = balanceOf[_to].add(_value);
        // requires a Transfer event to be fired
        emit Transfer(_from, _to, _value);
    }

    // required function
    // transfers tokens from "msg.sender" to the "_to" address
    function transfer(address payable _to, uint256 _value)
        public
        returns (bool success)
    {
        // requires msg.sender to have anough tokens
        require(balanceOf[msg.sender] >= _value);
        _transfer(msg.sender, _to, _value);
        return true;
    }

    // required function
    // Approve tokens: allows someone to spend soneone elses tokens
    function approve(address _spender, uint256 _value)
        public
        returns (bool success)
    {
        // requires a valid recipient address
        require(_spender != address(0));
        allowance[msg.sender][_spender] = _value;
        // requires an Approval event to be fired
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    // required function
    // Transfer from
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        // requires that _to address has been allocated the tokens via approve()
        require(allowance[_from][msg.sender] >= _value);
        // requires _from address to have enough tokens
        require(balanceOf[_from] >= _value);
        // reduces the allowance of the _to address
        allowance[_from][msg.sender] -= _value;
        //allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
        _transfer(_from, _to, _value);
        return true;
    }
}
