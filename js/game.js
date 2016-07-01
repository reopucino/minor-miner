// MAIN GAME ENTRY POINT //
var MinerGame = MinerGame || {};

// game def
MinerGame.game = new Phaser.Game(640, 480, Phaser.AUTO, '', null, false, false);

// game states
MinerGame.game.state.add('boot', MinerGame.bootState);
MinerGame.game.state.add('preload', MinerGame.preloadState);
MinerGame.game.state.add('menu', MinerGame.menuState);
MinerGame.game.state.add('play', MinerGame.playState);

// run game
MinerGame.game.state.start('boot');
