# Versus
This [Roll20](http://roll20.net/) script presents skill contests in a fun, "death match" style dialog for your players. It allows you to pit two characters (PC or NPC) against each other based on a skill or an attribute, and also accommodates custom skills. Skill rolls are based on the character's proficiencies, but attribute-based rolls use only the base modifier.

This version allows a simple pool style of wagering. Characters can contribute to a pool, betting on either contestant. Once the winner of the contest is announced, the winners of the pool will be displayed along with their cut of the pot.

This script is currently only for use with the [5e Shaped Sheet](http://github.com/mlenser/roll20-character-sheets/tree/master/5eShaped).

## Contest Types
There are two types of contests you can run. The first is a **tandem** contest where both participants are rolling a skill or attribute (usually the same one) to be the "last man standing." A drinking contest, for instance, may use multiple contestants' Constitution rolls until one of them fails to roll over the threshold, passing out and losing the game. Tug-of-War (Str), five finger fillet (Dex), and other contests may fall into this category.

The second type is the **opposing** contest, where one contestant uses one skill while the other uses an opposing skill. The highest roll wins each round, and the winner is the one with the most rounds won. Most traditional skill-based contests would fall under this type: Sharpshooting, horseshoes, etc.

The opposing skill can be either the same skill or a different one depending on your game. A wrestling match, for instance, could be conducted much like a grapple check. Contestant #2 may use either Dexterity or Strength against Contestant #1's Strength over multiple rounds to see who pinned the other the most often. As you can see, this type could also be used for regular opposing skills checks by providing a single round to play, Stealth vs. Perception, Deception vs. Persuasion, etc.

## Rounds
When you create an opposing contest, you can set the number of rounds to play. The default is 5. It is advisable to provide an odd number to help avoid ties. If you wish to break a tie, you will need to start a duplicate contest with only one round.

For both game types, you will get results for each round one at a time to allow for suspense and any flavor text or other activities you wish to provide the players in between rounds. Until the game is over, the GM will receive a "Next Round" button that will generate the results for the next round.

## Threshold
This is the number used in tandem contests to determine the point at which a roll fails. Think of it as a Competition DC. The Versus script will roll for each contestant, and will provide a "Next Round" link to the GM until someone fails to roll greater than the threshold.

## Modifier
An optional modifier can be provided for tandem games. This modifier is added to the threshold on each round after the first, making the game increasingly harder. For instance, giving a modifier of 1 with a threshold of 10 will make the threshold for round two 11, round three 12, etc. You can use decimals to increase the threshold at lower increments. A modifier of 0.5 will increase threshold by 1 every other round. Negative numbers are not allowed and will be converted to positive numbers.

## Buy In
When Betting Pool is turned on during contest setup, you may set the buy in amount (in GP). This is the amount that every character pays into the pool when they bet on a contestant. Characters can only buy in once, and only for the amount set. Default is 100 GP.

## Commands
`!versus config`
Shows the configuration menu where you can set options for display.
1. You may either use the character's avatar and name or the image & name from the character's token. This is an all or nothing setting.
2. You may choose whether or not to reveal the roll results for each round. If you do reveal them, the die roll results will appear when the mouse is hovered over each contestant's round results. If you choose not to display them, only the winner of the round (in the case of opposing contests) or a success/failure message will be shown.

`!versus setup --c1|<token1_ID> --c2|<token2_ID> --title|<contest_title>`
This command begins the setup of a contest. You provide the token ID for contestant #1 and contestant #2 along with the title you wish to use for the contest. This dialog is whispered to the GM, providing links for setting the attribute/skill you wish to use for each contestant, the contest type, number of rounds, the threshold, and the modifier (for tandem contests). When all necessary information is collected, the GM will see a "Begin Contest" button that will then display the contestants' avatars/token images and the name of the contest to the players. GM will get a whispered "next round" button for each round until the contest is complete.
