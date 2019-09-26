# Versus
This [Roll20](http://roll20.net/) script presents skill contests in a fun, "death match" style dialog for your players in D&D 5e games. It allows you to pit two characters (PC or NPC) against each other based on a skill or an attribute, and also accommodates custom skills (Shaped sheet only). Skill rolls are based on the character's proficiencies, but attribute-based rolls use only the base modifier.

Versus also allows a simple pool style of wagering. Characters can contribute to a pool, betting on either contestant. Once the winner of the contest is announced, the winners of the pool will be displayed along with their cut of the pot. If you are using version 5.2 or higher of my [PurseStrings](https://github.com/blawson69/PurseStrings) script, Versus will remove coins from a character bidding on the game automatically, and provide the GM a button to easily distribute the winnings to the appropriate characters.

This script is for use with the D&D 5th Edition OGL Sheet or the [5e Shaped Sheet](http://github.com/mlenser/roll20-character-sheets/tree/master/5eShaped).

## Setup and Game Play
The first step is to begin setting up the game using the [setup command](#commands). This will provide a dialog box with the contestants' avatars/token images and the name of the contest to the players. You will then select the skill or attribute you wish to use for each contestant, the [type of contest](#contest-types), and change any beginning values to suit your game. The name of the contest is also editable, but the contestants themselves are not.

Once you have provided the minimum of information, you will see either a "Begin Contest" or a "Open Betting" button depending on whether betting has been turned on. Either one display a dialog to all players. The Open Betting dialog gives "Bet!" buttons for both contestants, and players can select a character token and click the button to place their bet by contributing the designated amount (provided in setup). If you have PurseStrings installed, it will remove the proper amount of coins from the character's Purse. A "Begin Contest" button is provided to the GM for whenever all betting is completed.

Once you have clicked the "Begin Contest" button, the contest begins. Versus rolls for each contestant and displays the results. Tandem contests will show thumbs up (👍) or thumbs down (👎), while opposing games will show "Winner", "Loser", or "Tie". On each [round](#rounds) while the contest is in progress, the GM will get a "Next Round" button for each round until the contest is complete.

When the contest is complete, the final results are displayed. If betting is on, the characters who bet on the winner will be announced along with the cut of the pool each will receive. If you have PurseStrings installed, the GM will be provided a link to automatically add the cut to each character's Purse.

## Contest Types
There are two types of contests you can run. The first is a **tandem** contest where both participants are rolling a skill or attribute (usually the same one) to be the "last man standing." A drinking contest, for instance, may use multiple contestants' Constitution rolls until one of them fails to roll over the threshold, passing out and losing the game. Contestants may use different skills or attributes, depending on your contest. Tug-of-War (STR), five finger fillet (DEX), and other contests fall into this category.

The second type is the **opposing** contest, where contestants demonstrate a skill in an opposing manner. The highest roll wins each round, and the winner is the one with the most rounds won. Most traditional skill-based contests such as sports would fall under this type: Sharpshooting, horseshoes, etc. The selected skill or attribute for each contestant can either be the same or a different one depending on your game. A wrestling match, for instance, could be conducted much like a grapple check. Contestant #2 may use either Dexterity or Strength against Contestant #1's Strength over multiple rounds to see who pinned the other the most often. As you can see, this type could also be used for regular opposing skills checks by providing a single round to play, Stealth vs. Perception, Deception vs. Persuasion, etc.

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
This command begins the setup of a contest. You provide the token ID for contestant #1 and contestant #2 along with the title you wish to use for the contest. This dialog is whispered to the GM, providing links for setting the attribute/skill you wish to use for each contestant, the contest type, number of rounds, the threshold, and the modifier (for tandem contests). Betting options can also be provided. When all necessary information is collected, a button will appear to take you to the next step.

If you log out of the game while a contest is in setup mode, you can simply use the command without any parameters (`!versus setup`) to start where you left off.

`!versus reset`
This command removes all contest parameters may be use at any time during the course of the game. This means during setup *as well as during a game*.
