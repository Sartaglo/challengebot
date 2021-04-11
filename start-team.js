"use strict";

const { GuildMember } = require("discord.js");
const { findFormat } = require("./find-format");
const { findOrCreatePool } = require("./find-or-create-pool");
const { invalidRoleNames } = require("./invalid-role-names");
const { listItems } = require("./list-items");
const { loadFormatSpreadsheet } = require("./load-format-spreadsheet");
const { normalize } = require("./normalize");
const { writeConfiguration } = require("./write-configuration");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { stringifyFormat } = require("./stringify-format");
const { getFormatTeamSize } = require("./get-format-team-size");

exports.startTeam = async (
    oAuth2Client,
    message,
    configuration,
    division,
    teammateParameters,
) => {
    if (teammateParameters.length === 0) {
        return;
    }

    const teammateUserIds = teammateParameters
        .map((parameter) => /^<@!?([0-9]+)>$/.exec(parameter))
        .filter((match) => Array.isArray(match))
        .map((match) => match[1]);

    if (teammateUserIds.length !== teammateParameters.length) {
        await sendTemporaryMessage(
            message.channel,
            "You must provide a division and tag your teammates and nothing"
            + " else."
        );

        return;
    }

    const format = await findFormat(
        configuration.formats,
        message.channel,
        division,
        teammateParameters.length + 1,
    );

    if (typeof format !== "object" || format === null) {
        return;
    }

    const formatTeamSize = getFormatTeamSize(format);

    if (teammateUserIds.length !== formatTeamSize - 1) {
        await sendTemporaryMessage(
            message.channel,
            "You must tag "
            + (formatTeamSize - 1)
            + " teammate"
            + (formatTeamSize - 1 === 1 ? "" : "s")
            + " for that format.",
        );

        return;
    }

    const teammateMemberMap = await message.guild.members.fetch(
        { cache: false, force: true, user: teammateUserIds },
    );
    const members = [
        message.member,
        ...teammateUserIds
            .map((userId) => teammateMemberMap.get(userId))
            .filter(
                (member) =>
                    member instanceof GuildMember
                    && typeof member.displayName === "string"
                    && !invalidRoleNames.includes(member.roles.highest.name),
            ),
    ];

    if (members.length != formatTeamSize) {
        const indices = teammateUserIds
            .map(
                (userId, index) =>
                    members.some((member) => member.id === userId)
                        ? null
                        : (index + 1),
            )
            .filter((index) => Number.isInteger(index, 10));

        await sendTemporaryMessage(
            message.channel,
            "Teammate"
            + (indices.length === 1 ? "" : "s")
            + " "
            + listItems(indices)
            + " "
            + (indices.length === 1 ? "is" : "are")
            + " not"
            + (indices.length === 1 ? " a" : "")
            + " verified, non-muted user"
            + (indices.length === 1 ? "" : "s")
            + " in this server."
        );

        return;
    }

    const hasDuplicates = members.some(
        (member, index) => members
            .slice(index + 1)
            .some(
                (otherMember) => member.displayName === otherMember.displayName,
            ),
    );

    if (hasDuplicates) {
        await sendTemporaryMessage(
            message.channel,
            "Your team has duplicate players.",
        );

        return;
    }

    const poolForTeam = findOrCreatePool(format, configuration.pools);
    const inPool = poolForTeam.teams.some(
        (team) => team.players.some(
            (player) => members.some(
                (member) => normalize(member.displayName)
                    === normalize(player.name),
            ),
        ),
    );

    if (inPool) {
        await sendTemporaryMessage(
            message.channel,
            "Someone on your team is already in the pool for "
            + stringifyFormat(poolForTeam.division, poolForTeam.teamSize)
            + ".",
        );

        return;
    }

    const inMatch = configuration.pools.some(
        (pool) => pool.challenges.some(
            (challenge) => typeof challenge.match === "object"
                && challenge.match !== null
                && challenge.match.playerNames.some(
                    (playerName) => members.some(
                        (member) => normalize(member.displayName)
                            === normalize(playerName),
                    ),
                ),
        ),
    );

    if (inMatch) {
        await sendTemporaryMessage(
            message.channel,
            "Someone on your team is already in a match.",
        );

        return;
    }

    const { invalidMembers, players, teamName } = await loadFormatSpreadsheet(
        oAuth2Client,
        message,
        format,
        members,
    );

    if (invalidMembers.length > 0 || players.length === 0) {
        return;
    }

    const team = {
        confirmed: Array(players.length)
            .fill(false)
            .map((_, index) => index === 0),
        id: null,
        players,
        teamName,
        lastMessageTime: new Date().toJSON(),
        warned: false,
    };
    poolForTeam.teams.push(team);
    writeConfiguration(message.guild.id, configuration);
    await sendTemporaryMessage(
        message.channel,
        listItems(players.slice(1).map((player) => player.name))
        + " must now each send `!c "
        + format.division
        + " "
        + players.length
        + "` to confirm. Send `!team "
        + poolForTeam.division.toUpperCase()
        + " "
        + poolForTeam.teamSize
        + "` to check the status of your team.",
    );
};
