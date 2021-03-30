"use strict";

const { confirmTeam } = require("./confirm-team");
const { readConfiguration } = require("./read-configuration");
const { sendTemporaryMessage } = require("./send-temporary-message");
const { startTeam } = require("./start-team");
const { supportedDivisions } = require("./supported-divisions");

exports.startOrConfirmTeam = async (oAuth2Client, message, parameters) => {
    if (!message.guild) {
        return;
    }

    const configuration = readConfiguration(message.guild.id);
    const division = parameters[0];

    if (typeof configuration !== "object"
        || configuration === null
        || message.channel.id !== configuration.challengeChannelId
        || !Array.isArray(configuration.formats)
        || !Array.isArray(configuration.pools)) {
        return;
    }

    if (parameters.length <= 1) {
        await sendTemporaryMessage(
            message.channel,
            "To start a team, you must provide a division (RT or CT) and tag"
            + " your teammates. To confirm yourself for a team, you must"
            + " provide a division and a team size.",
        );

        return;
    }

    if (!supportedDivisions.includes(division.toUpperCase())) {
        await sendTemporaryMessage(
            message.channel,
            "To start a team or confirm yourself for a team, you must provide a"
            + " division (RT or CT).",
        );

        return;
    }

    const teamSize = Number.parseInt(parameters[1], 10);

    if (parameters.length === 2 && Number.isInteger(teamSize)) {
        await confirmTeam(message, configuration, division, teamSize);

        return;
    }

    await startTeam(
        oAuth2Client,
        message,
        configuration,
        division,
        parameters.slice(1),
    );
};
