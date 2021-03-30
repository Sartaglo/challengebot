"use strict";

const { normalize } = require("./normalize");
const { readConfiguration } = require("./read-configuration");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { stringifyFormat } = require("./stringify-format");
const { writeConfiguration } = require("./write-configuration");

exports.declineChallenge = async (message, parameters) => {
    if (!message.guild) {
        return;
    }

    const configuration = readConfiguration(message.guild.id);

    if (typeof configuration !== "object"
        || configuration === null
        || message.channel.id !== configuration.challengeChannelId) {
        return;
    }

    const challengingTeamId = Number.parseInt(parameters[0], 10);
    const pool = configuration.pools.find(
        (poolToFind) => poolToFind.challenges.some(
            (challenge) => challenge.challengingTeamId === challengingTeamId,
        ),
    );

    if (typeof pool !== "object" || pool === null) {
        await sendTemporaryMessage(
            message.channel,
            "No challenges have been sent to a team with that ID.",
        );

        return;
    }

    const defendingTeam = pool.teams.find(
        (team) => team.players.some(
            (player) => normalize(player.name)
                === normalize(message.member.displayName),
        ),
    );

    if (typeof defendingTeam !== "object" || defendingTeam === null) {
        await sendTemporaryMessage(
            message.channel,
            "You are not in a team for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ".",
        );

        return;
    }

    const index = pool.challenges.findIndex(
        (challenge) => challenge.challengingTeamId === challengingTeamId
            && challenge.defendingTeamId === defendingTeam.id,
    );

    if (index === -1) {
        await sendTemporaryMessage(
            message.channel,
            "The team with that ID has not challenged your team for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ".",
        );

        return;
    }

    pool.challenges.splice(index, 1);
    pool.changed = true;
    writeConfiguration(message.guild.id, configuration);
    await message.channel.send(
        "The challenge that team **["
        + challengingTeamId
        + "]** sent to team **["
        + defendingTeam.id
        + "]** has been declined.",
    );
};
