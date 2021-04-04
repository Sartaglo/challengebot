"use strict";

const { Role } = require("discord.js");
const { readConfiguration } = require("./read-configuration");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { stringifyFormat } = require("./stringify-format");
const { writeConfiguration } = require("./write-configuration");

exports.removeTeam = async (message, parameters) => {
    if (!message.guild) {
        return;
    }

    const configuration = readConfiguration(message.guild.id);

    if (typeof configuration !== "object"
        || configuration === null
        || message.channel.id !== configuration.challengeChannelId
        || !Array.isArray(configuration.powerRoleNames)) {
        return;
    }

    const highestRoleName = message.member.roles.highest instanceof Role
        ? message.member.roles.highest.name
        : null;

        if (!configuration.powerRoleNames.includes(highestRoleName)) {
        await sendTemporaryMessage(
            message.channel,
            "You do not have the authority to remove a team. If you wish to"
            + " remove your own team from one or more pools, you must use the"
            + " drop command.",
        );

        return;
    }

    const teamId = Number.parseInt(parameters[0], 10);
    const pool = configuration.pools.find(
        (poolToFind) => poolToFind.teams.some(
            (teamToFind) => teamToFind.id === teamId,
        ),
    );

    if (typeof pool !== "object" || pool === null) {
        await sendTemporaryMessage(
            message.channel,
            "There is no team in any pool in this server with ID **["
            + teamId
            + "]**.",
        );

        return;
    }

    const teamToRemove = pool.teams.find(
        (team) => team.id === teamId,
    );

    if (typeof teamToRemove !== "object" || teamToRemove === null) {
        await sendTemporaryMessage(
            message.channel,
            "There is no team with ID **["
            + challengeChannelId
            + "]** in the pool for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ".",
        );

        return;
    }

    pool.challenges = pool.challenges.filter(
        (challenge) => challenge.challengingTeamId !== teamToRemove.id
            && challenge.defendingTeamId !== teamToRemove.id,
    );
    pool.teams.splice(pool.teams.indexOf(teamToRemove), 1);
    pool.changed = true;
    writeConfiguration(message.guild.id, configuration);

    await sendTemporaryMessage(
        message.channel,
        "Team **["
        + teamId
        + "]** has been removed from the "
        + stringifyFormat(pool.division, pool.teamSize)
        + " pool.",
    );
};
