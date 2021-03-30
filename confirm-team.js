"use strict";

const { findPool } = require("./find-pool");
const { normalize } = require("./normalize");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { stringifyFormat } = require("./stringify-format");
const { writeConfiguration } = require("./write-configuration");

exports.confirmTeam = async (message, configuration, division, teamSize) => {
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

    if (team.confirmed.every((confirmed) => confirmed)) {
        await sendTemporaryMessage(
            message.channel,
            "Your team is already confirmed for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ". You may challenge other teams in the pool."
        );

        return;
    }

    const indices = team.players
        .map((player, index) => ({ player, index }))
        .filter(
            ({ player }) => normalize(player.name)
                === normalize(message.member.displayName),
        )
        .map(({ index }) => index);
    const playerConfirmed = team.confirmed.every(
        (confirmed, index) => !indices.includes(index) || confirmed,
    );

    if (playerConfirmed) {
        await sendTemporaryMessage(
            message.channel,
            "You are already confirmed for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ". Send `!team "
            + pool.division.toUpperCase()
            + " "
            + pool.teamSize
            + "` to check the status of your team.",
        );

        return;
    }

    const index = team.confirmed.findIndex(
        (confirmed, index) => indices.includes(index) && !confirmed,
    );
    team.confirmed[index] = true;
    const allConfirmedNow = team.confirmed.every((confirmed) => confirmed);

    if (allConfirmedNow) {
        team.id = configuration.nextTeamId;
        configuration.nextTeamId += 1;
        pool.changed = true;
        await sendTemporaryMessage(
            message.channel,
            "Your team is now confirmed for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ". You may now challenge other teams in the pool."
        );
    } else {
        await sendTemporaryMessage(
            message.channel,
            "You are now confirmed for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ". Send `!team "
            + pool.division.toUpperCase()
            + " "
            + pool.teamSize
            + "` to check the status of your team.",
        );
    }

    writeConfiguration(message.guild.id, configuration);
};
