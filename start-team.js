"use strict";

const { GuildMember } = require("discord.js");
const { invalidRoleNames } = require("./invalid-role-names");
const { findFormat } = require("./find-format");
const { findOrCreatePool } = require("./find-or-create-pool");
const { listItems } = require("./list-items");
const { normalize } = require("./normalize");
const { tryGetSheet } = require("./try-get-sheet");
const { writeConfiguration } = require("./write-configuration");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { stringifyFormat } = require("./stringify-format");

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

    if (teammateUserIds.length !== format.players.length - 1) {
        await sendTemporaryMessage(
            message.channel,
            "You must tag "
            + (format.players.length - 1)
            + " teammate"
            + (format.players.length - 1 === 1 ? "" : "s")
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

    if (members.length != format.players.length) {
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

    const invalidMembers = [];
    const players = [];
    const spreadsheet = await tryGetSheet(
        oAuth2Client,
        format.id,
        format.players
            .reduce(
                (ranges, player) => [
                    ...ranges,
                    "'" + player.tab + "'!" + player.nameRange,
                    "'" + player.tab + "'!" + player.mmrRange,
                ],
                [],
            )
            .filter((range, index, self) => self.indexOf(range) === index),
    );

    for (let index = 0; index < members.length; index += 1) {
        const member = members[index];
        const playerFormat = format.players[index];

        if (typeof spreadsheet !== "object" || spreadsheet === null) {
            invalidMembers.push(member);

            continue;
        }

        const sheet = spreadsheet.sheets.find(
            (sheet) => sheet.properties.title === playerFormat.tab,
        );

        if (typeof sheet !== "object"
            || sheet === null
            || !Array.isArray(sheet.data)
            || typeof sheet.data[0] !== "object"
            || sheet.data[0] === null
            || typeof sheet.data[1] !== "object"
            || sheet.data[1] === null
            || !Array.isArray(sheet.data[0].rowData)
            || !Array.isArray(sheet.data[1].rowData)) {
            invalidMembers.push(member);

            continue;
        }

        const rowIndex = sheet.data[0].rowData.findIndex(
            (nameCell) => typeof nameCell === "object"
                && nameCell !== null
                && Array.isArray(nameCell.values)
                && typeof nameCell.values[0] === "object"
                && nameCell.values[0] !== null
                && typeof nameCell.values[0].formattedValue === "string"
                && normalize(nameCell.values[0].formattedValue)
                === normalize(member.displayName),
        );

        if (rowIndex === -1) {
            invalidMembers.push(member);

            continue;
        }

        const mmrCell = sheet.data[1].rowData[rowIndex];

        if (typeof mmrCell !== "object"
            || mmrCell === null
            || !Array.isArray(mmrCell.values)
            || typeof mmrCell.values[0] !== "object"
            || mmrCell.values[0] === null) {
            invalidMembers.push(member);

            continue;
        }

        const mmr = Number.parseInt(mmrCell.values[0].formattedValue, 10);

        if (!Number.isInteger(mmr)) {
            invalidMembers.push(member);

            continue;
        }

        players.push({ id: member.id, name: member.displayName, mmr });
    }

    if (invalidMembers.length > 0) {
        await sendTemporaryMessage(
            message.channel,
            invalidMembers.map(
                (member) => member.displayName
                    + " is not listed on the "
                    + format.players[members.indexOf(member)].tab
                    + " tab of <https://docs.google.com/spreadsheets/d/"
                    + format.id
                    + ">.",
            ).join("\n"),
        );

        return;
    }

    const team = {
        confirmed: Array(players.length).fill(false),
        id: null,
        players,
    };
    team.confirmed[0] = true;
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
