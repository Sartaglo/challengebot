"use strict";

const { TextChannel } = require("discord.js");
const { getFormatTeamSize } = require("./get-format-team-size");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { stringifyFormat } = require("./stringify-format");

exports.findFormat = async (formats, channel, division, teamSize) => {
    const chosenFormat = formats.find(
        (format) => typeof format === "object"
            && format !== null
            && format.division.toUpperCase() === division.toUpperCase()
            && (Array.isArray(format.players)
                || getFormatTeamSize(format) === teamSize),
    );

    if (typeof chosenFormat !== "object" || chosenFormat === null) {
        if (channel instanceof TextChannel) {
            await sendTemporaryMessage(
                channel,
                "There is no challenge format in this server for "
                + stringifyFormat(division, teamSize)
                + ".",
            );
        }

        return null;
    }

    return chosenFormat;
};
