"use strict";

const { confirmSub } = require("./confirm-sub");
const { readConfiguration } = require("./read-configuration");
const { requestSub } = require("./request-sub");
const { sendTemporaryMessage } = require("./send-temporary-message");

exports.requestOrConfirmSub = async (oAuth2Client, message, parameters) => {
    if (!message.guild) {
        return;
    }

    const configuration = readConfiguration(message.guild.id);

    if (typeof configuration !== "object"
        || configuration === null
        || message.channel.id !== configuration.challengeChannelId) {
        return;
    }

    const result = /^<@!?([0-9]+)>$/.exec(parameters[0]);
    const teamId = Number.parseInt(parameters[0], 10);

    if (Array.isArray(result)) {
        await requestSub(oAuth2Client, message, configuration, result[1]);

        return;
    }

    if (Number.isInteger(teamId)) {
        await confirmSub(message, configuration, teamId);

        return;
    }

    await sendTemporaryMessage(
        message.channel,
        "To request a sub, you must tag the user you want to request to"
        + " sub. To confirm as a sub, you must specify the ID of the team"
        + " that requested you to sub.",
    );
};
