"use strict";

const { readConfiguration } = require("./read-configuration");
const { timeouts } = require("./timeouts");
const { writeConfiguration } = require("./write-configuration");

exports.endMatch = async (admin, message) => {
    if (!message.guild) {
        return;
    }

    const configuration = readConfiguration(message.guild.id);

    if (typeof configuration !== "object"
        || configuration === null) {
        return;
    }

    const hasPowerRole = configuration.powerRoleNames.includes(
        message.member.roles.highest,
    );

    if (message.author.id !== admin.id && hasPowerRole) {
        return;
    }

    const pool = configuration.pools.find(
        (poolToFind) => poolToFind.challenges.some(
            (challenge) => typeof challenge.match === "object"
                && challenge.match !== null
                && challenge.match.textChannelId === message.channel.id,
        ),
    );

    if (typeof pool !== "object" || pool === null) {
        return;
    }

    const challenge = pool.challenges.find(
        (challenge) => typeof challenge.match === "object"
            && challenge.match !== null
            && challenge.match.textChannelId === message.channel.id,
    );
    const [
        textChannel,
        challengingVoiceChannel,
        defendingVoiceChannel,
    ] = await Promise.all(
        [
            message.client.channels.fetch(
                challenge.match.textChannelId,
                false,
                true,
            ),
            message.client.channels.fetch(
                challenge.match.challengingVoiceChannelId,
                false,
                true,
            ),
            message.client.channels.fetch(
                challenge.match.defendingVoiceChannelId,
                false,
                true,
            ),
        ],
    );
    pool.challenges.splice(pool.challenges.indexOf(challenge), 1);
    pool.changed = true;
    writeConfiguration(message.guild.id, configuration);
    await message.channel.send("This channel will be deleted in five seconds.");
    timeouts.push(
        setTimeout(
            async () => {
                await Promise.all(
                    [
                        textChannel.delete(),
                        challengingVoiceChannel.delete(),
                        defendingVoiceChannel.delete(),
                    ],
                );
            },
            5_000,
        ),
    );
};
