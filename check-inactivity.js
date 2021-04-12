"use strict";

const { TextChannel } = require("discord.js");
const { listItems } = require("./list-items");
const { readConfiguration } = require("./read-configuration");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { stringifyFormat } = require("./stringify-format");
const { writeConfiguration } = require("./write-configuration");

exports.checkInactivity = async (client) => {
    const configurations = Array
        .from(client.guilds.cache.keys())
        .map(
            (guildId) => ({
                guildId,
                configuration: readConfiguration(guildId),
            }),
        )
        .filter(
            ({ configuration }) => configuration !== null
                && Array.isArray(configuration.pools)
                && configuration.pools.every(
                    (poolToFind) => typeof poolToFind === "object"
                        && poolToFind !== null,
                )
                && Number.isInteger(configuration.warnAfterSeconds)
                && Number.isInteger(configuration.removeAfterSeconds),
        );

    for (
        let configurationIndex = 0;
        configurationIndex < configurations.length;
        configurationIndex += 1
    ) {
        const { guildId, configuration } = configurations[configurationIndex];
        const [challengeChannel, poolChannel] = await Promise.all(
            [
                client.channels.fetch(
                    configuration.challengeChannelId,
                    false,
                    true,
                ),
                client.channels.fetch(configuration.poolChannelId, false, true),
            ],
        );

        if (!(challengeChannel instanceof TextChannel)
            || !(poolChannel instanceof TextChannel)) {
            continue;
        }

        let changed = false;

        for (
            let poolIndex = 0;
            poolIndex < configuration.pools.length;
            poolIndex += 1
        ) {
            const pool = configuration.pools[poolIndex];

            for (
                let teamIndex = 0;
                teamIndex < pool.teams.length;
                teamIndex += 1
            ) {
                const team = pool.teams[teamIndex];
                const seconds = (new Date().getTime()
                    - new Date(team.lastMessageTime).getTime())
                    / 1000;

                if (seconds >= configuration.removeAfterSeconds) {
                    await sendTemporaryMessage(
                        challengeChannel,
                        Number.isInteger(team.id)
                            ? ("Team **["
                                + team.id
                                + "]** has been removed from the "
                                + stringifyFormat(pool.division, pool.teamSize)
                                + " pool.")
                            : ("The unconfirmed "
                                + stringifyFormat(pool.division, pool.teamSize)
                                + " team consisting of "
                                + listItems(
                                    team.players.map((player) => player.name),
                                )
                                + " has been removed."),
                    );
                    pool.teams.splice(teamIndex, 1);
                    pool.changed = true;
                    changed = true;
                } else if (!team.warned
                    && seconds >= configuration.warnAfterSeconds) {
                    const secondsBeforeRemoval =
                        configuration.removeAfterSeconds
                        - configuration.warnAfterSeconds;
                    const minutesBeforeRemoval =
                        Math.floor(secondsBeforeRemoval / 60);
                    await sendTemporaryMessage(
                        challengeChannel,
                        team.players
                            .map((player) => "<@" + player.id + ">")
                            .join(" ")
                        + " your "
                        + (Number.isInteger(team.id)
                            ? ("team will be removed from the "
                                + stringifyFormat(pool.division, pool.teamSize)
                                + " pool")
                            : "unconfirmed team will be removed")
                        + " in "
                        + minutesBeforeRemoval
                        + " minute"
                        + (minutesBeforeRemoval === 1 ? "" : "s")
                        + " unless you send a bot command in this channel.",
                        secondsBeforeRemoval * 1000,
                    );
                    team.warned = true;
                    changed = true;
                }
            }
        }

        if (!changed) {
            continue;
        }

        writeConfiguration(guildId, configuration);
    }
};
