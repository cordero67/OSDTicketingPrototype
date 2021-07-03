// SPDX-License-Identifier: MIT
//pragma solidity ^0.5.0;
pragma solidity >=0.4.22 <0.9.0;

contract Token {
    string public name = "OSD Token";
    string public symbol = "OSD";
    uint256 public decimals = 18;
    uint256 public totalSupply;

    constructor() public {
        totalSupply = 100 * (10**decimals);
    }
}
