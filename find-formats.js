"use strict";

const { findFormat } = require("./find-format");
const { getFormatTeamSize } = require("./get-format-team-size");

exports.findFormats = async (formats, channel, division, teamSize) => {
    if (typeof division === "string" && division.length > 0) {
        if (Number.isInteger(teamSize)) {
            return [await findFormat(formats, channel, division, teamSize)];
        }

        return formats.filter(
            (format) => typeof format === "object"
                && format !== null
                && format.division.toUpperCase() === division.toUpperCase()
                && ((Array.isArray(format.players)
                    && getFormatTeamSize(format) === teamSize)
                    || format.teamSize === teamSize),
        );
    }

    return formats.filter(
        (format) => typeof format === "object" && format !== null,
    );
};
