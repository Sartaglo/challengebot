"use strict";

exports.authenticateSpreadsheetAccess = async (
    admin,
    oAuth2Client,
    message,
    parameters,
) => {
    if (message.author.id !== admin.id || message.guild) {
        return;
    }

    const code = parameters[0];

    if (typeof code !== "string" || code.length === 0) {
        await admin.send("**Usage:** ,authenticate <accessCode>");

        return;
    }

    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        await admin.send("```JSON\n"
            + JSON.stringify(tokens, null, 2)
            + "\n```");
    } catch (error) {
        console.error("Error authenticating:", error.stack);
        await admin.send(error.stack);
    }
};
