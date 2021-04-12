"use strict";

const { findFormats } = require("./find-formats");
const { findOrCreatePool } = require("./find-or-create-pool");
const { normalize } = require("./normalize");
const { readConfiguration } = require("./read-configuration");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { stringifyFormat } = require("./stringify-format");
const { supportedDivisions } = require("./supported-divisions");
const { updateLastMessageTime } = require("./update-last-message-time");
const { writeConfiguration } = require("./write-configuration");

exports.dropTeam = async (message, parameters) => {
    if (!message.guild) {
        return;
    }

    const configuration = readConfiguration(message.guild.id);
    const division = parameters[0];
    const teamSize = Number.parseInt(parameters[1], 10);

    if (typeof configuration !== "object"
        || configuration === null
        || message.channel.id !== configuration.challengeChannelId
        || !Array.isArray(configuration.formats)
        || !Array.isArray(configuration.pools)) {
        return;
    }

    updateLastMessageTime(message);

    if (typeof division === "string"
        && !supportedDivisions.includes(division.toUpperCase())) {
        await sendTemporaryMessage(
            message.channel,
            "The provided division is not supported.",
        );

        return;
    }

    const formats = await findFormats(
        configuration.formats,
        message.channel,
        division,
        teamSize,
    );

    if (formats.length === 0) {
        await sendTemporaryMessage(
            message.channel,
            "There are no challenge formats in this server"
            + (typeof division === "string"
                ? (" for " + division.toUpperCase())
                : "")
            + (Number.isInteger(teamSize)
                ? (" " + teamSize + "v" + teamSize)
                : "")
            + ".",
        );

        return;
    }

    let dropped = false;

    for (let formatIndex = 0; formatIndex < formats.length; formatIndex += 1) {
        const format = formats[formatIndex];
        const pool = findOrCreatePool(format, configuration.pools);
        const team = pool.teams.find(
            (teamToFind) => teamToFind.players.some(
                (player) => normalize(player.name)
                    === normalize(message.member.displayName),
            ),
        );

        if (typeof team !== "object" || team === null) {
            continue;
        }

        dropped = true;
        pool.challenges = pool.challenges.filter(
            (challenge) => challenge.challengingTeamId !== team.id
                && challenge.defendingTeamId !== team.id,
        );
        pool.teams.splice(pool.teams.indexOf(team), 1);
        pool.changed = true;
        await sendTemporaryMessage(
            message.channel,
            "Your team for "
            + stringifyFormat(pool.division, pool.teamSize)
            + " has been removed.",
        );
    }

    if (!dropped) {
        await sendTemporaryMessage(
            message.channel,
            " You are not on a team"
            + (typeof division === "string" && division.length > 0
                ? (" for " + division.toUpperCase())
                : "")
            + (Number.isInteger(teamSize)
                ? (" " + teamSize + "v" + teamSize)
                : "")
            + ".",
        );

        return;
    }

    writeConfiguration(message.guild.id, configuration);
};
