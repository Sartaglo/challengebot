"use strict";

const { normalize } = require("./normalize");
const { readConfiguration } = require("./read-configuration");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { stringifyFormat } = require("./stringify-format");
const { updateLastMessageTime } = require("./update-last-message-time");
const { writeConfiguration } = require("./write-configuration");

exports.cancelChallenge = async (message, parameters) => {
    if (!message.guild) {
        return;
    }

    const configuration = readConfiguration(message.guild.id);

    if (typeof configuration !== "object"
        || configuration === null
        || message.channel.id !== configuration.challengeChannelId) {
        return;
    }

    updateLastMessageTime(message);
    const defendingTeamId = Number.parseInt(parameters[0], 10);
    const pool = configuration.pools.find(
        (poolToFind) => poolToFind.challenges.some(
            (challenge) => challenge.defendingTeamId === defendingTeamId,
        ),
    );

    if (typeof pool !== "object" || pool === null) {
        await sendTemporaryMessage(
            message.channel,
            "No challenges have been sent to a team with that ID.",
        );

        return;
    }

    const challengingTeam = pool.teams.find(
        (team) => team.players.some(
            (player) => normalize(player.name)
                === normalize(message.member.displayName),
        ),
    );

    if (typeof challengingTeam !== "object" || challengingTeam === null) {
        await sendTemporaryMessage(
            message.channel,
            "You are not in a team for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ".",
        );

        return;
    }

    const index = pool.challenges.findIndex(
        (challenge) => challenge.challengingTeamId === challengingTeam.id
            && challenge.defendingTeamId === defendingTeamId,
    );

    if (index === -1) {
        await sendTemporaryMessage(
            message.channel,
            "Your team for "
            + stringifyFormat(pool.division, pool.teamSize)
            + " has not challenged the team with that ID.",
        );

        return;
    }

    pool.challenges.splice(index, 1);
    pool.changed = true;
    writeConfiguration(message.guild.id, configuration);
    await message.channel.send(
        "The challenge that team **["
        + challengingTeam.id
        + "]** sent to team **["
        + defendingTeamId
        + "]** has been cancelled.",
    );
};
