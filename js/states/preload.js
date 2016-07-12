var MinerGame = MinerGame || {};

// PRELOAD STATE //
MinerGame.preloadState = function(){};

MinerGame.preloadState.prototype = {
  preload: function() {
    // show loading text
    var loadingText = this.game.add.bitmapText(this.game.world.centerX, this.game.world.centerY - 64, 'carrier_command', 'LOADING', 14);
    loadingText.anchor.setTo(0.5, 0.5);
    // show loading bar
    this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'load-bar');
    this.preloadBar.anchor.setTo(0.5);
    this.load.setPreloadSprite(this.preloadBar);

    // load tilemaps
    this.load.tilemap('menu', 'assets/tilemaps/menu.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('1', 'assets/tilemaps/1.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('2', 'assets/tilemaps/2.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('3', 'assets/tilemaps/3.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('4', 'assets/tilemaps/4.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('5', 'assets/tilemaps/5.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('6', 'assets/tilemaps/6.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.tilemap('7', 'assets/tilemaps/7.json', null, Phaser.Tilemap.TILED_JSON);

    // load tiles/sprites/images
    this.load.image('tiles', 'assets/img/tiles.png');
    this.load.spritesheet('player', 'assets/img/player.png', 16, 16, 16);
    this.load.spritesheet('dust', 'assets/img/dust.png', 8, 8);
    this.load.image('particle', 'assets/img/particle.png');
    this.load.spritesheet('player-warp', 'assets/img/player-warp.png', 24, 24);
    this.load.image('item-gun', 'assets/img/item-gun.png');
    this.load.spritesheet('portal', 'assets/img/portal.png', 16, 16);
    this.load.spritesheet('secret', 'assets/img/secret.png', 16, 16);
    this.load.image('secret-particle', 'assets/img/secret-particle.png');
    this.load.spritesheet('block-dust', 'assets/img/block-dust.png', 16, 16);

    // load audio assets
    this.load.audio('intro', 'assets/audio/intro.mp3');
    this.load.audio('start_game', 'assets/audio/start_game.wav');
    this.load.audio('field1', 'assets/audio/field1.mp3');
    this.load.audio('jump', 'assets/audio/jump.wav');
    this.load.audio('player_die', 'assets/audio/player_die.wav');
    this.load.audio('secret', 'assets/audio/secret.wav');
    this.load.audio('footstep', 'assets/audio/footstep.wav');
    this.load.audio('dust', 'assets/audio/dust.wav');
  },
  create: function() {
    this.state.start('menu');
  }
};
