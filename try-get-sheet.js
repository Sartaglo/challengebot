"use strict";

const { google } = require("googleapis");

exports.tryGetSheet = (
    oAuth2Client,
    spreadsheetId,
    ranges,
) => new Promise(
    (resolve) => {
        google.sheets({ version: "v4", auth: oAuth2Client }).spreadsheets.get(
            { spreadsheetId, ranges, includeGridData: true },
            async (error, response) => {
                if (error) {
                    console.error("Error using Google Sheets:", error.stack);
                    resolve(null);

                    return;
                }

                resolve(response.data);
            },
        );
    },
);
