"use strict";

const { findFormat } = require("./find-format");
const { findPool } = require("./find-pool");
const { normalize } = require("./normalize");
const { readConfiguration } = require("./read-configuration");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { stringifyFormat } = require("./stringify-format");
const { supportedDivisions } = require("./supported-divisions");
const { updateLastMessageTime } = require("./update-last-message-time");

exports.sendTeamStatus = async (message, parameters) => {
    if (!message.guild) {
        return;
    }

    const configuration = readConfiguration(message.guild.id);
    const division = parameters[0];
    const teamSize = Number.parseInt(parameters[1], 10);

    if (typeof configuration !== "object"
        || configuration === null
        || message.channel.id !== configuration.challengeChannelId) {
        return;
    }

    updateLastMessageTime(message);

    if (typeof division !== "string"
        || !supportedDivisions.includes(division.toUpperCase())
        || !Number.isInteger(teamSize)) {
        await sendTemporaryMessage(
            message.channel,
            "You must specify a supported division and team size.",
        );

        return;
    }

    const format = await findFormat(
        configuration.formats,
        null,
        division,
        teamSize,
    );
    const pool = findPool(configuration.pools, division, teamSize);

    if (typeof pool !== "object" || pool === null) {
        await sendTemporaryMessage(
            message.channel,
            "There is no challenge format in this server for "
            + stringifyFormat(division, teamSize)
            + ".",
        );

        return;
    }

    const team = pool.teams.find(
        (team) => team.players.some(
            (player) => normalize(player.name)
                === normalize(message.member.displayName),
        ),
    );

    if (typeof team !== "object" || team === null) {
        await sendTemporaryMessage(
            message.channel,
            "You are not on a team for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ".",
        );

        return;
    }

    await sendTemporaryMessage(
        message.channel,
        (Number.isInteger(team.id)
            ? ("Team **[" + team.id + "]**")
            : "Your team")
        + " for "
        + stringifyFormat(pool.division, pool.teamSize)
        + " has "
        + team.confirmed.filter((confirmed) => confirmed).length
        + "/"
        + teamSize
        + " players confirmed.\n"
        + team.players
            .map(
                (player, index) => (team.confirmed[index] ? "✓" : "")
                    + " "
                    + player.name
                    + (Array.isArray(format.players)
                        ? (" (" + format.players[index].kind + ")")
                        : ""),
            )
            .join("\n")
    );
};
