"use strict";

exports.getFormatTeamSize = (format) => Array.isArray(format.players)
    ? format.players.length
    : format.teamSize;
