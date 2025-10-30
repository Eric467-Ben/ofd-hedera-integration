// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * Auction
 * Hybrid liquidation auction (time-weighted + fallback behavior).
 * This is intentionally compact for demo; real deployments need more robust handling.
 */
contract Auction {
    struct Lot {
        address seller;
        address collateral;
        uint256 collateralAmount;
        uint256 minBid;
        uint256 bestBid;
        address bestBidder;
        uint256 startTime;
        bool settled;
    }

    mapping(uint256 => Lot) public lots;
    uint256 public nextLotId;
    uint256 public constant AUCTION_DURATION = 30 minutes;

    event LotCreated(uint256 id, address indexed seller, uint256 collateralAmount, uint256 minBid);
    event BidPlaced(uint256 id, address indexed bidder, uint256 bid);
    event LotSettled(uint256 id, address winner, uint256 winningBid);

    function createLot(address collateral, uint256 amount, uint256 minBid) external returns (uint256) {
        lots[nextLotId] = Lot({
            seller: msg.sender,
            collateral: collateral,
            collateralAmount: amount,
            minBid: minBid,
            bestBid: 0,
            bestBidder: address(0),
            startTime: block.timestamp,
            settled: false
        });
        emit LotCreated(nextLotId, msg.sender, amount, minBid);
        nextLotId++;
        return nextLotId - 1;
    }

    function getCurrentPrice(uint256 id) public view returns (uint256) {
        Lot storage l = lots[id];
        uint256 elapsed = block.timestamp - l.startTime;
        if (elapsed >= AUCTION_DURATION) return l.minBid;
        // simple linear decay from 120% to minBid over duration (demo)
        uint256 decay = (l.minBid * elapsed) / AUCTION_DURATION;
        uint256 price = l.minBid + decay;
        return price;
    }

    function bid(uint256 id) external payable {
        Lot storage l = lots[id];
        require(!l.settled, "already settled");
        require(block.timestamp < l.startTime + AUCTION_DURATION, "auction ended");
        uint256 price = getCurrentPrice(id);
        require(msg.value >= price, "bid too low");

        if (msg.value > l.bestBid) {
            // refund previous best
            if (l.bestBidder != address(0)) payable(l.bestBidder).transfer(l.bestBid);
            l.bestBid = msg.value;
            l.bestBidder = msg.sender;
            emit BidPlaced(id, msg.sender, msg.value);
        }
    }

    function settle(uint256 id) external {
        Lot storage l = lots[id];
        require(!l.settled, "already settled");
        require(block.timestamp >= l.startTime + AUCTION_DURATION, "auction still active");
        l.settled = true;
        // In demo: funds transfer to seller and collateral transfer to winner are managed off-chain or via wrapper
        if (l.bestBid > 0) payable(l.seller).transfer(l.bestBid);
        emit LotSettled(id, l.bestBidder, l.bestBid);
    }
}
