"use strict";

const { timeouts } = require("./timeouts");

exports.sendTemporaryMessage = async (channel, content, lifetime = 60_000) => {
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
            lifetime,
        ),
    );
};
