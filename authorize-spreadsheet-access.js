"use strict";

exports.authorizeSpreadsheetAccess = async (admin, oAuth2Client, message) => {
    if (message.author.id !== admin.id) {
        return;
    }

    const authorizationUrl = oAuth2Client.generateAuthUrl(
        {
            access_type: "offline",
            scope: [
                "https://www.googleapis.com/auth/spreadsheets.readonly",
            ],
        }
    );
    await admin.send(authorizationUrl);

    if (message.guild) {
        await message.channel.send("Sent authorization URL.");
    }
};
