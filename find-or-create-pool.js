"use strict";

const { findPool } = require("./find-pool");
const { getFormatTeamSize } = require("./get-format-team-size");

exports.findOrCreatePool = (format, pools) => {
    const formatTeamSize = getFormatTeamSize(format);
    const poolExists = pools.some(
        (pool) => pool.division.toUpperCase() === format.division.toUpperCase()
            && pool.teamSize === formatTeamSize,
    );

    if (!poolExists) {
        pools.push(
            {
                changed: false,
                division: format.division.toUpperCase(),
                messageId: null,
                teams: [],
                teamSize: formatTeamSize,
            },
        );
    }

    return findPool(pools, format.division, formatTeamSize);
};
