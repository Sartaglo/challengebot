"use strict";

const { GuildMember } = require("discord.js");
const { findFormat } = require("./find-format");
const { invalidRoleNames } = require("./invalid-role-names");
const { loadFormatSpreadsheet } = require("./load-format-spreadsheet");
const { normalize } = require("./normalize");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { writeConfiguration } = require("./write-configuration");

exports.requestSub = async (
    oAuth2Client,
    message,
    configuration,
    subUserId,
) => {
    const poolWithMatch = configuration.pools.find(
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

    if (typeof poolWithMatch !== "object" || poolWithMatch === null) {
        await sendTemporaryMessage(
            message.channel,
            "You are not in an ongoing match.",
        );

        return;
    }

    const memberToSub = await message.guild.members.fetch(
        { cache: false, force: true, user: subUserId },
    );

    if (!(memberToSub instanceof GuildMember)
        || invalidRoleNames.includes(memberToSub.roles.highest.name)) {
        await sendTemporaryMessage(
            message.channel,
            "You must tag a verified, non-muted user in this server."
        );

        return;
    }

    const alreadyInPool = configuration.pools.some(
        (pool) => pool.teams.some(
            (team) => team.players.some(
                (player) => normalize(player.id)
                    === normalize(memberToSub.displayName),
            ),
        ),
    );

    if (alreadyInPool) {
        await sendTemporaryMessage(
            message.channel,
            "That user is on a team in a pool and must send `!d` before being"
            + " requested to sub.",
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
                            === normalize(memberToSub.displayName),
                    ),
        ),
    );

    if (alreadyInMatch) {
        await sendTemporaryMessage(
            message.channel,
            "That user is already in an ongoing match.",
        );

        return;
    }

    const format = await findFormat(
        configuration.formats,
        null,
        poolWithMatch.division,
        poolWithMatch.teamSize,
    );
    const { players } = await loadFormatSpreadsheet(
        oAuth2Client,
        message,
        format,
        memberToSub,
    );

    if (players.length === 0) {
        return;
    }

    const challengeWithMatch = poolWithMatch.challenges.find(
        (challenge) => typeof challenge.match === "object"
            && challenge.match !== null
            && challenge.match.challengingPlayerNames
                .concat(challenge.match.defendingPlayerNames)
                .some(
                    (playerName) => normalize(playerName)
                        === normalize(message.member.displayName),
                ),
    );
    const onChallengingTeam =
        challengeWithMatch.match.challengingPlayerNames.some(
            (playerName) => normalize(playerName)
                === normalize(message.member.displayName),
        );

    if (onChallengingTeam) {
        if (!Array.isArray(challengeWithMatch.match.challengingSubs)) {
            challengeWithMatch.match.challengingSubs = [];
        }

        const alreadyRequested = challengeWithMatch.match.challengingSubs.some(
            (sub) => normalize(sub) === normalize(memberToSub.displayName),
        );

        if (alreadyRequested) {
            await sendTemporaryMessage(
                message.channel,
                "That user has already been requested to sub for your team.",
            );

            return;
        }

        challengeWithMatch.match.challengingSubs.push(memberToSub.displayName);
    } else {
        if (!Array.isArray(challengeWithMatch.match.defendingSubs)) {
            challengeWithMatch.match.defendingSubs = [];
        }

        const alreadyRequested = challengeWithMatch.match.defendingSubs.some(
            (sub) => normalize(sub) === normalize(memberToSub.displayName),
        );

        if (alreadyRequested) {
            await sendTemporaryMessage(
                message.channel,
                "That user has already been requested to sub for your team.",
            );

            return;
        }

        challengeWithMatch.match.defendingSubs.push(memberToSub.displayName);
    }

    const subTeamId = onChallengingTeam
        ? challengeWithMatch.challengingTeamId
        : challengeWithMatch.defendingTeamId;
    const otherTeamId = onChallengingTeam
        ? challengeWithMatch.defendingTeamId
        : challengeWithMatch.challengingTeamId;
    writeConfiguration(message.guild.id, configuration);
    await message.channel.send(
        message.member.displayName
        + " has asked "
        + memberToSub.displayName
        + " to sub for team **["
        + subTeamId
        + "]** in their RT 5v5 match against team **["
        + otherTeamId
        + "]**. "
        + "To sub into the match for that team, "
        + memberToSub.displayName
        + " should send `!sub "
        + subTeamId
        + "`.",
    );
};
