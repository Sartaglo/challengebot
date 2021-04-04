"use strict";

const { listItems } = require("./list-items");

exports.listTeamMembers = (format, team) => {
    const members = listItems(
        team.players.map(
            (player, index) => {
                if (Array.isArray(format.players)) {
                    return player.name
                        + " ("
                        + player.mmr
                        + " "
                        + format.players[index].kind
                        + " MMR)";
                }

                return player.name;
            },
        ),
    );

    return typeof team.teamName === "string"
        ? (team.teamName + ": " + members)
        : members;
}
