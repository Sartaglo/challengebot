"use strict";

const { findFormat } = require("./find-format");

exports.findFormats = async (formats, channel, division, teamSize) => {
    if (typeof division === "string" && division.length > 0) {
        if (Number.isInteger(teamSize)) {
            return [await findFormat(formats, channel, division, teamSize)];
        }

        return formats.filter(
            (format) => typeof format === "object"
                && format !== null
                && Array.isArray(format.players)
                && format.division.toUpperCase() === division.toUpperCase(),
        );
    }

    return formats.filter(
        (format) => typeof format === "object"
            && format !== null
            && Array.isArray(format.players),
    );
};
