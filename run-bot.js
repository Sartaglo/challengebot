"use strict";

const { Client } = require("discord.js");
const { actOnMessage } = require("./act-on-message");
const { timeouts } = require("./timeouts");
const { updatePools } = require("./update-pools");

exports.runBot = async () => {
    const client = new Client();
    client.once(
        "ready",
        () => {
            console.debug("Ready!");
        },
    );
    const messages = [];
    client.on(
        "message",
        async (message) => {
            if (message.author.bot) {
                return;
            }

            messages.push(message);
        },
    );
    let shouldLogOut = false;

    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error(error.stack);
        shouldLogOut = true;
    }

    let messageTimeout = null;
    let updateTimeout = null;
    const logOut = () => {
        timeouts.forEach((timeout) => clearTimeout(timeout));
        clearTimeout(messageTimeout);
        clearTimeout(updateTimeout);
        client.destroy();
    };
    const actOnMessages = () => {
        clearTimeout(messageTimeout);
        messageTimeout = setTimeout(
            async () => {
                if (shouldLogOut) {
                    logOut();

                    return;
                }

                while (messages.length > 0) {
                    try {
                        await actOnMessage(
                            messages.shift(),
                            () => {
                                shouldLogOut = true;
                            },
                        );
                    } catch (error) {
                        console.error(error);
                    }
                }

                if (shouldLogOut) {
                    logOut();

                    return;
                }

                actOnMessages();
            },
            0
        );
    };
    actOnMessages();
    const update = () => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(
            async () => {
                if (shouldLogOut) {
                    logOut();

                    return;
                }

                try {
                    await updatePools(client);
                } catch (error) {
                    console.error(error);
                }

                if (shouldLogOut) {
                    logOut();

                    return;
                }

                update();
            },
            0,
        );
    };
    update();
};
