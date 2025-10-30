// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * CollateralWrapper
 * Small wrapper so the CDP manager can treat wrapped HTS/ERC20 tokens uniformly.
 */
contract CollateralWrapper {
    IERC20 public token;

    constructor(address _token) {
        token = IERC20(_token);
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        return token.transferFrom(from, to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return token.transfer(to, amount);
    }

    function balanceOf(address who) external view returns (uint256) {
        return token.balanceOf(who);
    }
}
