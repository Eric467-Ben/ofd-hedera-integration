// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./OFD.sol";
import "./CollateralWrapper.sol";
import "./Auction.sol";

/**
 * CDPManager - simplified demo manager for vaults and minting.
 * Owner can call checkAndLiquidate (demo keeper behavior).
 */
contract CDPManager is Ownable {
    using SafeMath for uint256;

    OFD public ofd;
    Auction public auction;

    struct Vault {
        address owner;
        CollateralWrapper collateral;
        uint256 collateralAmount;
        uint256 debt;
        bool liquidated;
    }

    mapping(uint256 => Vault) public vaults;
    uint256 public nextVaultId;
    uint256 public constant COLLATERAL_RATIO = 150; // 150%
    uint256 public constant LIQUIDATION_PENALTY = 10; // 10%

    event VaultOpened(uint256 id, address indexed owner);
    event VaultRepaid(uint256 id, uint256 amount);
    event VaultLiquidated(uint256 id);

    constructor(address _ofd, address _auction) {
        ofd = OFD(_ofd);
        auction = Auction(_auction);
    }

    function openVault(address _collateral) external returns (uint256) {
        vaults[nextVaultId] = Vault({
            owner: msg.sender,
            collateral: CollateralWrapper(_collateral),
            collateralAmount: 0,
            debt: 0,
            liquidated: false
        });
        emit VaultOpened(nextVaultId, msg.sender);
        nextVaultId++;
        return nextVaultId - 1;
    }

    function depositCollateral(uint256 vaultId, uint256 amount) external {
        Vault storage v = vaults[vaultId];
        require(v.owner == msg.sender, "not owner");
        v.collateral.transferFrom(msg.sender, address(this), amount);
        v.collateralAmount = v.collateralAmount.add(amount);
    }

    function borrow(uint256 vaultId, uint256 amount) external {
        Vault storage v = vaults[vaultId];
        require(v.owner == msg.sender, "not owner");
        require(!v.liquidated, "vault dead");

        uint256 newDebt = v.debt.add(amount);
        require(isHealthy(v.collateralAmount, newDebt), "undercollateralized");

        v.debt = newDebt;
        ofd.mint(msg.sender, amount);
    }

    function repay(uint256 vaultId, uint256 amount) external {
        Vault storage v = vaults[vaultId];
        require(v.owner == msg.sender, "not owner");
        ofd.burn(msg.sender, amount);
        v.debt = v.debt.sub(amount);
        emit VaultRepaid(vaultId, amount);
    }

    function withdrawCollateral(uint256 vaultId, uint256 amount) external {
        Vault storage v = vaults[vaultId];
        require(v.owner == msg.sender, "not owner");
        require(isHealthy(v.collateralAmount.sub(amount), v.debt), "would liquidate");
        v.collateral.transfer(msg.sender, amount);
        v.collateralAmount = v.collateralAmount.sub(amount);
    }

    function checkAndLiquidate(uint256 vaultId) external onlyOwner {
        Vault storage v = vaults[vaultId];
        if (!isHealthy(v.collateralAmount, v.debt) && !v.liquidated) {
            uint256 penalty = v.collateralAmount.mul(LIQUIDATION_PENALTY).div(100);
            v.collateralAmount = v.collateralAmount.sub(penalty);
            v.liquidated = true;
            auction.createLot(address(v.collateral), v.collateralAmount, v.debt);
            emit VaultLiquidated(vaultId);
        }
    }

    function isHealthy(uint256 collateral, uint256 debt) public pure returns (bool) {
        if (debt == 0) return true;
        return collateral.mul(100).div(debt) >= COLLATERAL_RATIO;
    }
}
