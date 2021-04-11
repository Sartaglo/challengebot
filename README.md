# Challenge Bot 1.0
This is a Discord bot (ChallengeBot#8891) designed to facilitate Mario Kart Wii
scrimmages between pre-made teams in Lounge (https://discord.gg/HkbxJAM).

## Command Overview
- `!c` serves to start a team, confirm for a team, or confirm as a sub.
  - Starting a team involves specifying a division (RT or CT) and tagging your
  teammates.
  - Confirming for a team involves specifying a division (RT or CT) and team
  size (5).
  - Confirming as a sub involves specifying the ID of the team that has
  requested you as a sub.
- `!d` serves to remove one or more of your teams.
  - Specifying a division and a team size will only remove your team from that
  pool.
  - Specifying a division will remove your team from pools of that division of
  any team size.
  - Specifying nothing will remove your teams from all pools.
- `!team` serves to view the status of one of your teams.
  - A division and a team size must be specified.
- `!challenge` serves to request a match of another team in the same pool.
  - The ID of the team being challenged must be specified.
- `!accept` serves to confirm a challenge from another team.
  - The ID of the challenging team must be specified.
- `!decline` serves to remove a challenge from another team.
  - The ID of the challenging team must be specified.
- `!sub` serves to request a sub for an ongoing match.
  - This command must be done in the main channel for challenges and you must
  tag the person you want to sub in for your team in your ongoing match.
- `!remove` is a staff-only command that serves to remove a team from a pool.
  - The ID of the team must be specified.
- `!end` is a staff-only command that serves to remove a match from the server.
  - This command must be done in the text channel created for an accepted
  challenge.

## Forming a team

Team formation is done similarly to 5v5 squad queue in that one person starts
the team by tagging their teammates and then each teammate confirms. **The last
teammate tagged is assumed to be the bagger.** The two differences are that a
division (RT or CT) must be specified for the team and that events are not
scheduled. Instead, each division consists of a pool open at all times from
which teams can challenge one another and play scrimmages.
>[2:03 PM] Sartaglo: !c rt @Stubbz @Process @Edison @Sprixy  
[2:03 PM] ChallengeBot: Stubbz, Process, Edison, and Sprixy must now each send
`!c RT 5` to confirm. Send `!team RT 5` to check the status of your team.  
[2:03 PM] Stubbz: !c rt 5  
[2:03 PM] ChallengeBot: You are now confirmed for RT 5v5. Send `!team RT 5` to
check the status of your team.  
[2:03 PM] Edison: !c rt 5  
[2:03 PM] ChallengeBot: You are now confirmed for RT 5v5. Send `!team RT 5` to
check the status of your team.  
[2:03 PM] Process: !c rt 5  
[2:03 PM] ChallengeBot: You are now confirmed for RT 5v5. Send `!team RT 5` to
check the status of your team.  
[2:03 PM] Sprixy: !c rt 5  
[2:03 PM] ChallengeBot: Your team **[26]** is now confirmed for RT 5v5. You may
now challenge other teams in the pool.  
[2:04 PM] Sartaglo: !team rt 5  
[2:04 PM] ChallengeBot: Team **[26]** for RT 5v5 has 5/5 players confirmed.  
✓ Sartaglo (Runner)  
✓ Stubbz (Runner)  
✓ Process (Runner)  
✓ Edison (Runner)  
✓ Sprixy (Bagger)

## Playing a match
In addition to the *challenge* channel, there is also a *pools* channel
dedicated to presenting the current state of all pools in the server.
>[1:28 PM] ChallengeBot: <span style="text-decoration: underline">**RT 5v5 Pool**</span>  
**[25]** Cheron (1500 Runner MMR), Niko (1500 Runner MMR), Lucas (1500 Runner
MMR), Starstrike (1500 Runner MMR), and Elbling (750 Bagger MMR)  
**[26]** Sartaglo (1500 Runner MMR), Stubbz (1500 Runner MMR), Process (1500
Runner MMR), Edison (1500 Runner MMR), and Sprixy (750 Bagger MMR)
>
>*Pending Challenges: None*

Once you have formed your team, you may challenge other teams in the same pool.
Your challenge will be announced with instructions for the other team and will
be listed as a pending challenge in the pool. When a member of the other team
accepts the challenge, a text channel and two voice channels, one for each team,
will be created to facilitate your match.
>[2:05 PM] Sartaglo: !challenge 25  
[2:05 PM] ChallengeBot: Team **[25]** has been challenged for RT 5v5 by the
following team:
>
>**[26]** Sartaglo (1500 Runner MMR), Stubbz (1500 Runner MMR), Process (1500
Runner MMR), Edison (1500 Runner MMR), and Sprixy (750 Bagger MMR)
>
>To accept this challenge as a member of team **[25]**, send `!accept 26`. To
decline, send `!decline 26`.
[2:06 PM] Cheron: !accept 26

## Obtaining a sub
During a match, players may need to be subbed out for any number of reasons. You
may request a player to sub into your ongoing match from the challenge channel.
If that player accepts the request, they will be added to the appropriate text
and voice channel.
>[2:29 PM] Sartaglo: !sub @ELP  
>[2:29 PM] ChallengeBot: Sartaglo has asked ELP to sub for team **[26]** in
their RT 5v5 match against team **[25]**.  
>[2:30 PM] ELP: !c 26  
>[2:30 PM] ChallengeBot: ELP has agreed to sub in for team **[26]**.  

## Ending a match
After a match completes and a table is posted, a staff member may delete the
text channel and voice channels associated with the match from within that text
channel.
>[3:01 PM] Sartaglo: !end  
>[3:01 PM] ChallengeBot: This channel will be deleted in five seconds.
