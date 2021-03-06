/**
 * Augur JavaScript API
 * @author Jack Peterson (jack@tinybike.net)
 */

"use strict";

var clone = require("clone");
var abi = require("augur-abi");
var utils = require("../utilities");

module.exports = {
    slashRep: function (branch, salt, report, reporter, eventID, onSent, onSuccess, onFailed, onConfirmed) {
        if (branch.constructor === Object && branch.branch) {
            eventID = branch.eventID;
            salt = branch.salt;
            report = branch.report;
            reporter = branch.reporter;
            onSent = branch.onSent;
            onSuccess = branch.onSuccess;
            onFailed = branch.onFailed;
            onConfirmed = branch.onConfirmed;
            branch = branch.branch;
        }
        var tx = clone(this.tx.SlashRep.slashRep);
        tx.params = [branch, salt, abi.fix(report, "hex"), reporter, eventID];
        return this.transact(tx, onSent, onSuccess, onFailed, onConfirmed);
    }
};
