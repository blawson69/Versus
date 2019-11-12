/*
Versus
A Roll20 script to show a "death match" style dialog for attribute and skill contests for the 5e Shaped Sheet.

On Github:	https://github.com/blawson69
Contact me: https://app.roll20.net/users/1781274/ben-l
Like this script? Buy me a coffee:
    https://venmo.com/theRealBenLawson
    https://paypal.me/theRealBenLawson
*/

var Versus = Versus || (function () {
    'use strict';

    //---- INFO ----//

    var version = '2.1.1',
    debugMode = false,
    styles = {
        box:  'background-color: #fff; border: 1px solid #000; padding: 6px; border-radius: 6px; margin-left: -40px; margin-right: 0px;',
        button: 'background-color: #000; border-width: 0px; border-radius: 5px; padding: 5px 8px; color: #fff; text-align: center;',
        textButton: 'background-color: transparent; border: none; padding: 0; color: #591209; text-decoration: underline;',
        buttonWrapper: 'text-align: center; margin: 6px 0; clear: both;',
        textWrapper: 'margin: 10px 0; clear: both;',
        header: 'padding: 0 2px 10px 2px; color: #591209; font-size: 1.5em; font-weight: bold; font-variant: small-caps; font-family: "Times New Roman",Times,serif;',
        title: 'margin-bottom: 6px; color: #591209; font-size: 2.25em; font-weight: bold; font-variant: small-caps; font-family: "Times New Roman",Times,serif;',
        subtitle: 'margin-top: -4px; padding-bottom: 4px; color: #666; font-size: 1.125em; font-variant: small-caps;',
        vs: 'text-align: center; color: #591209; font-size: 2em; font-weight: bold; font-variant: small-caps; font-family: "Times New Roman",Times,serif;',
        code: 'font-family: "Courier New", Courier, monospace; background-color: #ddd; color: #000; padding: 2px 4px;',
        alert: 'color: #C91010; font-size: 1.5em; font-weight: bold; text-align: center;',
        imgLink: 'background-color: transparent; border: none; padding: 0; text-decoration: none;',
        img: 'width: 80px; height: 80px;',
        round: 'font-size: 1.25em; font-weight: bold; white-space: nowrap; vertical-align: bottom; text-align: center;',
        result_on: 'font-size: 1.5em; font-weight: bold; white-space: nowrap; text-align: center; cursor: pointer;',
        result_off: 'font-size: 1.5em; font-weight: bold; white-space: nowrap; text-align: center;',
        accent: 'background-color: ##eaeaea;'
    },

    checkInstall = function () {
        if (!_.has(state, 'Versus')) state['Versus'] = state['Versus'] || {};
        if (typeof state['Versus'].contest == 'undefined') commandReset('hide');
        if (typeof state['Versus'].useTokenInfo == 'undefined') state['Versus'].useTokenInfo = false;
        if (typeof state['Versus'].showRolls == 'undefined') state['Versus'].showRolls = true;

        if (typeof state['Versus'].sheet == 'undefined') {
            var message, sheet = detectSheet();
            if (sheet == 'Unknown') {
                message = 'PurseStrings was unable to detect the character sheet for your game! You must be using either the 5e Shaped Sheet or the 5th Edition OGL Sheet. Please indicate which sheet you are using.';
                message += '<div style=\'' + styles.buttonWrapper + '\'><a style=\'' + styles.button + '\' href="!versus config --sheet ?{Choose Sheet|5e Shaped|5th Edition OGL}">SET SHEET</a></div>';
                adminDialog('Configuration Notice', message);
            } else {
                state['Versus'].sheet = sheet;
            }
        }

        if (usePurseStrings()) {
            var message = 'In order for PurseStrings to integrate with Versus, you <b>must</b> be using version 5.2 or higher! <a style=\'' +
            styles.textButton + '\' href="https://github.com/blawson69/PurseStrings" target="_blank">Click here</a> to download.';
            adminDialog('PurseStrings Upgrade Needed', message);
        }

        log('--> Versus v' + version + ' <-- Initialized. Get ready to rumble!');
		if (debugMode) {
			var d = new Date();
			adminDialog('Debug Mode', 'Versus v' + version + ' loaded at ' + d.toLocaleTimeString());
		}
    },

    //----- INPUT HANDLER -----//

    handleInput = function (msg) {
        if (msg.type == 'api' && msg.content.startsWith('!versus')) {
			var parms = msg.content.split(/\s+/i);
			if (parms[1]) {
				switch (parms[1]) {
					case 'config':
						if (playerIsGM(msg.playerid)) commandConfig(msg.content);
						break;
					case 'setup':
						if (playerIsGM(msg.playerid)) commandSetup(msg.content);
						break;
					case 'pool':
						commandPool(msg);
						break;
					case 'go':
						if (playerIsGM(msg.playerid)) commandGo();
						break;
					case 'cheat':
						if (playerIsGM(msg.playerid)) commandCheat(msg.content);
						break;
					case 'dist':
						if (playerIsGM(msg.playerid)) commandDist(msg.content);
						break;
					case 'reset':
						if (playerIsGM(msg.playerid)) commandReset();
						break;
                    default:
                        commandHelp(msg);
				}
			} else {
				commandHelp(msg);
			}
		}
    },

    commandSetup = function (msg) {
		// Displays a contest setup dialog for the two contestants
        if (state['Versus'].contest.rounds) {
            adminDialog('Setup Error','You cannot modify contest settings while a contest is in progress!');
            return;
        }

		var parms = msg.trim().split(/\s*\-\-/i),
        c1 = (state['Versus'].contest.contestants && state['Versus'].contest.contestants[0]) ? state['Versus'].contest.contestants[0] : {},
        c2 = (state['Versus'].contest.contestants && state['Versus'].contest.contestants[1]) ? state['Versus'].contest.contestants[1] : {};

        _.each(parms, function (x) {
            var parts = x.split(/\s*\|\s*/i);
            if (parts[0] == 'title' && parts[1] != '') state['Versus'].contest.title = parts[1];
            if (parts[0] == 'c1' && parts[1] != '') c1.token_id = parts[1];
            if (parts[0] == 'c2' && parts[1] != '') c2.token_id = parts[1];
            if (parts[0] == 's1' && parts[1] != '') c1 = setSkill(c1, parts[1]);
            if (parts[0] == 's2' && parts[1] != '') c2 = setSkill(c2, parts[1]);
            if (parts[0] == 'm1' && parts[1] != '' && isNum(parts[1])) c1.extra_mod = parseInt(parts[1]);
            if (parts[0] == 'm2' && parts[1] != '' && isNum(parts[1])) c2.extra_mod = parseInt(parts[1]);
            if (parts[0] == 'type' && parts[1] != '' && parts[1].search(/(tandem|opposing|points)/) != -1) state['Versus'].contest.type = parts[1];
            if (parts[0] == 'rl' && parts[1] != '' && isNum(parts[1])) state['Versus'].contest.round_limit = parseInt(parts[1]);
            if (parts[0] == 'bt' && parts[1] != '') state['Versus'].contest.break_ties = !state['Versus'].contest.break_ties;
            if (parts[0] == 'dc' && parts[1] != '' && isNum(parts[1])) state['Versus'].contest.dc = parseInt(parts[1]);
            if (parts[0] == 'm' && parts[1] != '' && isNum(parts[1])) state['Versus'].contest.mod = Math.abs(parts[1]);
            if (parts[0] == 'pc' && parts[1] != '' && isNum(parts[1])) state['Versus'].contest.point_cap = Math.abs(parts[1]);
            if (parts[0] == 'pm' && parts[1] != '' && isNum(parts[1])) state['Versus'].contest.points_margin = Math.abs(parts[1]);
            if (parts[0] == 'buyin' && parts[1] != '' && isNum(parts[1])) state['Versus'].contest.pool_amt = Math.abs(parts[1]);
            if (parts[0] == 'toggle-bet') state['Versus'].contest.allow_pool = !state['Versus'].contest.allow_pool;
        });

        if (c1.token_id && c2.token_id && state['Versus'].contest.title) {
            var token1 = getObj('graphic', c1.token_id);
            var token2 = getObj('graphic', c2.token_id);
            if (token1 && token2) {
                var contestant1 = getObj('character', token1.get('represents'));
                var contestant2 = getObj('character', token2.get('represents'));
                if (contestant1 && contestant2) {
                    c1.id = contestant1.get('id');
                    c2.id = contestant2.get('id');
                    c1.img = state['Versus'].useTokenInfo ? token1.get('imgsrc') : contestant1.get('avatar');
                    if (c1.img == '' && !state['Versus'].useTokenInfo) c1.img = token1.get('imgsrc');
                    c2.img = state['Versus'].useTokenInfo ? token2.get('imgsrc') : contestant2.get('avatar');
                    if (c2.img == '' && !state['Versus'].useTokenInfo) c2.img = token2.get('imgsrc');
                    c1.name = (state['Versus'].useTokenInfo || isNPC(token1.get('represents'))) ? token1.get('name') : contestant1.get('name');
                    c2.name = (state['Versus'].useTokenInfo || isNPC(token2.get('represents'))) ? token2.get('name') : contestant2.get('name');
                    c1.extra_mod = (c1.extra_mod) ? c1.extra_mod : 0;
                    c2.extra_mod = (c2.extra_mod) ? c2.extra_mod : 0;

                    if (!state['Versus'].contest.contestants) {
                        state['Versus'].contest.contestants = [];
                        state['Versus'].contest.contestants.push(c1);
                        state['Versus'].contest.contestants.push(c2);
                    } else {
                        if (c1.skill_id) state['Versus'].contest.contestants[0] = c1;
                        if (c2.skill_id) state['Versus'].contest.contestants[1] = c2;
                    }

                    var message = headerRows(true) + '</table>';
                    // Contestant #1
                    message += '<hr><div style=\'' + styles.textWrapper + '\'><b>Contestant 1: ' + c1.name + '</b><br>';
                    if (!c1.skill_id) {
                        message += 'Skill: <a style=\'' + styles.textButton + '\' href="!versus setup --s1|?{Skill' + getSkills(c1.id) + '}" title="Choose skill for ' + c1.name + '">Choose</a><br>';
                    } else {
                        message += 'Skill: <b>' + c1.skill_name + (c1.skill_id.startsWith('-') ? ' (' + c1.skill_ability + ')' : '') + '</b> <a style=\'' + styles.imgLink + '\' href="!versus setup --s1|?{Skill' + getSkills(c1.id) + '}" title="Change Skill for ' + c1.name + '">✏️</a><br>';
                    }
                    if (!c1.extra_mod) {
                        message += 'Cheat: <a style=\'' + styles.textButton + '\' href="!versus setup --m1|?{Cheat}" title="Set the cheat for ' + c1.name + '">Set</a>';
                    } else {
                        message += 'Cheat: <b>' + c1.extra_mod + '</b> <a style=\'' + styles.imgLink + '\' href="!versus setup --m1|?{Cheat|' + c1.extra_mod + '}" title="Change the Cheat for ' + c1.name + '">✏️</a>';
                    }
                    message += '</div>';

                    // Contestant #2
                    message += '<div style=\'' + styles.textWrapper + '\'><b>Contestant 2: ' + c2.name + '</b><br>';
                    if (!c2.skill_id) {
                        message += 'Skill: <a style=\'' + styles.textButton + '\' href="!versus setup --s2|?{Skill' + getSkills(c2.id) + '}" title="Choose skill for ' + c2.name + '">Choose</a><br>';
                    } else {
                        message += 'Skill: <b>' + c2.skill_name + (c2.skill_id.startsWith('-') ? ' (' + c2.skill_ability + ')' : '') + '</b> <a style=\'' + styles.imgLink + '\' href="!versus setup --s2|?{Skill' + getSkills(c2.id) + '}" title="Change Skill for ' + c2.name + '">✏️</a><br>';
                    }
                    if (!c2.extra_mod) {
                        message += 'Cheat: <a style=\'' + styles.textButton + '\' href="!versus setup --m2|?{Cheat}" title="Set the cheat for ' + c2.name + '">Set</a>';
                    } else {
                        message += 'Cheat: <b>' + c2.extra_mod + '</b> <a style=\'' + styles.imgLink + '\' href="!versus setup --m2|?{Cheat|' + c2.extra_mod + '}" title="Change the Cheat for ' + c2.name + '">✏️</a>';
                    }
                    message += '</div>';

                    message += '<hr><div style=\'' + styles.textWrapper + '\'><b>Contest Parameters</b><br>';
                    if (!state['Versus'].contest.type) {
                        message += '<b>Contest type:</b> <a style=\'' + styles.textButton + '\' href="!versus setup --type|tandem">tandem</a> | <a style=\'' + styles.textButton + '\' href="!versus setup --type|opposing">opposing</a> | <a style=\'' + styles.textButton + '\' href="!versus setup --type|points">points</a>';
                    } else {
                        message += '<b>Contest type:</b> ' + state['Versus'].contest.type + ' ';
                        message += '<a style=\'' + styles.imgLink + '\' href="!versus setup --type|?{Type|Tandem,tandem|Opposing,opposing|Points,points}" title="Change Contest Type">✏️</a>';

                        switch (state['Versus'].contest.type) {
                            case 'tandem':
                                message += '<br><b>Threshold:</b> ' + state['Versus'].contest.dc + ' <a style=\'' + styles.imgLink + '\' href="!versus setup --dc|?{Threshold}" title="Change Threshold">✏️</a>';
                                message += '<br><b>Modifier:</b> ' + state['Versus'].contest.mod + ' <a style=\'' + styles.imgLink + '\' href="!versus setup --m|?{Modifier}" title="Change Modifier">✏️</a>';
                            break;
                            case 'points':
                                message += '<br><b>Point Cap:</b> ' + state['Versus'].contest.point_cap + ' <a style=\'' + styles.imgLink + '\' href="!versus setup --pc|?{Point Cap}" title="Change Point Cap">✏️</a>';
                                message += '<br><b>Margin:</b> ' + state['Versus'].contest.points_margin + ' <a style=\'' + styles.imgLink + '\' href="!versus setup --pm|?{Margin}" title="Change Margin">✏️</a>';
                            break;
                            case 'opposing':
                                message += '<br><b>Round Limit:</b> ' + state['Versus'].contest.round_limit + ' <a style=\'' + styles.imgLink + '\' href="!versus setup --rl|?{Round Limit}" title="Change Round Limit">✏️</a>';
                                message += '<br><b>Break Ties:</b> ' + state['Versus'].contest.break_ties + ' <a style=\'' + styles.imgLink + '\' href="!versus setup --bt|toggle" title="Toggle Breaking Ties">✏️</a>';
                            break;
                        }
                    }
                    message += '</div>';

                    message += '<hr><div style=\'' + styles.textWrapper + '\'><b>Betting Pool: ';
                    if (!state['Versus'].contest.allow_pool) {
                        message += 'Off</b> <a style=\'' + styles.imgLink + '\' href="!versus setup --toggle-bet" title="Turn betting on">✏️</a><br>';
                    } else {
                        message += 'On</b> <a style=\'' + styles.imgLink + '\' href="!versus setup --toggle-bet" title="Turn betting off">✏️</a><br>';

                        message += '<b>Buy In:</b> ' + state['Versus'].contest.pool_amt + ' gp <a style=\'' + styles.textButton + '\' href="!versus setup --buyin|?{Buy In Amount}" title="Change Buy In Amount">✏️</a>';
                    }
                    message += '</div>';

                    if (setupComplete()) {
                        var link = (state['Versus'].contest.allow_pool) ? '!versus pool' : '!versus go';
                        var text = (state['Versus'].contest.allow_pool) ? 'Open Betting' : 'Begin Contest!';
                        message += '<br><div style=\'' + styles.buttonWrapper + '\'><a style=\'' + styles.button + '\' href="' + link + '">' + text + '</a></div>';
                    }

                    adminDialog('', message);
                } else {
                    adminDialog('Setup Error','One or more invalid character IDs.');
                }
            } else {
                adminDialog('Setup Error','One or more invalid token IDs.');
            }
        } else {
            adminDialog('Setup Error','Missing parameters. Try again.');
        }
	},

    commandCheat = function (msg) {
        if (state['Versus'].contest.rounds) {
            var message = '', parms = msg.trim().split(/\s*\-\-/i),
            c1 = (state['Versus'].contest.contestants && state['Versus'].contest.contestants[0]) ? state['Versus'].contest.contestants[0] : {},
            c2 = (state['Versus'].contest.contestants && state['Versus'].contest.contestants[1]) ? state['Versus'].contest.contestants[1] : {};

            _.each(parms, function (x) {
                var parts = x.split(/\s*\|\s*/i);
                if (parts[0] == 'm1' && parts[1] != '' && isNum(parts[1])) c1.extra_mod = parseInt(parts[1]);
                if (parts[0] == 'm2' && parts[1] != '' && isNum(parts[1])) c2.extra_mod = parseInt(parts[1]);
            });

            message += '<div style=\'' + styles.buttonWrapper + 'padding-top: 2px;\'>';
            message += '<a style=\'' + styles.button + 'float: left; margin-left: 6px;\' href="!versus cheat --m1|?{Cheat|' + c1.extra_mod + '}" title="Change the cheat for ' + c1.name + '">🎲</a> ';
            message += '<a style=\'' + styles.button + '\' href="!versus go">Next Round!</a>';
            message += '<a style=\'' + styles.button + 'float: right; margin-right: 6px;\' href="!versus cheat --m2|?{Cheat|' + c2.extra_mod + '}" title="Change the cheat for ' + c2.name + '">🎲</a>';
            message += '</div>';
            adminDialog('', message);
        }
    },

    commandGo = function () {
        // Displays the contest progress to all players
        if (!setupComplete()) {
            adminDialog('Contest Error', 'You cannot start a contest without completing setup!<div style=\'' + styles.buttonWrapper + '\'><a style=\'' + styles.button + '\' href="!versus setup">Go to Setup</a></div>');
            return;
        }

        var round = {}, last_round, message = headerRows(), c1_winner = false, c2_winner = false,
        c1 = state['Versus'].contest.contestants[0], c2 = state['Versus'].contest.contestants[1];
        var winning_wagers, losing_wagers;

        if (!state['Versus'].contest.rounds) {
            state['Versus'].contest.rounds = [];
            round.num = 1;
        } else {
            if (state['Versus'].contest.type == 'opposing' || state['Versus'].contest.type == 'points') {
                _.each(state['Versus'].contest.rounds, function (rnd) {
                    var round_title = (state['Versus'].contest.break_ties && state['Versus'].contest.type == 'opposing' && rnd.num > state['Versus'].contest.round_limit) ? 'Tie Breaker' : 'Round ' + rnd.num;
                    message += '<tr><td style="text-align: center;">' + rnd.c1_result + '</td><td style="text-align: center; white-space: nowrap;"> ' + round_title + '</td><td style="text-align: center;">' + rnd.c2_result + '</td></tr>';
                });
            }
            last_round = _.last(state['Versus'].contest.rounds);
            round.num = last_round.num + 1;
        }

        var c1_roll_result = randomInteger(20), c2_roll_result = randomInteger(20);
        var c1_roll_total = c1_roll_result + c1.skill_mod + c1.extra_mod;
        var c2_roll_total = c2_roll_result + c2.skill_mod + c2.extra_mod;
        var c1_roll = state['Versus'].showRolls ? ' title="1d20 + ' + c1.skill_mod + '[' + c1.skill_ability.toLowerCase() + '] + ' + c1.extra_mod + '[misc] = ' + c1_roll_result + '+' + c1.skill_mod + '+' + c1.extra_mod + ' = ' + c1_roll_total + '"' : '';
        var c2_roll = state['Versus'].showRolls ? ' title="1d20 + ' + c2.skill_mod + '[' + c2.skill_ability.toLowerCase() + '] + ' + c2.extra_mod + '[misc] = ' + c2_roll_result + '+' + c2.skill_mod + '+' + c2.extra_mod + ' = ' + c2_roll_total + '"' : '';

        switch (state['Versus'].contest.type) {
            case 'opposing':
                var c1_wins = _.size(_.filter(state['Versus'].contest.rounds, function (rnd) { return rnd.c1_result.search('Winner') > -1; }));
                var c2_wins = _.size(_.filter(state['Versus'].contest.rounds, function (rnd) { return rnd.c2_result.search('Winner') > -1; }));

                if (c1_roll_total > c2_roll_total) {
                    c1_wins++;
                    round.c1_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + 'color: #c00;"' + c1_roll + '>Winner</b>';
                    round.c2_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + '"' + c2_roll + '>Loser</b>';
                }
                if (c2_roll_total > c1_roll_total) {
                    c2_wins++;
                    round.c1_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + '"' + c1_roll + '>Loser</b>';
                    round.c2_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + 'color: #c00;"' + c2_roll + '>Winner</b>';
                }
                if (c1_roll_total == c2_roll_total) {
                    round.c1_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + 'color: #1e65ff;"' + c1_roll + '>Tie</b>';
                    round.c2_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + 'color: #1e65ff;"' + c2_roll + '>Tie</b>';
                }
                message += '<tr><td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + '">' + round.c1_result + '</td>';
                if (state['Versus'].contest.break_ties && round.num > state['Versus'].contest.round_limit) {
                    message += '<td style="' + styles.round + ' white-space: nowrap;">Tie Breaker</td>';
                } else {
                    message += '<td style="' + styles.round + ' white-space: nowrap;">Round ' + round.num + '</td>';
                }
                message += '<td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + '">' + round.c2_result + '</td></tr>';

                if (round.num >= state['Versus'].contest.round_limit) {
                    if (c1_wins == c2_wins) {
                        if (!state['Versus'].contest.break_ties) state['Versus'].contest.winner = '🏆 It\'s a Tie 🏆';
                        else message += '<tr><td colspan="3" style="font-size: 1.125em; white-space: nowrap; text-align: center; color: #1e65ff; padding: 8px 4px 4px;">&laquo; Tie Breaker Needed &raquo;</td></tr>';
                    } else {
                        if (c1_wins > c2_wins) {
                            state['Versus'].contest.winner = '🏆 ' + c1.name;
                            state['Versus'].contest.winner_id = c1.id;
                            winning_wagers = c1.wagers;
                            losing_wagers = c2.wagers;
                        } else {
                            state['Versus'].contest.winner = '🏆 ' + c2.name;
                            state['Versus'].contest.winner_id = c2.id;
                            winning_wagers = c2.wagers;
                            losing_wagers = c1.wagers;
                        }
                    }
                }
            break;

            case 'points':
                if (typeof c1.points == 'undefined') c1.points = 0;
                if (typeof c2.points == 'undefined') c2.points = 0;
                if (c1_roll_total > c2_roll_total) {
                    c1.points++;
                    round.c1_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + 'color: #c00;"' + c1_roll + '>' + c1.points + ' pts.</b>';
                    round.c2_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + '"' + c2_roll + '>' + c2.points + ' pts.</b>';
                }
                if (c1_roll_total < c2_roll_total) {
                    c2.points++;
                    round.c1_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + '"' + c1_roll + '>' + c1.points + ' pts.</b>';
                    round.c2_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + 'color: #c00;"' + c2_roll + '>' + c2.points + ' pts.</b>';
                }
                if (c1_roll_total == c2_roll_total) {
                    round.c1_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + 'color: #1e65ff;"' + c1_roll + '>Tie</b>';
                    round.c2_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + 'color: #1e65ff;"' + c2_roll + '>Tie</b>';
                }

                message += '<tr><td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + '">' + round.c1_result + '</td>';
                message += '<td style="' + styles.round + ' white-space: nowrap;">Round ' + round.num + '</td>';
                message += '<td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + '">' + round.c2_result + '</td></tr>';

                var c1_wins = (c1.points >= state['Versus'].contest.point_cap && c1.points > c2.points && Math.abs(c1.points - c2.points) >= state['Versus'].contest.points_margin);
                var c2_wins = (c2.points >= state['Versus'].contest.point_cap && c2.points > c1.points && Math.abs(c1.points - c2.points) >= state['Versus'].contest.points_margin);
                if (c1_wins && !c2_wins) {
                    state['Versus'].contest.winner = '🏆 ' + c1.name;
                    state['Versus'].contest.winner_id = c1.id;
                    winning_wagers = c1.wagers;
                    losing_wagers = c2.wagers;
                }
                if (c2_wins && !c1_wins) {
                    state['Versus'].contest.winner = '🏆 ' + c2.name;
                    state['Versus'].contest.winner_id = c2.id;
                    winning_wagers = c2.wagers;
                    losing_wagers = c1.wagers;
                }
            break;

            case 'tandem':
                message += '<tr>';
                if (c1_roll_total < Math.floor(state['Versus'].contest.dc)) {
                    message += '<td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + 'width: 80px;"><span' + c1_roll + '>👎</span></td>';
                    c2_winner = true;
                } else {
                    message += '<td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + 'width: 80px;"><span' + c1_roll + '>👍</span></td>';
                }
                message += '<td style="' + styles.round + 'white-space: nowrap;">Round ' + round.num + '</td>';
                if (c2_roll_total < Math.floor(state['Versus'].contest.dc)) {
                    message += '<td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + 'width: 80px;"><span' + c2_roll + '>👎</span></td>';
                    c1_winner = true;
                } else {
                    message += '<td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + 'width: 80px;"><span' + c2_roll + '>👍</span></td>';
                }
                message += '</tr>';

                if (c1_winner && c2_winner) {
                    state['Versus'].contest.winner = 'No Winner';
                } else {
                    if (c1_winner && !c2_winner) {
                        state['Versus'].contest.winner = '🏆 ' + c1.name;
                        state['Versus'].contest.winner_id = c1.id;
                        winning_wagers = c1.wagers;
                        losing_wagers = c2.wagers;
                    }
                    if (c2_winner && !c1_winner) {
                        state['Versus'].contest.winner = '🏆 ' + c2.name;
                        state['Versus'].contest.winner_id = c2.id;
                        winning_wagers = c2.wagers;
                        losing_wagers = c1.wagers;
                    }
                }

                state['Versus'].contest.dc = state['Versus'].contest.dc + state['Versus'].contest.mod;
            break;
        }

        message += '</table>';

        if (state['Versus'].contest.winner && state['Versus'].contest.winner != '') {
            message += '<br><div style=\'' + styles.buttonWrapper + '\'><b>And the winner is...</b><br><div style=\'' + styles.title + 'margin: 3px 0; line-height: 1.125\'>' + state['Versus'].contest.winner + '</div></div>';
            if (state['Versus'].contest.allow_pool) {
                if (winning_wagers) {
                    if (_.size(winning_wagers) == 1) {
                        message += '<hr><div style=\'' + styles.header + 'padding-top: 0;\'>Pool Results</div>The winner of the ' + state['Versus'].contest.pool_total + ' gp pool is:';
                        message += '<b>' + winning_wagers[0].name + '</b>!<br>They get the entire pot.';
                    } else {
                        message += '<hr><div style=\'' + styles.header + 'padding-top: 0;\'>Pool Results</div>The winners of the ' + state['Versus'].contest.pool_total + ' gp pool are:<ul>';
                        _.each(winning_wagers, function (winner) {
                            message += '<li>' + winner.name + '</li>';
                        });
                        message += '</ul>Their cut is <b>' + getCut(state['Versus'].contest.pool_total, _.size(winning_wagers)) + '</b> each.';
                    }
                } else {
                    message += '<hr><div style=\'' + styles.header + 'padding-top: 0;\'>Pool Results</div>There are no winners of the ' + state['Versus'].contest.pool_total + ' gp pool. Buy ins are all returned.';
                }
            }
        } else {
            state['Versus'].contest.rounds.push(round);
        }

        showDialog('', message);

        var gm_message;
        if (!state['Versus'].contest.winner) {
            gm_message = '<div style=\'' + styles.buttonWrapper + 'padding-top: 2px;\'>';
            gm_message += '<a style=\'' + styles.button + 'float: left; margin-left: 6px;\' href="!versus cheat --m1|?{Cheat|' + c1.extra_mod + '}" title="Change the cheat for ' + c1.name + '">🎲</a> ';
            gm_message += '<a style=\'' + styles.button + '\' href="!versus go">Next Round!</a>';
            gm_message += '<a style=\'' + styles.button + 'float: right; margin-right: 6px;\' href="!versus cheat --m2|?{Cheat|' + c2.extra_mod + '}" title="Change the cheat for ' + c2.name + '">🎲</a>';
            gm_message += '</div>';
            adminDialog('', gm_message);
        } else {
            if (state['Versus'].contest.allow_pool && usePurseStrings()) {
                if (state['Versus'].contest.winner_id) gm_message = '<div style=\'' + styles.buttonWrapper + '\'><a style=\'' + styles.button + '\' href="!versus dist --who|' + state['Versus'].contest.winner_id + '">Distribute Winnings</a></div></div>';
                else gm_message = '<div style=\'' + styles.buttonWrapper + '\'><a style=\'' + styles.button + '\' href="!versus dist --who|all">Return Buy Ins</a></div></div>';
            } else {
                gm_message = '<div style=\'' + styles.buttonWrapper + '\'>&laquo; Contest complete. &raquo;</div>';
                commandReset('hide');
            }
            adminDialog('', gm_message);
        }
    },

    commandPool = function (msg) {
        // Displays betting dialog to players
        if (state['Versus'].contest.rounds) {
            adminDialog('Betting Error','Betting is closed after the contest is underway!');
            return;
        }

        var parms = msg.content.split(/\s*\-\-/i), bet_id, bet_amt = state['Versus'].contest.pool_amt, message = headerRows(),
        c1 = (state['Versus'].contest.contestants && state['Versus'].contest.contestants[0]) ? state['Versus'].contest.contestants[0] : {},
        c2 = (state['Versus'].contest.contestants && state['Versus'].contest.contestants[1]) ? state['Versus'].contest.contestants[1] : {};
        if (!state['Versus'].contest.pool_total) state['Versus'].contest.pool_total = 0;
        if (!c1.wagers) c1.wagers = [];
        if (!c2.wagers) c2.wagers = [];

        _.each(parms, function (x) {
            var parts = x.split(/\s*\|\s*/i);
            if (parts[0] == 'for' && parts[1] != '') bet_id = parts[1];
            if (parts[0] == 'amt' && parts[1] != '' && isNum(parts[1])) bet_amt = Math.abs(parts[1]);
        });

        if (bet_id && bet_amt) {
            if (!msg.selected) {
                showDialog('Error', 'You must have a character token selected!', '', msg.who);
            } else {
                var token = getObj(msg.selected[0]._type, msg.selected[0]._id);
                if (!token) {
                    showDialog('Error', 'You must have a character token selected!', '', msg.who);
                    return;
                }

                var char = getObj('character', token.get('represents'));
                var wagerer_name = (char && !isNPC(token.get('represents'))) ? char.get('name') : token.get('name');
                if (!char && !playerIsGM(msg.playerid)) {
                    showDialog('Error', 'You must select a token that represents a character!', '', msg.who);
                    return;
                }

                if (bet_amt != state['Versus'].contest.pool_amt) {
                    showDialog('Invalid Amount', 'Your bet must be ' + state['Versus'].contest.pool_amt + '.', '', msg.who);
                    return;
                }

                if (_.find(c2.wagers, function (x) {return x.id == token.get('id');}) || _.find(c1.wagers, function (x) {return x.id == token.get('id');})) {
                    showDialog('Cheating Blocked', 'You may only bet once!', '', msg.who);
                    return;
                }

                if (char && usePurseStrings()) {
                    var valid_wager = PurseStrings.changePurse(state['Versus'].contest.pool_amt + 'gp', char.get('id'), 'subt');
                    if (valid_wager) {
                        showDialog('Purse Updated', bet_amt + ' gp has been removed from your Purse.', char.get('name'), msg.who);
                    } else {
                        showDialog('Transaction Error', 'You don\'t have enough money to buy in!', char.get('name'), msg.who);
                        return;
                    }
                }

                if (bet_id == c1.id) {
                    var wagerer = _.find(c1.wagers, function (x) {return x.id == token.get('id');});
                    if (wagerer) wagerer.amt += bet_amt;
                    else c1.wagers.push({id: token.get('id'), name: wagerer_name, amt: bet_amt});
                    var bet_on = (token.get('represents') == c1.id) ? 'themselves' : c1.name;
                    showDialog('Bet Placed', token.get('name') + ' placed a <b>' + bet_amt + ' gp</b> bet on ' + bet_on + '.');
                }
                if (bet_id == c2.id) {
                    var wagerer = _.find(c2.wagers, function (x) {return x.id == token.get('id');});
                    if (wagerer) wagerer.amt += bet_amt;
                    else c2.wagers.push({id: token.get('id'), name: wagerer_name, amt: bet_amt});
                    var bet_on = (token.get('represents') == c2.id) ? 'themselves' : c2.name;
                    showDialog('Bet Placed', wagerer_name + ' placed a <b>' + bet_amt + ' gp</b> bet on ' + bet_on + '.');
                }
                state['Versus'].contest.pool_total += bet_amt;
            }
        }

        message += '<tr><td><div style=\'' + styles.buttonWrapper + '\'><a style=\'' + styles.button + '\' href="!versus pool --for|' + c1.id + '" title="Place a bet on ' + c1.name + '">Bet!</a></div></td>';
        message += '<td style="vertical-align: middle;">Pool: ' + state['Versus'].contest.pool_total + ' gp<br>Buy In: ' + state['Versus'].contest.pool_amt + ' gp</td>';
        message += '<td><div style=\'' + styles.buttonWrapper + '\'><a style=\'' + styles.button + '\' href="!versus pool --for|' + c2.id + '" title="Place a bet on ' + c2.name + '">Bet!</a></div></td></tr>';

        showDialog('', message);
        adminDialog('','<div style="' + styles.buttonWrapper + '"><a style=\'' + styles.button + '\' href="!versus go">Begin Contest!</a></div>');
    },

    commandDist = function (msg) {
        if (state['Versus'].contest.contestants) {
            var winner_id, winners = [], cut, parms = msg.split(/\s*\-\-/i),
            c1 = state['Versus'].contest.contestants[0], c2 = state['Versus'].contest.contestants[1] ;

            _.each(parms, function (x) {
                var parts = x.split(/\s*\|\s*/i);
                if (parts[0] == 'who' && parts[1] != '') winner_id = parts[1].trim();
            });

            if (winner_id == 'all') {
                winners.push(c1.wagers);
                winners.push(c2.wagers);
            } else {
                if (winner_id == c1.id) winners.push(c1.wagers);
                else winners.push(c2.wagers);
            }

            winners = _.flatten(winners);
            cut = getCut(state['Versus'].contest.pool_total, _.size(winners));
            _.each(winners, function (winner) {
                var token = getObj('graphic', winner.id);
                var char = getObj('character', token.get('represents'));
                if (char) {
                    var added = PurseStrings.changePurse(cut, char.get('id'), 'add');
                    if (added) {
                        showDialog('Purse Updated', cut + ' has been added to your Purse.', char.get('name'), char.get('name'));
                    }
                }
            });

            adminDialog('', '<div style=\'' + styles.buttonWrapper + '\'>&laquo; Contest complete. &raquo;</div>');
            commandReset('hide');
        } else {
            adminDialog('Error', 'There is no game in progress.');
        }
    },

    setSkill = function (charObj, skill_id) {
        if (state['Versus'].sheet == '5e Shaped') {
            var re = new RegExp('^repeating_skill_' + skill_id + '_.+$', 'i');
            var attr_names = [{acro: 'STR', name: 'Strength'},{acro: 'DEX', name: 'Dexterity'},{acro: 'CON', name: 'Constitution'},{acro: 'INT', name: 'Intelligence'},{acro: 'WIS', name: 'Wisdom'},{acro: 'CHA', name: 'Charisma'}];

            var charAttrs = findObjs({type: 'attribute', characterid: charObj.id}, {caseInsensitive: true});
            var skills = _.filter(charAttrs, function (attr) { return (attr.get('name').match(re) !== null); });
            var deets = _.find(attr_names, function (a) { return a.name.toLowerCase() == skill_id; });

            if (typeof deets != 'undefined') {
                var attr = findObjs({type: 'attribute', characterid: charObj.id, name: skill_id + '_mod_with_sign'}, {caseInsensitive: true})[0];
                var attr_check = findObjs({type: 'attribute', characterid: charObj.id, name: skill_id + '_mod'}, {caseInsensitive: true})[0];
                if (attr || attr_check) {
                    charObj.skill_id = skill_id;
                    charObj.skill_name = deets.name;
                    charObj.skill_ability = deets.acro;
                    charObj.skill_mod = (attr) ? Number(attr.get('current')) : 0;
                }
            } else {
                if (skills) {
                    charObj.skill_id = skill_id;
                    _.each(skills, function (skill) {
                        if (skill.get('name').endsWith('_name') && !skill.get('name').endsWith('storage_name')) charObj.skill_name = skill.get('current');
                        if (skill.get('name').endsWith('_ability')) charObj.skill_ability = skill.get('current');
                        if (skill.get('name').endsWith('_with_sign')) charObj.skill_mod = parseInt(skill.get('current'));
                    });
                } else {
                    adminDialog('Set Skill Error','A skill or attribute with the ID of "' + skill_id + '" does not exist!');
                }
            }
        } else {
            var opts = [{name: 'Acrobatics', ability: 'DEX', id: 'acrobatics_bonus'},{name: 'Animal Handling', ability: 'WIS', id: 'animal_handling_bonus'},{name: 'Arcana', ability: 'INT', id: 'arcana_bonus'},{name: 'Athletics', ability: 'STR', id: 'athletics_bonus'},{name: 'Deception', ability: 'CHA', id: 'deception_bonus'},{name: 'History', ability: 'INT', id: 'history_bonus'},{name: 'Insight', ability: 'WIS', id: 'insight_bonus'},{name: 'Intimidation', ability: 'CHA', id: 'intimidation_bonus'},{name: 'Investigation', ability: 'INT', id: 'investigation_bonus'},{name: 'Medicine', ability: 'WIS', id: 'medicine_bonus'},{name: 'Nature', ability: 'INT', id: 'nature_bonus'},{name: 'Perception', ability: 'WIS', id: 'perception_bonus'},{name: 'Performance', ability: 'CHA', id: 'performance_bonus'},{name: 'Persuasion', ability: 'CHA', id: 'persuasion_bonus'},{name: 'Religion', ability: 'INT', id: 'religion_bonus'},{name: 'Sleight of Hand', ability: 'DEX', id: 'sleight_of_hand_bonus'},{name: 'Stealth', ability: 'DEX', id: 'stealth_bonus'},{name: 'Survival', ability: 'WIS', id: 'survival_bonus'}, {name: 'Strength', id: 'strength_mod'}, {name: 'Dexterity', id: 'dexterity_mod'}, {name: 'Constitution', id: 'constitution_mod'}, {name: 'Intelligence', id: 'intelligence_mod'}, {name: 'Wisdom', id: 'wisdom_mod'}, {name: 'Charisma', id: 'charisma_mod'}];
            var charAttr = findObjs({type: 'attribute', name: skill_id, characterid: charObj.id}, {caseInsensitive: true})[0];
            if (charAttr) {
                var opt = _.find(opts, function (x) { return x.id == skill_id; });
                charObj.skill_id = skill_id;
                charObj.skill_name = opt.name;
                if (opt.ability) charObj.skill_ability = opt.ability;
                charObj.skill_mod = Number(charAttr.get('current'));
            } else {
                adminDialog('Set Skill Error','A skill or attribute with the ID of "' + skill_id + '" does not exist!');
            }
        }

        return charObj;
    },

    getSkills = function (char_id) {
        var retSkills = '';
        var charAttrs = findObjs({type: 'attribute', characterid: char_id}, {caseInsensitive: true});
        if (state['Versus'].sheet == '5e Shaped') {
            var skills = _.filter(charAttrs, function (attr) {
                return (attr.get('name').match(/^repeating_skill_(.+)_name$/) !== null);
            });
            _.each(skills, function (skill) {
                if (!skill.get('name').endsWith('storage_name')) {
                    var name = skill.get('current');
                    var skill_id = skill.get('name').split('_')[2];
                    var ability = _.find(charAttrs, function (x) { return x.get('name') == 'repeating_skill_' + skill_id + '_ability'; });
                    retSkills += '|' + name + ' (' + ability.get('current') + '),' + skill_id;
                }
            });

            var attrs = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
            _.each(attrs, function (a) { retSkills += '|' + a + ',' + a.toLowerCase(); });
        } else {
            var opts = [{name: 'Acrobatics (DEX)', id: 'acrobatics_bonus'}, {name: 'Animal Handling (WIS)', id: 'animal_handling_bonus'}, {name: 'Arcana (INT)', id: 'arcana_bonus'}, {name: 'Athletics (STR)', id: 'athletics_bonus'}, {name: 'Deception (CHA)', id: 'deception_bonus'}, {name: 'History (INT)', id: 'history_bonus'}, {name: 'Insight (WIS)', id: 'insight_bonus'}, {name: 'Intimidation (CHA)', id: 'intimidation_bonus'}, {name: 'Investigation (INT)', id: 'investigation_bonus'}, {name: 'Medicine (WIS)', id: 'medicine_bonus'}, {name: 'Nature (INT)', id: 'nature_bonus'}, {name: 'Perception (WIS)', id: 'perception_bonus'}, {name: 'Performance (CHA)', id: 'performance_bonus'}, {name: 'Persuasion (CHA)', id: 'persuasion_bonus'}, {name: 'Religion (INT)', id: 'religion_bonus'}, {name: 'Sleight of Hand (DEX)', id: 'sleight_of hand_bonus'}, {name: 'Stealth (DEX)', id: 'stealth_bonus'}, {name: 'Survival (WIS)', id: 'survival_bonus'}, {name: 'Strength', id: 'strength_mod'}, {name: 'Dexterity', id: 'dexterity_mod'}, {name: 'Constitution', id: 'constitution_mod'}, {name: 'Intelligence', id: 'intelligence_mod'}, {name: 'Wisdom', id: 'wisdom_mod'}, {name: 'Charisma', id: 'charisma_mod'}];
            _.each(opts, function (opt) { retSkills += '|' + opt.name + ',' + opt.id; });
        }

        return retSkills;
    },

    headerRows = function (edit = false) {
        // Contest title and top of table without </table> tag
        var message = '',
        c1 = (state['Versus'].contest.contestants && state['Versus'].contest.contestants[0]) ? state['Versus'].contest.contestants[0] : {},
        c2 = (state['Versus'].contest.contestants && state['Versus'].contest.contestants[1]) ? state['Versus'].contest.contestants[1] : {};

        message += '<div style=\'' + styles.buttonWrapper + '\'><span style=\'' + styles.title + '\'>&ldquo;' + state['Versus'].contest.title + '&rdquo;</span>';
        if (edit) message += '<a style=\'' + styles.imgLink + '\' href="!versus setup --title|?{Contest Title}" title="Change Title">✏️</a>';
        message += '</div><table width="100%" style="width: 100%"><tr>';
        message += '<td style="padding-bottom: 10px; text-align: center;"><img width="80px" height="80px" style=\'' + styles.img + '\' src="' + c1.img + '" alt="' + c1.name + '" title="' + c1.name + '"></td>';
        message += '<td style="vertical-align: middle;"><div style=\'' + styles.vs + '\'>vs.<div></td>';
        message += '<td style="padding-bottom: 10px; text-align: center;"><img width="80px" height="80px" style=\'' + styles.img + '\' src="' + c2.img + '" alt="' + c2.name + '" title="' + c2.name + '"></td></tr>';

        return message;
    },

    isNPC = function (char_id) {
        // Returns whether or not a character is an NPC (not controlled by any players)
        var npc = true, char = getObj('character', char_id);
        if (char && char.get('controlledby') != '') npc = false;
        return npc;
    },

    getCut = function (amount, divisor) {
        // Returns a string of amounts in SRD currency demoninations
        var cut = [], rem1, rem2, gp, sp, cp, joiner = ' ';

        gp = parseInt(amount / divisor);
        cut.push(gp + ' gp');
        rem1 = amount % divisor;
        if (rem1 > 0) {
            sp = parseInt((rem1 * 10) / divisor);
            cut.push(sp + ' sp');
            rem2 = (rem1 * 10) % divisor;
            if (rem2 > 0) {
                cp = rem2 * 10;
                cut.push(parseInt(cp / divisor) + ' cp');
            }
        }

        if (cut.length > 1) cut[cut.length-1] = 'and ' + cut[cut.length-1];
		if (cut.length > 2) joiner = ', ';
        return cut.join(joiner);
    },

    commandReset = function (action = '') {
        state['Versus'].contest = {dc: 10, mod: 0, round_limit: 5, break_ties: true, point_cap: 11, points_margin: 1, allow_pool: false, pool_amt: 100};
        if (action != 'hide') adminDialog('Reset Successful', 'The contest parameters have been reset.');
    },

    setupComplete = function () {
        var complete = true;
        if (state['Versus'].contest) {
            if (!state['Versus'].contest.title || state['Versus'].contest.title.trim() == '') complete = false;
            if (!state['Versus'].contest.type || state['Versus'].contest.type.search(/(tandem|opposing|points)/) == -1) complete = false;
            if (!state['Versus'].contest.contestants) complete = false;
            else {
                if (!state['Versus'].contest.contestants[0]) complete = false;
                else {
                    if (!state['Versus'].contest.contestants[0].id || state['Versus'].contest.contestants[0].id == '') complete = false;
                    if (!state['Versus'].contest.contestants[0].name || state['Versus'].contest.contestants[0].name == '') complete = false;
                    if (!state['Versus'].contest.contestants[0].skill_id || state['Versus'].contest.contestants[0].skill_id == '') complete = false;
                    if (typeof state['Versus'].contest.contestants[0].skill_mod == 'undefined') complete = false;
                }
                if (!state['Versus'].contest.contestants[1]) complete = false;
                else {
                    if (!state['Versus'].contest.contestants[1].id || state['Versus'].contest.contestants[1].id == '') complete = false;
                    if (!state['Versus'].contest.contestants[1].name || state['Versus'].contest.contestants[1].name == '') complete = false;
                    if (!state['Versus'].contest.contestants[1].skill_id || state['Versus'].contest.contestants[1].skill_id == '') complete = false;
                    if (typeof state['Versus'].contest.contestants[1].skill_mod == 'undefined') complete = false;
                }
            }
        }
        return complete;
    },

    commandConfig = function (msg) {
        if (typeof state['Versus'].contest.rounds == 'object') {
            adminDialog('Setup Error', 'You cannot change configuration settings while a contest is in progress!');
            return;
        }

        var message = '', parms = msg.split(/\s+/i);
        if (parms[2] && parms[2] == '--rolls') state['Versus'].showRolls = !state['Versus'].showRolls;
        if (parms[2] && parms[2] == '--token-info') state['Versus'].useTokenInfo = !state['Versus'].useTokenInfo;
        if (parms[2] && parms[2] == '--sheet' && parms[3] && (parms[3] == '5e Shaped' || parms[3] == '5th Edition OGL')) state['Versus'].sheet = parms[3];

        if (typeof state['Versus'].sheet == 'undefined' || state['Versus'].sheet == 'Unknown') {
            message += '<p style=\'' + styles.alert + '\'>⚠️ Unknown character sheet!</p>';
            message += '<p>Versus was unable to detect the character sheet for your game. You must be using either the 5e Shaped Sheet or the 5th Edition OGL Sheet. Set the character sheet before you can continue using the script.</p><br>';
            message += 'See the <a style=\'' + styles.textButton + '\' href="https://github.com/blawson69/Versus" target="_blank">documentation</a> for more details.'
            + '<div style=\'' + styles.buttonWrapper + '\'><a style=\'' + styles.button + '\' href="!versus config --sheet ?{Choose Sheet|5e Shaped|5th Edition OGL}">SET SHEET</a></div>';
            adminDialog('Config Warning', message);
        } else {
            message += '<b>Token Info Default:</b><br>';
            if (state['Versus'].useTokenInfo) {
                message += 'You are currently set to use the image and name from the character\'s token and not the avatar/name from the character sheet. <a style=\'' + styles.textButton + '\' href="!versus config --token-info">change</a><br><br>';
            } else {
                message += 'You are currently set to use the character\'s avatar and name instead of the image/name from the character\'s token. <a style=\'' + styles.textButton + '\' href="!versus config --token-info">change</a><br><br>';
            }

            message += '<b>Show Rolls Default:</b><br>';
            if (state['Versus'].showRolls) {
                message += 'You are currently set to show the die roll results when the mouse cursor is placed over the results. <a style=\'' + styles.textButton + '\' href="!versus config --rolls">change</a><br><br>';
            } else {
                message += 'You are currently set to hide the die rolls from the players. <a style=\'' + styles.textButton + '\' href="!versus config --rolls">change</a><br><br>';
            }

            message += 'See the <a style=\'' + styles.textButton + '\' href="https://github.com/blawson69/Versus">documentation</a> for complete instructions.<br><br>';
            message += '<div style=\'' + styles.buttonWrapper + '\'><a style=\'' + styles.button + '\' href="!versus --help">Help Menu</a></div>';
            adminDialog('Config Menu', message);
        }
    },

    commandHelp = function (msg) {
        var message = 'To start configuration on a contest, you must send the following (all on one line):<br><br>';
        message += '<div style=\'' + styles.code + '\'>!versus setup --1|&lt;token1_ID&gt; --2|&lt;token2_ID&gt; --title|&lt;contest_title&gt;</div><br>';
        message += '<b style=\'' + styles.code + '\'>&lt;token1_ID&gt;:</b><br>The ID of the token representing the 1st contestant character.<br><br>';
        message += '<b style=\'' + styles.code + '\'>&lt;token2_ID&gt;:</b><br>The ID of the token representing the 2nd contestant character.<br><br>';
        message += '<b style=\'' + styles.code + '\'>&lt;contest_title&gt;:</b><br>The name of the contest.<br><br>';
        message += 'See the <a style=\'' + styles.textButton + '\' href="https://github.com/blawson69/Versus">documentation</a> for complete instructions.<br><br>';
        message += '<div style=\'' + styles.buttonWrapper + '\'><a style=\'' + styles.button + '\' href="!versus config">Config Menu</a></div>';

        adminDialog('Help Menu', message);
    },

    showDialog = function (title, content, character = '', whisperTo = '') {
        var gm = /\(GM\)/i;
        title = (title == '') ? '' : '<div style=\'' + styles.header + '\'>' + title + '</div>';
        character = (character == '') ? '' : '<div style=\'' + styles.subtitle + '\'>' + character + '</div>';
        var body = '<div style=\'' + styles.box + '\'>' + title + character + '<div>' + content + '</div></div>';
        if (whisperTo.length > 0) whisperTo = '/w ' + (gm.test(whisperTo) ? 'GM' : '"' + whisperTo + '"') + ' ';
        sendChat('Versus', whisperTo + body);
    },

	adminDialog = function (title, content) {
        title = (title == '') ? '' : '<div style=\'' + styles.header + '\'>' + title + '</div>';
        var body = '<div style=\'' + styles.box + '\'>' + title + '<div>' + content + '</div></div>';
        sendChat('Versus','/w GM ' + body, null, {noarchive:true});
	},

    usePurseStrings = function () {
        var use = false;
        if (typeof PurseStrings !== 'undefined' && typeof PurseStrings.changePurse !== 'undefined') use = true;
        return use;
    },

    detectSheet = function () {
        var sheet = 'Unknown', char = findObjs({type: 'character'})[0];
        if (char) {
            var charAttrs = findObjs({type: 'attribute', characterid: char.get('id')}, {caseInsensitive: true});
            if (_.find(charAttrs, function (x) { return x.get('name') == 'character_sheet' && x.get('current').search('Shaped') != -1; })) sheet = '5e Shaped';
            if (_.find(charAttrs, function (x) { return x.get('name').search('mancer') != -1; })) sheet = '5th Edition OGL';
        }
        return sheet;
    },

    isNum = function (txt) {
        // Returns whether or not a string is actually a Number
        var nr = /^\d+$/;
        return nr.test(txt);
    },

    //---- PUBLIC FUNCTIONS ----//

    registerEventHandlers = function () {
		on('chat:message', handleInput);
	};

    return {
		checkInstall: checkInstall,
		registerEventHandlers: registerEventHandlers
	};
}());

on("ready", function () {
    Versus.checkInstall();
    Versus.registerEventHandlers();
});
