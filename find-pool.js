"use strict";

exports.findPool = (pools, division, teamSize) => pools.find(
    (pool) => pool.division.toUpperCase() === division.toUpperCase()
        && pool.teamSize === teamSize,
);
