"use strict";

const { Message } = require("discord.js");
const { normalize } = require("./normalize");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { stringifyFormat } = require("./stringify-format");
const { writeConfiguration } = require("./write-configuration");

exports.confirmSub = async (message, configuration, teamId) => {
    const poolWithMatch = configuration.pools.find(
        (pool) => pool.challenges.some(
            (challenge) => typeof challenge.match === "object"
                && challenge.match !== null
                && ((challenge.challengingTeamId === teamId
                    && challenge.match.challengingSubs.some(
                        (sub) => normalize(sub)
                            === normalize(message.member.displayName),
                    ))
                    || (challenge.defendingTeamId === teamId
                        && challenge.match.defendingSubs.some(
                            (sub) => normalize(sub)
                                === normalize(message.member.displayName),
                        ))),
        ),
    );

    if (typeof poolWithMatch !== "object" || poolWithMatch === null) {
        await sendTemporaryMessage(
            message.channel,
            "You have not been requested to sub into a match for that team.",
        );

        return;
    }

    const alreadyInPool = configuration.pools.some(
        (pool) => pool.teams.some(
            (team) => team.players.some(
                (player) => normalize(player.id)
                    === normalize(message.member.displayName),
            ),
        ),
    );

    if (alreadyInPool) {
        await sendTemporaryMessage(
            message.channel,
            "You are already on a team in a pool and must send `!d` before"
            + " subbing into a match",
        );

        return;
    }

    const alreadyInMatch = configuration.pools.some(
        (pool) => pool.challenges.some(
            (challenge) => typeof challenge.match === "object"
                && challenge.match !== null
                && challenge.match.challengingPlayerNames
                    .concat(challenge.match.defendingPlayerNames)
                    .some(
                        (playerName) => normalize(playerName)
                            === normalize(message.member.displayName),
                    ),
        ),
    );

    if (alreadyInMatch) {
        await sendTemporaryMessage(
            message.channel,
            "You are already in an ongoing match.",
        );

        return;
    }

    const challengeWithMatch = poolWithMatch.challenges.find(
        (challenge) => challenge.challengingTeamId === teamId
            || challenge.defendingTeamId === teamId,
    );
    const onChallengingTeam = challengeWithMatch.challengingTeamId === teamId;

    if (onChallengingTeam) {
        challengeWithMatch.match.challengingPlayerNames.push(
            ...challengeWithMatch.match.challengingSubs.splice(
                challengeWithMatch.match.challengingSubs.findIndex(
                    (sub) => normalize(sub)
                        === normalize(message.member.displayName),
                ),
                1,
            ),
        );
    } else {
        challengeWithMatch.match.defendingPlayerNames.push(
            ...challengeWithMatch.match.defendingSubs.splice(
                challengeWithMatch.match.defendingSubs.findIndex(
                    (sub) => normalize(sub)
                        === normalize(message.member.displayName),
                ),
                1,
            ),
        );
    }

    if (!message.guild.me.hasPermission("ADMINISTRATOR")) {
        await sendTemporaryMessage(
            message.channel,
            "I cannot update the channels for the match because I do not have"
            + " the Administrator permission.",
        );

        return;
    }

    try {
        const [textChannel, voiceChannel] = await Promise.all(
            [
                message.guild.channels.resolve(
                    challengeWithMatch.match.textChannelId,
                ),
                message.guild.channels.resolve(
                    onChallengingTeam
                        ? challengeWithMatch.match.challengingVoiceChannelId
                        : challengeWithMatch.match.defendingVoiceChannelId,
                ),
            ],
        );
        await Promise.all(
            [
                textChannel.updateOverwrite(
                    message.author,
                    { VIEW_CHANNEL: true }),
                voiceChannel.updateOverwrite(
                    message.author,
                    { VIEW_CHANNEL: true, CONNECT: true }),
            ],
        );
        writeConfiguration(message.guild.id, configuration);
        const subTeamId = onChallengingTeam
            ? challengeWithMatch.challengingTeamId
            : challengeWithMatch.defendingTeamId;
        const otherTeamId = onChallengingTeam
            ? challengeWithMatch.defendingTeamId
            : challengeWithMatch.challengingTeamId;
        await message.channel.send(
            "ELP has agreed to sub in for team **["
            + subTeamId
            + "]** in their "
            + stringifyFormat(poolWithMatch.division, poolWithMatch.teamSize)
            + " match against team **["
            + otherTeamId
            + "]**.",
        );
    } catch (error) {
        console.error(error);
        await sendTemporaryMessage(message.channel, "Error updating channels.");
    }
};
