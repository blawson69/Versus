/*
Versus
A Roll20 script to show a "death match" style dialog for attribute and skill contests for the 5e Shaped Sheet.

On Github:	https://github.com/blawson69
Contact me: https://app.roll20.net/users/1781274/ben-l
Like this script? Buy me a coffee: https://venmo.com/theRealBenLawson
*/

var Versus = Versus || (function () {
    'use strict';

    //---- INFO ----//

    var version = '0.1',
    debugMode = false,
    styles = {
        box:  'background-color: #fff; border: 1px solid #000; padding: 8px 10px; border-radius: 6px; margin-left: -40px; margin-right: 0px;',
        button: 'background-color: #000; border-width: 0px; border-radius: 5px; padding: 5px 8px; color: #fff; text-align: center;',
        textButton: 'background-color: transparent; border: none; padding: 0; color: #591209; text-decoration: underline;',
        buttonWrapper: 'text-align: center; margin: 10px 0; clear: both;',
        textWrapper: 'margin: 10px 0; clear: both;',
        title: 'padding: 12px 0; color: ##591209; font-size: 1.5em; font-weight: bold; font-variant: small-caps; font-family: "Times New Roman",Times,serif;',
        vs: 'text-align: center; color: ##591209; font-size: 2em; font-weight: bold; font-variant: small-caps; font-family: "Times New Roman",Times,serif;',
        code: 'font-family: "Courier New", Courier, monospace; background-color: #ddd; color: #000; padding: 2px 4px;',
        alert: 'color: #C91010; font-size: 1.5em; font-weight: bold; font-variant: small-caps; text-align: center;',
        imgLink: 'background-color: transparent; border: none; padding: 0; text-decoration: none;',
        img: 'width: 70px; height: 70px;',
        result_on: 'font-size: 1.5em; font-weight: bold; white-space: nowrap; text-align: center; cursor: pointer;',
        result_off: 'font-size: 1.5em; font-weight: bold; white-space: nowrap; text-align: center;',
        accent: 'background-color: ##eaeaea;'
    },

    checkInstall = function () {
        if (!_.has(state, 'Versus')) state['Versus'] = state['Versus'] || {};
        if (typeof state['Versus'].contest == 'undefined') state['Versus'].contest = {dc: 10, mod: 0, round_limit: 5};
        if (typeof state['Versus'].useTokenInfo == 'undefined') state['Versus'].useTokenInfo = false;
        if (typeof state['Versus'].showRolls == 'undefined') state['Versus'].showRolls = true;
        log('--> Versus v' + version + ' <-- Initialized. Get ready to rumble!');
		if (debugMode) {
			var d = new Date();
			sendChat('Debug Mode', 'Versus v' + version + ' loaded at ' + d.toLocaleTimeString(), null, {noarchive:true});
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
					case 'go':
						if (playerIsGM(msg.playerid)) commandGo();
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
		// Displays a contest setup dialog for the two contestants - Step 1
        if (state['Versus'].contest.rounds) {
            showShapedAdminDialog('Setup Error','You cannot modify contest settings while a contest is in progress!');
            return;
        }

		var parms = msg.split(/\s*\-\-/i),
        c1 = (state['Versus'].contest.contestants && state['Versus'].contest.contestants[0]) ? state['Versus'].contest.contestants[0] : {},
        c2 = (state['Versus'].contest.contestants && state['Versus'].contest.contestants[1]) ? state['Versus'].contest.contestants[1] : {};

        _.each(parms, function (x) {
            var parts = x.split(/\s*\|\s*/i);
            if (parts[0] == 'title' && parts[1] != '') state['Versus'].contest.title = parts[1].trim();
            if (parts[0] == 'c1' && parts[1] != '') c1.token_id = parts[1].trim();
            if (parts[0] == 'c2' && parts[1] != '') c2.token_id = parts[1].trim();
            if (parts[0] == 's1' && parts[1] != '') c1 = setSkill(c1, parts[1].trim());
            if (parts[0] == 's2' && parts[1] != '') c2 = setSkill(c2, parts[1].trim());
            if (parts[0] == 'type' && parts[1] != '' && (parts[1].trim() == 'tandem' || parts[1].trim() == 'opposing')) state['Versus'].contest.type = parts[1].trim();
            if (parts[0] == 'rl' && parts[1] != '' && !isNaN(parts[1])) state['Versus'].contest.round_limit = parseInt(parts[1]);
            if (parts[0] == 'dc' && parts[1] != '' && !isNaN(parts[1])) state['Versus'].contest.dc = parseInt(parts[1]);
            if (parts[0] == 'm' && parts[1] != '' && !isNaN(parts[1])) state['Versus'].contest.mod = Math.abs(parts[1]);
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
                    c2.img = state['Versus'].useTokenInfo ? token2.get('imgsrc') : contestant2.get('avatar');
                    c1.name = state['Versus'].useTokenInfo ? token1.get('name') : contestant1.get('name');
                    c2.name = state['Versus'].useTokenInfo ? token2.get('name') : contestant2.get('name');

                    if (!state['Versus'].contest.contestants) {
                        state['Versus'].contest.contestants = [];
                        state['Versus'].contest.contestants.push(c1);
                        state['Versus'].contest.contestants.push(c2);
                    } else {
                        if (c1.skill_id) state['Versus'].contest.contestants[0] = c1;
                        if (c2.skill_id) state['Versus'].contest.contestants[1] = c2;
                    }

                    var message = '<div style="' + styles.buttonWrapper + 'margin: 0;"><span style="' + styles.title + '">&quot;' + state['Versus'].contest.title + '&quot;</span>';
                    message += '<a style="' + styles.imgLink + '" href="!versus setup --title|?{Contest Title}" title="Change Title">✏️</a></div>';
                    message += '<table width="100%"><tr>';
                    message += '<td style="width: 70px; padding-bottom: 10px;"><img width="70px" height="70px" style="' + styles.img + '" src="' + c1.img + '" alt="' + c1.name + '" title="' + c1.name + '"></td>';
                    message += '<td style="vertical-align: middle;"><div style="' + styles.vs + '">vs.<div></td>';
                    message += '<td style="width: 70px; padding-bottom: 10px;"><img width="70px" height="70px" style="' + styles.img + '" src="' + c2.img + '" alt="' + c2.name + '" title="' + c2.name + '"></td>';
                    message += '</tr></table>';

                    //message += '<div style="' + styles.buttonWrapper + '"><span style="' + styles.title + '">' + state['Versus'].contest.title + '</span>&nbsp;';

                    message += '<hr><div style="' + styles.textWrapper + '"><b>Contestant 1:</b><br>';
                    if (!c1.skill_id) {
                        message += c1.name + ' <a style="' + styles.textButton + '" href="!versus setup --s1|?{Skill' + getSkills(c1.id) + '}">Choose Skill</a></div>';
                    } else {
                        message += c1.name + ' using&nbsp;<b>' + c1.skill_name + ' (' + c1.skill_ability + ')</b> <a style="' + styles.imgLink + '" href="!versus setup --s1|?{Skill' + getSkills(c1.id) + '}" title="Change Skill">✏️</a></div>';
                    }

                    message += '<div style="' + styles.textWrapper + '"><b>Contestant 2:</b><br>';
                    if (!c2.skill_id) {
                        message += c2.name + ' <a style="' + styles.textButton + '" href="!versus setup --s2|?{Skill' + getSkills(c2.id) + '}">Choose Skill</a></div>';
                    } else {
                        message += c2.name + ' using&nbsp;<b>' + c2.skill_name + ' (' + c2.skill_ability + ')</b> <a style="' + styles.imgLink + '" href="!versus setup --s2|?{Skill' + getSkills(c2.id) + '}" title="Change Skill">✏️</a></div>';
                    }

                    message += '<hr><div style="' + styles.textWrapper + '"><b>Contest Parameters</b><br>';
                    if (!state['Versus'].contest.type) {
                        message += 'Set contest type: <a style="' + styles.textButton + '" href="!versus setup --type|tandem">tandem</a> | <a style="' + styles.textButton + '" href="!versus setup --type|opposing">opposing</a>';
                    } else {
                        message += '<b>Contest type:</b> ' + state['Versus'].contest.type + ' ';
                        if (state['Versus'].contest.type == 'tandem') message += '<a style="' + styles.imgLink + '" href="!versus setup --type|opposing" title="Switch to Opposing">✏️</a>';
                        else message += '<a style="' + styles.imgLink + '" href="!versus setup --type|tandem" title="Switch to Tandem">✏️</a>';

                        if (state['Versus'].contest.type == 'tandem') {
                            // set threshold and modifier
                            message += '<br><b>Threshold:</b> ' + state['Versus'].contest.dc + ' <a style="' + styles.imgLink + '" href="!versus setup --dc|?{Threshold}" title="Change Threshold">✏️</a>';
                            message += '<br><b>Modifier:</b> ' + state['Versus'].contest.mod + ' <a style="' + styles.imgLink + '" href="!versus setup --m|?{Modifier}" title="Change Modifier">✏️</a>';
                        } else {
                            // set round limit
                            message += '<br><b>Round Limit:</b> ' + state['Versus'].contest.round_limit + ' <a style="' + styles.imgLink + '" href="!versus setup --rl|?{Round Limit}" title="Change Round Limit">✏️</a>';
                        }
                    }
                    message += '</div>';

                    if (setupComplete()) {
                        message += '<br><div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!versus go">Begin Contest!</a></div>';
                    }

                    showShapedAdminDialog('', message);
                } else {
                    showShapedAdminDialog('Setup Error','One or more invalid character IDs.');
                }
            } else {
                showShapedAdminDialog('Setup Error','One or more invalid token IDs.');
            }
        } else {
            showShapedAdminDialog('Setup Error','Missing parameters. Try again.');
        }
	},

    commandGo = function () {
        // Displays the contest progress to all players
        if (!setupComplete()) {
            showShapedAdminDialog('Contest Error','You cannot start a contest without completing setup!<div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!versus setup">Go to Setup</a></div>');
            return;
        }

        var round = {}, last_round, message = '', c1_winner = false, c2_winner = false,
        c1 = state['Versus'].contest.contestants[0], c2 = state['Versus'].contest.contestants[1];

        message += '<div style="' + styles.buttonWrapper + 'margin: 0;"><span style="' + styles.title + '">&quot;' + state['Versus'].contest.title + '&quot;</span></div>';
        message += '<table width="100%" style="width: 100%"><tr>';
        message += '<td style="padding-bottom: 10px; text-align: center;"><img width="70px" height="70px" style="' + styles.img + '" src="' + c1.img + '" alt="' + c1.name + '" title="' + c1.name + '"></td>';
        message += '<td style="vertical-align: middle;"><div style="' + styles.vs + '">vs.<div></td>';
        message += '<td style="padding-bottom: 10px; text-align: center;"><img width="70px" height="70px" style="' + styles.img + '" src="' + c2.img + '" alt="' + c2.name + '" title="' + c2.name + '"></td></tr>';

        if (!state['Versus'].contest.rounds) {
            state['Versus'].contest.rounds = [];
            round.num = 1;
        } else {
            if (state['Versus'].contest.type == 'opposing') {
                _.each(state['Versus'].contest.rounds, function (rnd) {
                    message += '<tr><td style="text-align: center;">' + rnd.c1_result + '</td><td style="text-align: center; white-space: nowrap;">Round ' + rnd.num + '</td><td style="text-align: center;">' + rnd.c2_result + '</td></tr>';
                });
            }
            last_round = _.last(state['Versus'].contest.rounds);
            round.num = last_round.num + 1;
        }

        var c1_roll_result = randomInteger(20), c2_roll_result = randomInteger(20);
        var c1_roll_total = c1_roll_result + c1.skill_mod, c2_roll_total = c2_roll_result + c2.skill_mod;
        var c1_roll = state['Versus'].showRolls ? ' title="[1d20] + ' + c1.skill_mod + ' = [' + c1_roll_result + '] + ' +c1.skill_mod + ' = ' + c1_roll_total + '"' : '',
        c2_roll = state['Versus'].showRolls ? ' title="[1d20] + ' + c2.skill_mod + ' = [' + c2_roll_result + '] + ' +c2.skill_mod + ' = ' + c2_roll_total + '"' : '';

        if (state['Versus'].contest.type == 'opposing') {
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
                round.c1_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + 'color: #c00;"' + c1_roll + '>Tie</b>';
                round.c2_result = '<b style="' + (state['Versus'].showRolls ? 'cursor: pointer;' : '') + 'color: #c00;"' + c2_roll + '>Tie</b>';
            }
            message += '<tr><td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + '">' + round.c1_result + '</td>';
            message += '<td style="' + styles.result_off + ' white-space: nowrap;">Round ' + round.num + '</td>';
            message += '<td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + '">' + round.c2_result + '</td></tr>';

            if (round.num == state['Versus'].contest.round_limit) {
                if (c1_wins == c2_wins) {
                    state['Versus'].contest.winner = '🏆 It\'s a Tie 🏆';
                } else {
                    if (c1_wins > c2_wins) state['Versus'].contest.winner = '🏆 ' + c1.name;
                    else state['Versus'].contest.winner = '🏆 ' + c2.name;
                }
            }
        } else { // tandem rolls
            message += '<tr>';
            if (c1_roll_total < Math.floor(state['Versus'].contest.dc)) {
                message += '<td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + 'width: 70px;"><span' + c1_roll + '>👎</span></td>';
                c2_winner = true;
            } else {
                message += '<td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + 'width: 70px;"><span' + c1_roll + '>👍</span></td>';
            }
            message += '<td style="' + styles.result_off + 'white-space: nowrap;">Round ' + round.num + '</td>';
            if (c2_roll_total < Math.floor(state['Versus'].contest.dc)) {
                message += '<td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + 'width: 70px;"><span' + c2_roll + '>👎</span></td>';
                c1_winner = true;
            } else {
                message += '<td style="' + (state['Versus'].showRolls ? styles.result_on : styles.result_off) + 'width: 70px;"><span' + c2_roll + '>👍</span></td>';
            }
            message += '</tr>';

            if (c1_winner && c2_winner) {
                // tie
                state['Versus'].contest.winner = 'No Winner';
            } else {
                if (c1_winner) state['Versus'].contest.winner = '🏆 ' + c1.name;
                if (c2_winner) state['Versus'].contest.winner = '🏆 ' + c2.name;
            }

            state['Versus'].contest.dc = state['Versus'].contest.dc + state['Versus'].contest.mod;
        }

        message += '</table>';

        if (state['Versus'].contest.winner && state['Versus'].contest.winner != '') {
            message += '<br><div style="' + styles.buttonWrapper + '"><b>And the winner is...</b><br><span style="' + styles.title + '">' + state['Versus'].contest.winner + '</span></div>';
        } else {
            state['Versus'].contest.rounds.push(round);
        }

        showShapedDialog('', message);

        if (!state['Versus'].contest.winner) {
            showShapedAdminDialog('', '<div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!versus go">Next Round!</a></div>');
        } else {
            showShapedAdminDialog('', '<div style="' + styles.buttonWrapper + '">&laquo; Contest complete. &raquo;</div>');
            commandReset('hide');
        }
    },

    setSkill = function (charObj, skill_id) {
        var re = new RegExp('^repeating_skill_' + skill_id + '_.+$', 'i');
        var attr_names = [{acro: 'STR', name: 'Strength'},{acro: 'DEX', name: 'Dexterity'},{acro: 'CON', name: 'Constitution'},{acro: 'INT', name: 'Intelligence'},{acro: 'WIS', name: 'Wisdom'},{acro: 'CHA', name: 'Charisma'}];

        var charAttrs = findObjs({type: 'attribute', characterid: charObj.id}, {caseInsensitive: true});
        var skills = _.filter(charAttrs, function (attr) { return (attr.get('name').match(re) !== null); });
        var deets = _.find(attr_names, function (a) { return a.name.toLowerCase() == skill_id; });

        if (typeof deets != 'undefined') {
            var attr = findObjs({type: 'attribute', characterid: charObj.id, name: skill_id + '_mod_with_sign'}, {caseInsensitive: true})[0];
            if (attr) {
                charObj.skill_id = skill_id;
                charObj.skill_name = deets.name;
                charObj.skill_ability = deets.acro;
                charObj.skill_mod = Number(attr.get('current'));
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
                showShapedAdminDialog('Set Skill Error','A skill or attribute with that ID does not exist!');
            }
        }

        return charObj;
    },

    getSkills = function (char_id) {
        var retSkills = '';
        var charAttrs = findObjs({type: 'attribute', characterid: char_id}, {caseInsensitive: true});
        if (charAttrs) {
            var skills = _.filter(charAttrs, function (attr) {
                return (attr.get('name').match(/^repeating_skill_(.+)_name$/) !== null);
            });
            _.each(skills, function (skill) {
                if (!skill.get('name').endsWith('storage_name')) {
                    var name = skill.get('current');
                    var skill_id = skill.get('name').split('_')[2];
                    retSkills += '|' + name + ',' + skill_id;
                }
            });
        }
        var attrs = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
        _.each(attrs, function (a) { retSkills += '|' + a + ',' + a.toLowerCase(); });

        return retSkills;
    },

    commandReset = function (action = '') {
        state['Versus'].contest = {dc: 10, mod: 0, round_limit: 5};
        if (action != 'hide') showShapedAdminDialog('Reset Successful','The contest parameters have been reset.');
    },

    setupComplete = function () {
        var complete = true;
        if (state['Versus'].contest) {
            if (!state['Versus'].contest.title || state['Versus'].contest.title.trim() == '') complete = false;
            if (!state['Versus'].contest.type || (state['Versus'].contest.type != 'tandem' && state['Versus'].contest.type != 'opposing')) complete = false;
            if (!state['Versus'].contest.contestants) complete = false;
            else {
                if (!state['Versus'].contest.contestants[0]) complete = false;
                else {
                    if (!state['Versus'].contest.contestants[0].id || state['Versus'].contest.contestants[0].id == '') complete = false;
                    if (!state['Versus'].contest.contestants[0].name || state['Versus'].contest.contestants[0].name == '') complete = false;
                    if (!state['Versus'].contest.contestants[0].skill_id || state['Versus'].contest.contestants[0].skill_id == '') complete = false;
                    if (!state['Versus'].contest.contestants[0].skill_mod) complete = false;
                }
                if (!state['Versus'].contest.contestants[1]) complete = false;
                else {
                    if (!state['Versus'].contest.contestants[1].id || state['Versus'].contest.contestants[1].id == '') complete = false;
                    if (!state['Versus'].contest.contestants[1].name || state['Versus'].contest.contestants[1].name == '') complete = false;
                    if (!state['Versus'].contest.contestants[1].skill_id || state['Versus'].contest.contestants[1].skill_id == '') complete = false;
                    if (!state['Versus'].contest.contestants[1].skill_mod) complete = false;
                }
            }
        }
        return complete;
    },

    commandConfig = function (msg) {
        if (typeof state['Versus'].contest.rounds == 'object') {
            showShapedAdminDialog('Setup Error','You cannot change configuration settings while a contest is in progress!');
            return;
        }

        var parms = msg.split(/\s+/i);
        if (parms[2] && parms[2] == '--rolls') state['Versus'].showRolls = !state['Versus'].showRolls;
        if (parms[2] && parms[2] == '--token-info') state['Versus'].useTokenInfo = !state['Versus'].useTokenInfo;

        var message = '<b>Token Info Default:</b><br>';
        if (state['Versus'].useTokenInfo) {
            message += 'You are currently set to use the image and name from the character\'s token and not the avatar/name from the character sheet. <a style="' + styles.textButton + '" href="!versus config --token-info">change</a><br><br>';
        } else {
            message += 'You are currently set to use the character\'s avatar and name instead of the image/name from the character\'s token. <a style="' + styles.textButton + '" href="!versus config --token-info">change</a><br><br>';
        }
        message += '<b>Show Rolls Default:</b><br>';
        if (state['Versus'].showRolls) {
            message += 'You are currently set to show the die roll results when the mouse cursor is placed over the results. <a style="' + styles.textButton + '" href="!versus config --rolls">change</a><br><br>';
        } else {
            message += 'You are currently set to hide the die rolls from the players. <a style="' + styles.textButton + '" href="!versus config --rolls">change</a><br><br>';
        }
        message += 'See the <a style="' + styles.textButton + '" href="https://github.com/blawson69/Versus">documentation</a> for complete instructions.<br><br>';
        message += '<div style=\'' + styles.buttonWrapper + '\'><a style="' + styles.button + '" href="!loot --help">Help Menu</a></div>';

        showShapedAdminDialog('Config Menu', message);
    },

    commandHelp = function (msg) {
        var message = 'To start configuration on a contest, you must send the following (all on one line):<br><br>';
        message += '<div style=\'' + styles.code + '\'>!versus setup --1|&lt;token1_ID&gt; --2|&lt;token2_ID&gt; --title|&lt;contest_title&gt;</div><br>';
        message += '<b style=\'' + styles.code + '\'>&lt;token1_ID&gt;:</b><br>The ID of the token representing the 1st contestant character.<br><br>';
        message += '<b style=\'' + styles.code + '\'>&lt;token2_ID&gt;:</b><br>The ID of the token representing the 2nd contestant character.<br><br>';
        message += '<b style=\'' + styles.code + '\'>&lt;contest_title&gt;:</b><br>The name of the contest.<br><br>';
        message += 'See the <a style="' + styles.textButton + '" href="https://github.com/blawson69/Versus">documentation</a> for complete instructions.<br><br>';
        message += '<div style="' + styles.buttonWrapper + '"><a style="' + styles.button + '" href="!versus config">Config Menu</a></div>';

        showShapedAdminDialog('Help Menu', message);
    },

    showDialog = function (title, content, whisperTo = '') {
        // Outputs a pretty box in chat with a title and content
        var gm = /\(GM\)/i;
        title = (title == '') ? '' : '<div style=\'' + styles.title + '\'>' + title + '</div>';
        var body = '<div style=\'' + styles.box + '\'>' + title + '<div>' + content + '</div></div>';
        if (whisperTo.length > 0) {
            whisperTo = '/w ' + (gm.test(whisperTo) ? 'GM' : '"' + whisperTo + '"') + ' ';
            sendChat('Versus', whisperTo + body, null, {noarchive:true});
        } else  {
            sendChat('Versus', body);
        }
    },

    showShapedDialog = function (title, content, character = '', silent = false) {
		// Outputs a 5e Shaped dialog box to players/characters
        var prefix = '', char_name = '';
        if (silent && character.length != 0) prefix = '/w "' + character + '" ';
        if (character.length != 0) char_name = ' {{show_character_name=1}} {{character_name=' + character + '}}';
        var message = prefix + '&{template:5e-shaped} {{title=' + title + '}} {{text_big=' + content + '}}' + char_name;
        sendChat('Versus', message, null, {noarchive:true});
	},

    showShapedAdminDialog = function (title, content, character = '') {
		// Whispers a 5e Shaped dialog box to the GM
        if (character != '') character = ' {{show_character_name=1}} {{character_name=' + character + '}}';
        var message = '/w GM &{template:5e-shaped} {{title=' + title + '}} {{text_big=' + content + '}}' + character;
        sendChat('Versus', message, null, {noarchive:true});
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
