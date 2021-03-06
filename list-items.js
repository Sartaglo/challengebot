"use strict";

exports.listItems = (items, lastDelimiter = "and") => {
    if (!Array.isArray(items) || items.length === 0) {
        return "";
    }

    if (items.length === 1) {
        return items[0];
    }

    if (items.length === 2) {
        return items[0] + " " + lastDelimiter + " " + items[1];
    }

    return items
        .map(
            (item, index, self) => index === self.length - 1
                ? (lastDelimiter + " " + item)
                : item,
        )
        .join(", ");
};
