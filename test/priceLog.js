/**
 * price logging/filter tests
 * @author Jack Peterson (jack@tinybike.net)
 */

"use strict";

var assert = require("chai").assert;
var chalk = require("chalk");
var constants = require("../src/constants");
var utilities = require("../src/utilities");
var Augur = utilities.setup(require("../src"), process.argv.slice(2));
var log = console.log;

var branch = Augur.branches.dev;
var markets = Augur.getMarkets(branch);
var market_id = markets[markets.length - 1];
var outcome = "1";
var amount = "10";
var block = Augur.blockNumber();

describe("getMarketPriceHistory", function () {
    it("price history (async)", function (done) {
        this.timeout(constants.timeout);
        Augur.buyShares({
            branchId: branch,
            marketId: market_id,
            outcome: outcome,
            amount: amount,
            onSent: function (r) {

            },
            onSuccess: function (r) {
                Augur.filters.getMarketPriceHistory(market_id, outcome, function (price_logs) {
                    log(price_logs);
                    assert.equal(price_logs.constructor, Array);
                    assert(price_logs.length);
                    assert(price_logs[0].price);
                    assert(price_logs[0].blockNumber);
                    done();
                });
            },
            onFailed: function (r) {
                throw new Error(r);
            }
        });
    });
    it("price history (sync)", function (done) {
        this.timeout(constants.timeout);
        Augur.buyShares({
            branchId: branch,
            marketId: market_id,
            outcome: outcome,
            amount: amount,
            onSent: function (r) {

            },
            onSuccess: function (r) {
                var price_logs = Augur.filters.getMarketPriceHistory(market_id, outcome);
                log(price_logs);
                assert.equal(price_logs.constructor, Array);
                assert(price_logs.length);
                assert(price_logs[0].price);
                assert(price_logs[0].blockNumber);
                done();
            },
            onFailed: function (r) {
                throw new Error(r);
            }
        });
    });
});

describe("updatePrice listener", function () {
    it("should return data on buyShares", function (done) {
        this.timeout(constants.timeout);
        Augur.filters.start_eth_listener("updatePrice", function (filter_id) {
            var listener = setInterval(function () {
                Augur.filters.poll_eth_listener("updatePrice", function (data) {
                    if (data) {
                        log(data);
                        clearInterval(listener);
                        done();
                    }
                });
            }, 2000);
            setTimeout(function () {
                Augur.buyShares({
                    branchId: branch,
                    marketId: market_id,
                    outcome: outcome,
                    amount: amount,
                    onSent: function (r) {
                        log("sent:", r);
                        log(r.callReturn);
                        log(JSON.stringify(r.callReturn));
                    },
                    onSuccess: function (r) {
                        log(r);
                        log(JSON.stringify(r.callReturn));
                    },
                    onFailed: function (r) {
                        throw new Error(r);
                    }
                });
            }, 2000);
        });
    });
});