"use strict";

const { google } = require("googleapis");
const { acceptChallenge } = require("./accept-challenge");
const {
    authenticateSpreadsheetAccess,
} = require("./authenticate-spreadsheet-access");
const {
    authorizeSpreadsheetAccess,
} = require("./authorize-spreadsheet-access");
const { cancelChallenge } = require("./cancel-challenge");
const { challengeTeam } = require("./challenge-team");
const { declineChallenge } = require("./decline-challenge");
const { dropTeam } = require("./drop-team");
const { endMatch } = require("./end-match");
const { removeTeam } = require("./remove-team");
const { sendTeamStatus } = require("./send-team-status");
const { startOrConfirmTeam } = require("./start-or-confirm-team");
const { stop } = require("./stop");
const { updateLastMessageTime } = require("./update-last-message-time");

let admin = null;

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
);
oAuth2Client.setCredentials(
    {
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        scope: process.env.GOOGLE_SCOPE,
        token_type: process.env.GOOGLE_TOKEN_TYPE,
        expiry_date: process.env.GOOGLE_EXPIRY_DATE,
    },
);

exports.actOnMessage = async (message, logOut) => {
    if (admin === null) {
        admin = await message.client.users.fetch(
            "484822486861611011",
            false,
            true,
        );
    }

    updateLastMessageTime(message);
    const segments = message.content.replace(/ +/g, " ").split(" ");
    const prefix = "!";
    const [command, ...parameters] = segments;
    const commandWithoutPrefix = command.substring(prefix.length).toLowerCase();

    if (commandWithoutPrefix === "accept") {
        await acceptChallenge(message, parameters);
    } else if (commandWithoutPrefix === "authorize") {
        await authorizeSpreadsheetAccess(
            admin,
            oAuth2Client,
            message,
        );
    } else if (commandWithoutPrefix === "authenticate") {
        await authenticateSpreadsheetAccess(
            admin,
            oAuth2Client,
            message,
            parameters,
        );
    } else if (commandWithoutPrefix === "c"
        || commandWithoutPrefix === "can") {
        await startOrConfirmTeam(oAuth2Client, message, parameters);
    } else if (commandWithoutPrefix === "cancel") {
        await cancelChallenge(message, parameters);
    } else if (commandWithoutPrefix === "challenge") {
        await challengeTeam(message, parameters);
    } else if (commandWithoutPrefix === "decline") {
        await declineChallenge(message, parameters);
    } else if (commandWithoutPrefix === "d"
        || commandWithoutPrefix === "drop") {
        await dropTeam(message, parameters);
    } else if (commandWithoutPrefix === "end") {
        await endMatch(admin, message);
    } else if (commandWithoutPrefix === "r"
        || commandWithoutPrefix === "remove") {
        await removeTeam(message, parameters);
    } else if (commandWithoutPrefix === "stop") {
        await stop(admin, message, logOut);
    } else if (commandWithoutPrefix === "team") {
        await sendTeamStatus(message, parameters);
    }
};
