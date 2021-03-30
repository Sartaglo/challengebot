"use strict";

exports.stop = async (admin, message, destroy) => {
    if (message.author.id !== admin.id) {
        return;
    }

    await message.channel.send("Goodbye.");
    destroy();
};
