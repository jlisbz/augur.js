#!/usr/bin/env node

"use strict";

var fs = require("fs");
var path = require("path");
var assert = require("chai").assert;
var Augur = require("../augur");

var args = process.argv.slice(2);
if (args.length && (args[0] === "--gospel" || args[0] === "--reset" || args[0] === "--postupload" || args[0] === "--faucets" || args[0] === "--ballots")) {
    var gospel = path.join(__dirname, "gospel.json");
    Augur.contracts = JSON.parse(fs.readFileSync(gospel));
}
Augur.connect();

var log = console.log;
var TIMEOUT = 24000;
var branch = Augur.branches.dev;
var coinbase = Augur.coinbase;

describe("Faucets", function () {
    it("Reputation faucet", function (done) {
        this.timeout(TIMEOUT);
        Augur.reputationFaucet(
            branch,
            function (r) {
                // sent
                assert.equal(r.callReturn, "1");
                assert(parseInt(r.txHash) >= 0);
            },
            function (r) {
                // success
                assert.equal(r.callReturn, "1");
                assert(parseInt(r.blockHash) !== 0);
                assert(parseInt(r.blockNumber) >= 0);
                var rep_balance = Augur.getRepBalance(branch, coinbase);
                var cash_balance = Augur.getCashBalance(coinbase);
                assert.equal(rep_balance, "47");
                done();
            },
            function (r) {
                // failed
                throw r.message;
                done();
            }
        );
    });
    it("Cash faucet", function (done) {
        this.timeout(TIMEOUT);
        Augur.cashFaucet(
            function (r) {
                // sent
                assert.equal(r.callReturn, "1");
                assert(parseInt(r.txHash) >= 0);
            },
            function (r) {
                // success
                assert.equal(r.callReturn, "1");
                assert(parseInt(r.blockHash) !== 0);
                assert(parseInt(r.blockNumber) >= 0);
                var rep_balance = Augur.getRepBalance(branch, coinbase);
                var cash_balance = Augur.getCashBalance(coinbase);
                assert.equal(cash_balance, "10000");
                done();
            },
            function (r) {
                // failed
                throw r.message;
                done();
            }
        );
    });
});