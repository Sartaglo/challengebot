"use strict";

exports.normalize = (string) => typeof string === "string"
    ? string.toUpperCase().replace(/\s/g, "").trim()
    : null;
