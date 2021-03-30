"use strict";

const { findFormat } = require("./find-format");
const { listTeamMembers } = require("./list-team-members");
const { normalize } = require("./normalize");
const { readConfiguration } = require("./read-configuration");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { stringifyFormat } = require("./stringify-format");
const { writeConfiguration } = require("./write-configuration");

exports.challengeTeam = async (message, parameters) => {
    if (!message.guild) {
        return;
    }

    const configuration = readConfiguration(message.guild.id);

    if (typeof configuration !== "object"
        || configuration === null
        || message.channel.id !== configuration.challengeChannelId) {
        return;
    }

    const defendingTeamId = Number.parseInt(parameters[0], 10);
    const pool = configuration.pools.find(
        (poolToFind) => poolToFind.teams.some(
            (teamToFind) => teamToFind.id === defendingTeamId,
        ),
    );

    if (typeof pool !== "object" || pool === null) {
        await sendTemporaryMessage(
            message.channel,
            "There is no team in any pool in this server with that ID.",
        );

        return;
    }

    const format = await findFormat(
        configuration.formats,
        message.channel,
        pool.division,
        pool.teamSize,
    );

    if (typeof format !== "object" || format === null) {
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
            "You are not on a team in the pool for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ".",
        );

        return;
    }

    if (challengingTeam.confirmed.some((confirmed) => !confirmed)) {
        await sendTemporaryMessage(
            message.channel,
            "Your team is not yet confirmed for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ". Send `!team "
            + pool.division.toUpperCase()
            + " "
            + pool.teamSize
            + "` to check the status of your team.",
        );

        return;
    }

    const defendingTeam = pool.teams.find(
        (team) => team.id === defendingTeamId,
    );

    if (challengingTeam === defendingTeam) {
        await sendTemporaryMessage(
            message.channel,
            "You cannot challenge your own team.",
        );

        return;
    }

    const challengingAlready = pool.challenges.some(
        (challenge) => challenge.challengingTeamId === challengingTeam.id
            && challenge.defendingTeamId === defendingTeam.id,
    );

    if (challengingAlready) {
        await sendTemporaryMessage(
            message.channel,
            "Your team has already challenged that team for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ".",
        );

        return;
    }

    const defendingAlready = pool.challenges.some(
        (challenge) => challenge.challengingTeamId === defendingTeam.id
            && challenge.defendingTeamId === challengingTeam.id,
    );

    if (defendingAlready) {
        await sendTemporaryMessage(
            message.channel,
            "That team has already challenged your team for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ". To accept the challenge, send `!accept "
            + defendingTeam.id
            + "`.",
        );

        return;
    }

    pool.challenges.push(
        {
            challengingTeamId: challengingTeam.id,
            defendingTeamId: defendingTeam.id,
            match: null,
        },
    );
    pool.changed = true;
    writeConfiguration(message.guild.id, configuration);
    await sendTemporaryMessage(
        message.channel,
        "If you sent this challenge in error, you may cancel it by sending"
        + " `!cancel "
        + defendingTeam.id
        + "`.",
    );
    await message.channel.send(
        "Team **["
        + defendingTeam.id
        + "]** has been challenged for "
        + stringifyFormat(pool.division, pool.teamSize)
        + " by the following team:"
        + "\n"
        + "\n"
        + "**["
        + challengingTeam.id
        + "]** "
        + listTeamMembers(format, challengingTeam)
        + "\n"
        + "\n"
        + "To accept this challenge as a member of team **["
        + defendingTeam.id
        + "]**, send `!accept "
        + challengingTeam.id
        + "`. To decline, send `!decline "
        + challengingTeam.id
        + "`.",
    );
};
