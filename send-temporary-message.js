"use strict";

const { timeouts } = require("./timeouts");

exports.sendTemporaryMessage = async (channel, content) => {
    const message = await channel.send(content);
    timeouts.push(
        setTimeout(
            async () => {
                try {
                    await message.delete();
                } catch (error) {
                    console.error(error);
                }
            },
            60_000,
        ),
    );
};
