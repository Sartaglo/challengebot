"use strict";

const { listItems } = require("./list-items");
const { normalize } = require("./normalize");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { tryGetSheet } = require("./try-get-sheet");

exports.loadFormatSpreadsheet = async (
    oAuth2Client,
    message,
    format,
    members,
) => {
    const invalidMembers = [];
    const players = [];

    if (Array.isArray(format.players)) {
        const leaderboardSpreadsheet = await tryGetSheet(
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

        if (typeof leaderboardSpreadsheet !== "object"
            || leaderboardSpreadsheet === null) {
            await sendTemporaryMessage(
                message.channel,
                "Error accessing <https://docs.google.com/spreadsheets/d/"
                + format.id
                + ">.",
            );

            return { invalidMembers: members, players };
        }

        for (let index = 0; index < members.length; index += 1) {
            const member = members[index];
            const playerFormat = format.players[index];

            const sheet = leaderboardSpreadsheet.sheets.find(
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
        }

        return { invalidMembers, players };
    }

    if (typeof format.rosterTab !== "string"
        || format.rosterTab.length === 0
        || typeof format.rosterRowRange !== "string"
        || format.rosterRowRange.length === 0
        || !Number.isInteger(format.teamSize)) {
        return { invalidMembers, players };
    }

    const rosterSpreadsheet = await tryGetSheet(
        oAuth2Client,
        format.id,
        [
            "'" + format.rosterTab + "'!" + format.rosterTeamRange,
            "'" + format.rosterTab + "'!" + format.rosterRowRange,
        ],
    );

    if (typeof rosterSpreadsheet !== "object" || rosterSpreadsheet === null) {
        return { invalidMembers: members, players };
    }

    const sheet = rosterSpreadsheet.sheets.find(
        (sheet) => sheet.properties.title === format.rosterTab,
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
        return { invalidMembers: members, players };
    }

    const rowIndex = sheet.data[1].rowData.findIndex(
        (rowData) => rowData.values.some(
            (value) => normalize(value.formattedValue)
                === normalize(message.member.displayName),
        ),
    );

    if (rowIndex === -1) {
        await sendTemporaryMessage(
            message.channel,
            message.member.displayName + " is not on an MKPS team.",
        );

        return { invalidMembers: members, players };
    }

    const outOfRosterMembers = [];

    for (const member of members) {
        const notInRoster = sheet.data[1].rowData[rowIndex].values.every(
            (value) => normalize(value.formattedValue)
                !== normalize(member.displayName),
        );

        if (notInRoster) {
            outOfRosterMembers.push(member);
            invalidMembers.push(member);

            continue;
        }

        players.push({ id: member.id, name: member.displayName });
    }

    if (outOfRosterMembers.length > 0) {
        await sendTemporaryMessage(
            message.channel,
            listItems(outOfRosterMembers.map((member) => member.displayName))
            + " "
            + (outOfRosterMembers.length === 1 ? "is" : "are")
            + " not on the same MKPS team as "
            + message.member.displayName
            + ".",
        );
    }

    return {
        invalidMembers,
        players,
        teamName: sheet.data[0].rowData[rowIndex].values[0].formattedValue,
    };
};
