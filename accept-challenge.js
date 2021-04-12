"use strict";

const { findFormat } = require("./find-format");
const { normalize } = require("./normalize");
const { readConfiguration } = require("./read-configuration");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { stringifyFormat } = require("./stringify-format");
const { updateLastMessageTime } = require("./update-last-message-time");
const { writeConfiguration } = require("./write-configuration");

exports.acceptChallenge = async (message, parameters) => {
    if (!message.guild) {
        return;
    }

    const configuration = readConfiguration(message.guild.id);

    if (typeof configuration !== "object"
        || configuration === null
        || message.channel.id !== configuration.challengeChannelId) {
        return;
    }

    updateLastMessageTime(message);
    const challengingTeamId = Number.parseInt(parameters[0], 10);
    const pool = configuration.pools.find(
        (poolToFind) => poolToFind.teams.some(
            (teamToFind) => teamToFind.id === challengingTeamId,
        ),
    );

    if (typeof pool !== "object" || pool === null) {
        await sendTemporaryMessage(
            message.channel,
            "There is no team in any pool in this server with that ID.",
        );

        return;
    }

    const format = await findFormat(
        configuration.formats,
        message.channel,
        pool.division,
        pool.teamSize,
    );

    if (typeof format !== "object" || format === null) {
        return;
    }

    const defendingTeam = pool.teams.find(
        (team) => team.players.some(
            (player) => normalize(player.name)
                === normalize(message.member.displayName),
        ),
    );

    if (typeof defendingTeam !== "object" || defendingTeam === null) {
        await sendTemporaryMessage(
            message.channel,
            "You are not on a team in the pool for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ".",
        );

        return;
    }

    const challengingTeam = pool.teams.find(
        (team) => team.id === challengingTeamId,
    );
    const challenge = pool.challenges.find(
        (challenge) => challenge.challengingTeamId === challengingTeam.id
            && challenge.defendingTeamId === defendingTeam.id,
    );

    if (typeof challenge !== "object" || challenge === null) {
        await sendTemporaryMessage(
            message.channel,
            "That team has not challenged your team for "
            + stringifyFormat(pool.division, pool.teamSize)
            + ".",
        );

        return;
    }

    if (typeof challenge.match === "object" && challenge.match !== null) {
        await sendTemporaryMessage(
            message.channel,
            "Your team has already accepted that challenge.",
        );

        return;
    }

    if (!message.guild.me.hasPermission("ADMINISTRATOR")) {
        await sendTemporaryMessage(
            message.channel,
            "I cannot create the channels for the match because I do not have"
            + " the Administrator permission.",
        );

        return;
    }

    const categoryPermissions = Array.from(
        message.channel.parent.permissionOverwrites.values(),
    );

    try {
        const textChannel = await message.guild.channels.create(
            configuration.matchChannelPrefix
            + challengingTeam.id
            + "-"
            + defendingTeam.id,
            {
                parent: message.channel.parent,
                permissionOverwrites: [
                    ...categoryPermissions,
                    ...challengingTeam.players.map(
                        (player) => ({
                            allow: ["VIEW_CHANNEL"],
                            id: player.id, type: "member",
                        })
                    ),
                    ...defendingTeam.players.map(
                        (player) => ({
                            allow: ["VIEW_CHANNEL"],
                            id: player.id,
                            type: "member",
                        })
                    ),
                ],
                type: "text",
            },
        );
        const challengingVoiceChannel = await message.guild.channels.create(
            configuration.matchChannelPrefix + challengingTeam.id,
            {
                parent: message.channel.parent,
                permissionOverwrites: [
                    ...categoryPermissions,
                    ...challengingTeam.players.map(
                        (player) => ({
                            allow: ["VIEW_CHANNEL", "CONNECT"],
                            id: player.id,
                            type: "member",
                        })
                    ),
                ],
                type: "voice",
            },
        );
        const defendingVoiceChannel = await message.guild.channels.create(
            configuration.matchChannelPrefix + defendingTeam.id,
            {
                parent: message.channel.parent,
                permissionOverwrites: [
                    ...categoryPermissions,
                    ...defendingTeam.players.map(
                        (player) => ({
                            allow: ["VIEW_CHANNEL", "CONNECT"],
                            id: player.id,
                            type: "member",
                        })
                    ),
                ],
                type: "voice",
            },
        );
        challenge.match = {
            challengingVoiceChannelId: challengingVoiceChannel.id,
            defendingVoiceChannelId: defendingVoiceChannel.id,
            challengingPlayerNames: challengingTeam.players.map(
                (player) => player.name,
            ),
            defendingPlayerNames: defendingTeam.players.map(
                (player) => player.name,
            ),
            challengingSubs: [],
            defendingSubs: [],
            textChannelId: textChannel.id,
        };
        pool.teams.splice(pool.teams.indexOf(challengingTeam), 1);
        pool.teams.splice(pool.teams.indexOf(defendingTeam), 1);
        pool.changed = true;
        configuration.pools
            .forEach(
                (otherPool) => {
                    if (otherPool !== pool) {
                        otherPool.teams = otherPool.teams.filter(
                            (team) => team.players.every(
                                (player) => challengingTeam.players
                                    .concat(defendingTeam.players)
                                    .every(
                                        (matchPlayer) =>
                                            normalize(matchPlayer.name)
                                            !== normalize(player.name),
                                    ),
                            ),
                        );
                    }

                    otherPool.challenges = otherPool.challenges.filter(
                        (otherChallenge) =>
                            otherChallenge === challenge
                            || (otherPool.teams.some(
                                (team) => team.id
                                    === otherChallenge.challengingTeamId,
                            )
                                && otherPool.teams.some(
                                    (team) => team.id
                                        === otherChallenge.defendingTeamId,
                                )),
                    );
                    otherPool.changed = true;
                },
            );

        writeConfiguration(message.guild.id, configuration);
        const hostingTeam = Math.floor(Math.random() * 2) + 1 === 1
            ? challengingTeam.id
            : defendingTeam.id;
        const challengingMentions = challengingTeam.players
            .map(
                (player, index) => "<@!"
                    + player.id
                    + ">"
                    + (Array.isArray(format.players)
                        ? (" (" + format.players[index].kind + ")")
                        : ""),
            )
            .join(" ");
        const defendingMentions = defendingTeam.players
            .map(
                (player, index) => "<@!"
                    + player.id
                    + "> "
                    + (Array.isArray(format.players)
                        ? ("(" + format.players[index].kind + ")")
                        : ""),
            )
            .join(" ");
        const explanationMessage = await textChannel.send(
            [
                [
                    "This is a channel created for the "
                    + stringifyFormat(pool.division, pool.teamSize)
                    + " match between the following teams:",
                ],
                [],
                ["**[" + challengingTeam.id + "]** " + challengingMentions],
                ["**[" + defendingTeam.id + "]** " + defendingMentions],
                [],
                [
                    "Team **["
                    + hostingTeam
                    + "]** has been randomly selected as the hosting team.",
                ],
                [],
                ["**__Full alternating spots are required.__**"],
                [],
                [
                    "At the end of the match, tag the appropriate reporter role"
                    + " with the final table. After the table has been"
                    + " reported, a staff member will end the match by sending"
                    + " `!end` in this channel."
                ],
            ].join("\n"),
        );

        try {
            await explanationMessage.pin();
        } catch (error) {
            console.error(error);
        }
    } catch (error) {
        console.error(error);
        await sendTemporaryMessage(message.channel, "Error creating channels.");
    }
};
