"use strict";

const { listItems } = require("./list-items");

exports.listTeamMembers = (format, team) => listItems(
    team.players.map(
        (player, index) => player.name
            + " ("
            + player.mmr
            + " "
            + format.players[index].kind
            + " MMR)",
    ),
);
