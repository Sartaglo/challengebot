"use strict";

const { TextChannel, Message } = require("discord.js");
const { readConfiguration } = require("./read-configuration");
const { getPoolMessage } = require("./get-pool-message");
const { writeConfiguration } = require("./write-configuration");
const { tryGetMessage } = require("./try-get-message");
const { findFormat } = require("./find-format");

exports.updatePools = async (client) => {
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
                ),
        );

    for (
        let configurationIndex = 0;
        configurationIndex < configurations.length;
        configurationIndex += 1
    ) {
        const { guildId, configuration } = configurations[configurationIndex];
        const poolChannel = await client.channels.fetch(
            configuration.poolChannelId,
            false,
            true,
        );

        if (!(poolChannel instanceof TextChannel)) {
            continue;
        }

        let changed = false;

        for (
            let poolIndex = 0;
            poolIndex < configuration.pools.length;
            poolIndex += 1
        ) {
            const pool = configuration.pools[poolIndex];
            const format = await findFormat(
                configuration.formats,
                null,
                pool.division,
                pool.teamSize,
            );

            if (!pool.changed
                || typeof format !== "object"
                || format === null) {
                continue;
            }

            changed = true;
            const message = await tryGetMessage(poolChannel, pool.messageId);

            if (message instanceof Message) {
                await message.edit(getPoolMessage(format, pool));
            } else {
                const newMessage = await poolChannel.send(
                    getPoolMessage(format, pool),
                );
                pool.messageId = newMessage.id;
            }

            pool.changed = false;
        }

        if (!changed) {
            continue;
        }

        writeConfiguration(guildId, configuration);
    }
};
