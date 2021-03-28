"use strict";

exports.actOnMessage = async (message) => {
    if (!message.author.id === "484822486861611011") {
        return;
    }

    const segments = message.content.replace(/ +/g, " ").split(" ");
    const prefix = "!";
    const [command] = segments;
    const commandWithoutPrefix = command.substring(prefix.length);

    if (commandWithoutPrefix === "stop") {
        await message.channel.send("Goodbye.");
        message.client.destroy();
    }
};
