"use strict";

const { readConfiguration } = require("./read-configuration");
const { writeConfiguration } = require("./write-configuration");

exports.updateLastMessageTime = (message) => {
    if (!message.guild) {
        return;
    }

    const configuration = readConfiguration(message.guild.id);

    if (typeof configuration !== "object"
        || configuration === null
        || !Array.isArray(configuration.pools)) {
        return;
    }

    const pools = configuration.pools.filter(
        (pool) => pool.teams.some(
            (team) => team.players.some(
                (player) => player.id === message.author.id,
            ),
        ),
    );

    if (pools.length === 0) {
        return;
    }

    pools.forEach(
        (pool) => {
            const team = pool.teams.find(
                (team) => team.players.some(
                    (player) => player.id === message.author.id,
                ),
            );
            team.lastMessageTime = new Date().toJSON();
            team.warned = false;
        },
    );
    writeConfiguration(message.guild.id, configuration);
};
