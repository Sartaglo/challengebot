"use strict";

const { listItems } = require("./list-items");
const { listTeamMembers } = require("./list-team-members");
const { stringifyFormat } = require("./stringify-format");

exports.getPoolMessage = (format, pool) => {
    const lines = [
        "**__"
        + stringifyFormat(pool.division, pool.teamSize)
        + " Pool__**",
    ];

    const confirmedTeams = pool.teams.filter(
        (team) => team.confirmed.every((confirmed) => confirmed),
    );
    confirmedTeams.sort((first, second) => first.id - second.id);

    if (confirmedTeams.length === 0) {
        lines.push("There are no teams in this pool.");
    } else {
        lines.push(
            ...confirmedTeams
                .map(
                    (team) => "**["
                        + (team.id)
                        + "]** "
                        + listTeamMembers(format, team),
                ),
        );
    }

    const pendingChallenges = pool.challenges.filter(
        (challenge) => typeof challenge.match !== "object"
            || challenge.match === null,
    );
    pendingChallenges.sort(
        (first, second) => first.challengingTeamId !== second.challengingTeamId
            ? (first.challengingTeamId - second.challengingTeamId)
            : (first.defendingTeamId - second.defendingTeamId),
    );
    lines.push(
        "",
        "*Pending Challenges: "
        + (pendingChallenges.length === 0
            ? "None"
            : listItems(
                pendingChallenges
                    .map(
                        (challenge) => "**["
                            + challenge.challengingTeamId
                            + "]** vs. **["
                            + challenge.defendingTeamId
                            + "]**",
                    ),
            ))
        + "*"
    );

    return lines.join("\n");
};
