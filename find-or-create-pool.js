"use strict";

const { findPool } = require("./find-pool");

exports.findOrCreatePool = (format, pools) => {
    const poolExists = pools.some(
        (pool) => pool.division.toUpperCase() === format.division.toUpperCase()
            && pool.teamSize === format.players.length,
    );

    if (!poolExists) {
        pools.push(
            {
                changed: false,
                division: format.division.toUpperCase(),
                messageId: null,
                teams: [],
                teamSize: format.players.length,
            },
        );
    }

    return findPool(pools, format.division, format.players.length);
};
