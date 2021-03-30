"use strict";

exports.tryGetMessage = async (channel, messageId) => {
    try {
        return await channel.messages.fetch(messageId, false, true);
    } catch (error) {
        return null;
    }
};
