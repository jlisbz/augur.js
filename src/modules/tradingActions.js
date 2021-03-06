/*
 * Author: priecint
 */
var clone = require("clone");
var BigNumber = require("bignumber.js");
var EthTx = require("ethereumjs-tx");
var constants = require("../constants");

BigNumber.config({MODULO_MODE: BigNumber.EUCLID});

module.exports = {

	/**
	 * Calculates (approximately) gas needed to run the transaction
	 *
	 * @param {Object} tx
	 * @param {Number} gasPrice
	 * @return {BigNumber}
	 */
	getTxGasEth: function (tx, gasPrice) {
		tx.gasLimit = tx.gas || constants.DEFAULT_GAS;
		tx.gasPrice = gasPrice;
		var etx = new EthTx(tx);
		return new BigNumber(etx.getUpfrontCost().toString(), 10).dividedBy(constants.ETHER);
	},

	/**
	 * Bids are sorted descendingly, asks are sorted ascendingly
	 *
	 * @param {Array} orders Bids or asks
	 * @param {String} traderOrderType What trader want to do (buy or sell)
	 * @param {BigNumber=} limitPrice When buying it's max price to buy at, when selling it min price to sell at. If
	 *     it's null order is considered to be market order
	 * @param {String} outcomeId
	 * @param {String} userAddress
	 * @return {Array.<Object>}
	 */
	filterByPriceAndOutcomeAndUserSortByPrice: function (orders, traderOrderType, limitPrice, outcomeId, userAddress) {
		var isMarketOrder = limitPrice === null || limitPrice === undefined;
		return Object.keys(orders)
			.map(function (orderId) {
				return orders[orderId];
			})
			.filter(function (order) {
				var isMatchingPrice;
				if (isMarketOrder) {
					isMatchingPrice = true;
				} else {
					isMatchingPrice = traderOrderType === "buy" ? new BigNumber(order.price, 10).lte(limitPrice) : new BigNumber(order.price, 10).gte(limitPrice);
				}
				return order.outcome === outcomeId && order.owner !== userAddress && isMatchingPrice;
			})
			.sort(function compareOrdersByPrice(order1, order2) {
				return traderOrderType === "buy" ? order1.price - order2.price : order2.price - order1.price;
			});
	},

	/**
	 *
	 * @param {BigNumber} shares
	 * @param {BigNumber} limitPrice
	 * @param {BigNumber} makerFee
	 * @param {Number} gasPrice
	 * @return {{action: string, shares: string, gasEth, feeEth: string, costEth: string, avgPrice: string}}
	 */
	getBidAction: function (shares, limitPrice, makerFee, gasPrice) {
		var bidGasEth = this.getTxGasEth(clone(this.tx.BuyAndSellShares.buy), gasPrice);
		var etherToBid = shares.times(limitPrice);
		return {
			action: "BID",
			shares: shares.toFixed(),
			gasEth: bidGasEth.toFixed(),
			feeEth: etherToBid.times(makerFee).toFixed(),
			costEth: etherToBid.toFixed(),
			avgPrice: limitPrice.toFixed()
		};
	},

	/**
	 *
	 * @param {BigNumber} buyEth
	 * @param {BigNumber} sharesFilled
	 * @param {BigNumber} takerFee
	 * @param {Number} gasPrice
	 * @return {{action: string, shares: string, gasEth, feeEth: string, costEth: string, avgPrice: string}}
	 */
	getBuyAction: function (buyEth, sharesFilled, takerFee, gasPrice) {
		var tradeGasEth = this.getTxGasEth(clone(this.tx.Trade.trade), gasPrice);
		return {
			action: "BUY",
			shares: sharesFilled.toFixed(),
			gasEth: tradeGasEth.toFixed(),
			feeEth: buyEth.times(takerFee).toFixed(),
			costEth: buyEth.toFixed(),
			avgPrice: buyEth.dividedBy(sharesFilled).toFixed()
		};
	},

	/**
	 *
	 * @param {BigNumber} shares
	 * @param {BigNumber} limitPrice
	 * @param {BigNumber} makerFee
	 * @param {Number} gasPrice
	 * @return {{action: string, shares: string, gasEth, feeEth: string, costEth: string, avgPrice: string}}
	 */
	getAskAction: function (shares, limitPrice, makerFee, gasPrice) {
		var askGasEth = this.getTxGasEth(clone(this.tx.BuyAndSellShares.sell), gasPrice);
		var costEth = shares.times(limitPrice);
		return {
			action: "ASK",
			shares: shares.toFixed(),
			gasEth: askGasEth.toFixed(),
			feeEth: costEth.times(makerFee).toFixed(),
			costEth: costEth.toFixed(),
			avgPrice: limitPrice.toFixed()
		};
	},

	/**
	 *
	 * @param {BigNumber} sellEth
	 * @param {BigNumber} sharesFilled
	 * @param {BigNumber} takerFee
	 * @param {Number} gasPrice
	 * @return {{action: string, shares: string, gasEth, feeEth: string, costEth: string, avgPrice: string}}
	 */
	getSellAction: function (sellEth, sharesFilled, takerFee, gasPrice) {
		var tradeGasEth = this.getTxGasEth(clone(this.tx.Trade.trade), gasPrice);
		return {
			action: "SELL",
			shares: sharesFilled.toFixed(),
			gasEth: tradeGasEth.toFixed(),
			feeEth: sellEth.times(takerFee).toFixed(),
			costEth: sellEth.toFixed(),
			avgPrice: sellEth.dividedBy(sharesFilled).toFixed()
		};
	},

	/**
	 *
	 * @param {BigNumber} shortSellEth
	 * @param {BigNumber} shares
	 * @param {BigNumber} takerFee
	 * @param {Number} gasPrice
	 * @return {{action: string, shares: string, gasEth, feeEth: string, costEth: string, avgPrice: string}}
	 */
	getShortSellAction: function (shortSellEth, shares, takerFee, gasPrice) {
		var shortSellGasEth = this.getTxGasEth(clone(this.tx.Trade.short_sell), gasPrice);
		return {
			action: "SHORT_SELL",
			shares: shares.toFixed(),
			gasEth: shortSellGasEth.toFixed(),
			feeEth: shortSellEth.times(takerFee).toFixed(),
			costEth: shortSellEth.toFixed(),
			avgPrice: shortSellEth.dividedBy(shares).toFixed()
		};
	},

	/**
	 *
	 * @param {BigNumber} shares
	 * @param {BigNumber} limitPrice
	 * @param {BigNumber} makerFee
	 * @param {Number} gasPrice
	 * @return {{action: string, shares: string, gasEth: string, feeEth: string, costEth: string, avgPrice: string}}
	 */
	getRiskyShortSellAction: function (shares, limitPrice, makerFee, gasPrice) {
		var buyCompleteSetsGasEth = this.getTxGasEth(clone(this.tx.CompleteSets.buyCompleteSets), gasPrice);
		var askGasEth = this.getTxGasEth(clone(this.tx.BuyAndSellShares.sell), gasPrice);
		var riskyShortSellEth = shares.times(limitPrice);
		return {
			action: "SHORT_SELL_RISKY",
			shares: shares.toFixed(),
			gasEth: buyCompleteSetsGasEth.plus(askGasEth).toFixed(),
			feeEth: riskyShortSellEth.times(makerFee).toFixed(),
			costEth: riskyShortSellEth.toFixed(),
			avgPrice: limitPrice.toFixed()
		};
	},

	/**
	 * Allows to estimate what trading methods will be called based on user's order. This is useful so users know how
	 * much they pay for trading
	 *
	 * @param {String} type 'buy' or 'sell'
	 * @param {String|BigNumber} orderShares
	 * @param {String|BigNumber=} orderLimitPrice null value results in market order
	 * @param {String|BigNumber} takerFee Decimal string ("0.02" for 2% fee)
	 * @param {String|BigNumber} makerFee Decimal string ("0.02" for 2% fee)
	 * @param {String} userAddress Address of trader to exclude orders from order book
	 * @param {String|BigNumber} userPositionShares
	 * @param {String} outcomeId
	 * @param {Object} marketOrderBook Bids and asks for market (mixed for all outcomes)
	 * @return {Array}
	 */
	getTradingActions: function (type, orderShares, orderLimitPrice, takerFee, makerFee, userAddress, userPositionShares, outcomeId, marketOrderBook) {
		console.log("getTradingActions:");
		console.log("type:", type);
		console.log("orderShares:", orderShares);
		console.log("orderLimitPrice:", orderLimitPrice);
		console.log("takerFee:", takerFee);
		console.log("makerFee:", makerFee);
		console.log("userAddress:", userAddress);
		console.log("userPositionShares:", userPositionShares);
		console.log("outcomeId:", outcomeId);
		console.log("marketOrderBook:", marketOrderBook);
		var remainingOrderShares, i, length, orderSharesFilled, bid, ask, bidAmount, isMarketOrder;
		if (type.constructor === Object && type.type) {
			orderShares = type.orderShares;
			orderLimitPrice = type.orderLimitPrice;
			takerFee = type.takerFee;
			makerFee = type.makerFee;
			userAddress = type.userAddress;
			userPositionShares = type.userPositionShares;
			outcomeId = type.outcomeId;
			marketOrderBook = type.marketOrderBook;
			type = type.type;
		}

		orderShares = new BigNumber(orderShares, 10);
		orderLimitPrice = (orderLimitPrice === null || orderLimitPrice === undefined) ? null : new BigNumber(orderLimitPrice, 10);
		takerFee = new BigNumber(takerFee, 10);
		makerFee = new BigNumber(makerFee, 10);
		userPositionShares = new BigNumber(userPositionShares, 10);
		isMarketOrder = orderLimitPrice === null || orderLimitPrice === undefined;

		var augur = this;
		var gasPrice = augur.rpc.gasPrice;
		if (type === "buy") {
			var matchingSortedAsks = augur.filterByPriceAndOutcomeAndUserSortByPrice(marketOrderBook.sell, type, orderLimitPrice, outcomeId, userAddress);
			var areSuitableOrders = matchingSortedAsks.length > 0;
			if (!areSuitableOrders) {
				if (isMarketOrder) {
					return [];
				}
				return [augur.getBidAction(orderShares, orderLimitPrice, makerFee, gasPrice)];
			} else {
				var buyActions = [];

				var etherToTrade = constants.ZERO;
				remainingOrderShares = orderShares;
				length = matchingSortedAsks.length;
				for (i = 0; i < length; i++) {
					ask = matchingSortedAsks[i];
					orderSharesFilled = BigNumber.min(remainingOrderShares, ask.amount);
					etherToTrade = etherToTrade.add(orderSharesFilled.times(new BigNumber(ask.price, 10)));
					remainingOrderShares = remainingOrderShares.minus(orderSharesFilled);
					if (remainingOrderShares.equals(constants.ZERO)) {
						break;
					}
				}
				buyActions.push(augur.getBuyAction(etherToTrade, orderShares.minus(remainingOrderShares), takerFee, gasPrice));

				if (!remainingOrderShares.equals(constants.ZERO) && !isMarketOrder) {
					buyActions.push(augur.getBidAction(remainingOrderShares, orderLimitPrice, makerFee, gasPrice));
				}

				return buyActions;
			}
		} else {
			var matchingSortedBids = augur.filterByPriceAndOutcomeAndUserSortByPrice(marketOrderBook.buy, type, orderLimitPrice, outcomeId, userAddress);

			var areSuitableBids = matchingSortedBids.length > 0;
			var userHasPosition = userPositionShares.greaterThan(constants.ZERO);
			var sellActions = [];

			if (userHasPosition) {
				var etherToSell = constants.ZERO;
				remainingOrderShares = orderShares;
				var remainingPositionShares = userPositionShares;
				if (areSuitableBids) {
					for (i = 0, length = matchingSortedBids.length; i < length; i++) {
						bid = matchingSortedBids[i];
						bidAmount = new BigNumber(bid.amount);
						orderSharesFilled = BigNumber.min(bidAmount, remainingOrderShares, remainingPositionShares);
						etherToSell = etherToSell.plus(orderSharesFilled.times(new BigNumber(bid.price, 10)));
						remainingOrderShares = remainingOrderShares.minus(orderSharesFilled);
						remainingPositionShares = remainingPositionShares.minus(orderSharesFilled);
						if (orderSharesFilled.equals(bidAmount)) {
							// since this order is filled we remove it. Change for-cycle variables accordingly
							matchingSortedBids.splice(i, 1);
							i--;
							length--;
						} else {
							var newBid = clone(bid);
							newBid.amount = bidAmount.minus(orderSharesFilled).toFixed();
							matchingSortedBids[i] = newBid;
						}

						if (remainingOrderShares.equals(constants.ZERO) || remainingPositionShares.equals(constants.ZERO)) {
							break;
						}
					}

					sellActions.push(augur.getSellAction(etherToSell, orderShares.minus(remainingOrderShares), takerFee, gasPrice));
				} else {
					if (!isMarketOrder) {
						var askShares = BigNumber.min(remainingOrderShares, remainingPositionShares);
						remainingOrderShares = remainingOrderShares.minus(askShares);
						remainingPositionShares = remainingPositionShares.minus(askShares);
						sellActions.push(augur.getAskAction(askShares, orderLimitPrice, makerFee, gasPrice));
					}
				}

				if (remainingOrderShares.greaterThan(constants.ZERO) && !isMarketOrder) {
					// recursion
					sellActions = sellActions.concat(augur.getTradingActions(type, remainingOrderShares, orderLimitPrice, takerFee, makerFee, userAddress, remainingPositionShares, outcomeId, {buy: matchingSortedBids}));
				}
			} else {
				if (isMarketOrder) {
					return sellActions;
				}

				var etherToShortSell = constants.ZERO;
				remainingOrderShares = orderShares;
				if (areSuitableBids) {
					for (i = 0, length = matchingSortedBids.length; i < length; i++) {
						bid = matchingSortedBids[i];
						orderSharesFilled = BigNumber.min(new BigNumber(bid.amount, 10), remainingOrderShares);
						etherToShortSell = etherToShortSell.plus(orderSharesFilled.times(new BigNumber(bid.price, 10)));
						remainingOrderShares = remainingOrderShares.minus(orderSharesFilled);
						if (remainingOrderShares.equals(constants.ZERO)) {
							break;
						}
					}
					sellActions.push(augur.getShortSellAction(etherToShortSell, orderShares.minus(remainingOrderShares), takerFee, gasPrice));
				}
				if (remainingOrderShares.greaterThan(constants.ZERO)) {
					sellActions.push(augur.getRiskyShortSellAction(remainingOrderShares, orderLimitPrice, makerFee, gasPrice));
				}
			}

			return sellActions;
		}
	}
};
