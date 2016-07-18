var MinerGame = MinerGame || {};

// MAIN MENU STATE //
MinerGame.menuState = function(){};

MinerGame.menuState.prototype = {
  create: function() {
    // play music
    var music = this.game.add.audio('intro');
    music.loopFull(0.8);

    // create background
    this.map = this.game.add.tilemap('menu');
    this.map.addTilesetImage('lavaTiles', 'tiles');
    this.map.createLayer('lavaLayer').resizeWorld();

    // create lava splasher and effects
    var lavaParticles = this.game.add.emitter(this.game.world.centerX, this.game.height, 400);
    lavaParticles.width = this.game.world.width;
    lavaParticles.makeParticles('particle');
    lavaParticles.minParticleScale = 0.1;
    lavaParticles.maxParticleScale = 0.5;
    lavaParticles.setYSpeed(-200, -125);
    lavaParticles.gravity = 0;
    lavaParticles.setXSpeed(-5, 5);
    lavaParticles.minRotation = 0;
    lavaParticles.maxRotation = 0;
    lavaParticles.start(false, 2200, 5, 0);

    this.lavaSplash = this.game.add.emitter(0, 0, 200);
    this.lavaSplash.y = this.game.height - 28;
    this.lavaSplash.makeParticles('particle');
    this.lavaSplash.minRotation = 0;
    this.lavaSplash.maxRotation = 0;
    this.lavaSplash.minParticleScale = 0.3;
    this.lavaSplash.maxParticleScale = 1.5;
    this.lavaSplash.setYSpeed(-280, -150);
    this.lavaSplash.gravity = 500;


    // create logo
    var titleText = this.game.add.bitmapText(this.game.world.centerX, this.game.world.centerY, 'carrier_command', 'MINOR MINER', 32);
    titleText.anchor.setTo(0.5, 0.5);

    // create menu text
    var startText = this.game.add.bitmapText(this.game.world.centerX, this.game.height - 150, 'carrier_command', 'PRESS \'X\' TO START', 12);
    startText.anchor.setTo(0.5, 0.5);

    // start button
    var startKey = this.game.input.keyboard.addKey(Phaser.Keyboard.X);
    startKey.onDown.add(function() {
      music.stop();
      var startSound = this.add.audio('start_game');
      startSound.volume -= .6;
      startSound.play();
      // menu text fade in and out for 1.5 sec
      var startTween = this.game.add.tween(startText).to({ alpha: 0 }, 100, "Linear", true, 0, -1, true);
      // after 1.5 sec, transition to next state
      this.game.time.events.add(700, function() {
        MinerGame.level = '1';
        MinerGame.startTime = this.game.time.totalElapsedSeconds();
        this.game.state.start('play');
      }, this);
    }, this);
  },
  update: function() {
    if (Math.random() > 0.97 && !this.lavaSplash.on) {
      this.lavaSplash.x = Math.floor(Math.random() * this.game.width);
      this.lavaSplash.start(false, 5000, 20);
      this.game.time.events.add(700, function() {
        this.lavaSplash.on = false;
      }, this);
    }
  }
}
