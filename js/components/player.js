var MinerGame = MinerGame || {};

// PLAYER CLASS //
MinerGame.Player = function(game, x, y) {
  Phaser.Sprite.call(this, game, x, y, 'player');
  this.game = game;
  this.alive = true;
  this.game.layers.player.add(this); // rendering layer
  this.anchor.setTo(0.5);

  // sounds
  this.jumpSound = this.game.add.audio('jump');
  this.jumpSound.volume -= .6;
  this.footstepSound = this.game.add.audio('footstep');
  this.footstepSound.volume -= .55;
  this.dustSound = this.game.add.audio('dust');
  this.dustSound.volume -= .4;
  this.drillSound = this.game.add.audio('drill');
  this.drillSound.volume -= .7;

  // secrets and upgrades
  this.secrets = 0;

  // animations
  this.animations.add('run-left', [9,10,11,10]);
  this.animations.add('run-right', [0,1,2,1]);
  this.facing = 'right';

  // dust effects
  this.dustGroup = this.game.add.group();
  this.game.layers.effects.add(this.dustGroup); // rendering layer
  this.dustTimer = 0;
  for (var i = 0; i < 50; i++) {
    var dust = this.game.add.sprite(0, 0, 'dust');
    this.game.physics.arcade.enable(dust);
    dust.animations.add('float');
    dust.anchor.setTo(0.5, 1);
    dust.checkWorldBounds = true;
    dust.outOfBoundsKill = true;
    dust.exists = false;
    this.dustGroup.add(dust);
  }
  var player = this;
  this.dropDust = function(repeated, x, y) {
    var dust = player.dustGroup.getFirstExists(false);
    var dustX = x || player.x;
    var dustY = y || player.y;
    dust.reset(player.x, player.bottom);
    if (!this.dustSound.isPlaying || repeated) {
      this.dustSound.play();
    }
    dust.animations.play('float', 10, false, true);
    dust.body.velocity.y = -10;
  };

  // physics
  this.game.physics.arcade.enable(this);
  this.body.collideWorldBounds = true;
  this.body.setSize(8, 12, 4, 4);
  this.body.gravity.y = 350;
  this.jumpSpeed = -200;
  this.hSpeed = 190;
  this.body.maxVelocity.x = this.hSpeed;
  this.maxFallSpeed = 500;
  this.body.maxVelocity.y = this.maxFallSpeed;
  this.accelConst = 1800;
  this.body.acceleration.x = 0;
  this.dragConst = 2000;
  this.body.drag.x = this.dragConst;
  this.wallCheck = false; // for custom wall check
  this.wasOnGround = true; // for custom ground check
  this.groundDelay = 80; // player can jump up to 40 ms after leaving ground
  this.wallBreakTime = 20; // how long player moves away from wall before they "unstick"
  this.wallBreakClock = 0;

  // move player with cursor keys, jump with x
  this.cursors = this.game.input.keyboard.createCursorKeys();
  this.jumpBtn = this.game.input.keyboard.addKey(Phaser.Keyboard.X);
  this.drillBtn = this.game.input.keyboard.addKey(Phaser.Keyboard.Z);

  // jump button handler
  this.jumpBtn.onDown.add(function() {
    // if player is dead, or if player has already jumped, return
    if (!this.body || this.spawning) {
      return;
    }

    // reset maxVelocity.x
    this.body.maxVelocity.x = this.hSpeed;
    this.drill.kill();

    // if on the wall (not edges of game)
    if (this.body.onWall() && !this.body.onFloor() &&
        this.left > 0 && this.right < this.game.width) {
      this.wasOnGround = false;
      this.jumpSound.play();
      this.body.maxVelocity.y = this.maxFallSpeed;
      this.body.velocity.y = this.jumpSpeed;
      // jump away from wall
      if (this.facing === 'left') {
        this.body.velocity.x = this.body.maxVelocity.x;
      } else {
        this.body.velocity.x = -this.body.maxVelocity.x;
      }
      // make dust on the wall
      this.dropDust();
      // change state to air state
      this.currentState = this.airState;
    // if on the floor (not on the wall)
    } else if (this.body.onFloor() || this.wasOnGround) {
      this.wasOnGround = false;
      this.jumpSound.play();
      this.body.velocity.y = this.jumpSpeed;
      this.currentState = this.airState;
      this.dropDust();
    }
  }, this);

  // drilling powers
  this.drillBtn.onDown.add(function() {
    this.currentState = this.drillState;
  }, this);
  // drill sprite
  this.drill = this.game.add.sprite(0, 0, 'drill');
  this.game.physics.arcade.enable(this.drill);
  this.drill.animations.add('drill-right', [0,1,2,3]);
  this.drill.animations.add('drill-left', [4,5,6,7]);
  this.drill.anchor.y = 0.5;
  this.drill.kill();
  // drill effects
  this.drillParticles = this.game.add.emitter(0, 0, 200);
  this.drillParticles.makeParticles('drill-particle');
  this.drillParticles.minRotation = 0;
  this.drillParticles.maxRotation = 0;
  this.drillParticles.minParticleScale = 0.3;
  this.drillParticles.maxParticleScale = 1.5;
  this.drillParticles.setYSpeed(-200, -150);
  this.drillParticles.gravity = 500;

  // init with spawning logic
  // (state logic begins after spawn timer is up)
  this.spawning = true;
  this.frame = 7;
  var spawnTween = this.game.add.tween(player).to({ alpha: 0 }, 100, 'Linear', true, 0, -1, true);
  this.game.time.events.add(700, function() {
    this.spawning = false;
    this.alpha = 1;
    spawnTween.stop();
  }, this);

  // first state after spawn
  this.currentState = this.groundState;

  // add to the game
  this.game.add.existing(this);
  this.game.layers.player.add(this);

};

MinerGame.Player.prototype = Object.create(Phaser.Sprite.prototype);
MinerGame.Player.prototype.constructor = MinerGame.Player;

MinerGame.Player.prototype.update = function() {
  if (this.spawning) {
    return;
  }
  // animations and state logic
  this.currentState();
};

// STATES //
MinerGame.Player.prototype.groundState = function() {
  // disable jump when player landed on a spring
  if (this.spring) {
    this.spring = false;
  } else {
    // delayed "onGound" check for better controls
    this.wasOnGround = true;
  }

  // moving left or right
  this.moveX();

  // animate running
  if (Math.abs(this.body.velocity.x)) {
    if (this.facing === 'left') {
      this.animations.play('run-left', 15, true);
    } else {
      this.animations.play('run-right', 15, true);
    }
  }

  // play footstep sound
  // if foot down, play sound
  if (this.frame === 0 || this.frame === 2 || this.frame === 9 || this.frame === 11) {
    if (!this.footstepSound.isPlaying) {
      this.footstepSound.play();
    }
  }

  // stop running animation if stopped
  if (Math.abs(this.body.velocity.x) == 0) {
    // stop running animation
    this.animations.stop();
    if (this.facing === 'left') {
      this.frame = 14;
    } else {
      this.frame = 5;
    }
  }

  // fell off a ledge
  if (!this.body.onFloor()) {
    this.currentState = this.airState;
  }
};

MinerGame.Player.prototype.airState = function() {
  // delayed "onGround" check for better controls
  if (this.wasOnGround) {
    this.game.time.events.add(this.groundDelay, function() {
      this.wasOnGround = false;
    }, this);
  }

  // moving left or right
  this.moveX();

  // reduce friction
  this.body.drag.x = this.dragConst / 2;

  // animate
  if (this.facing === 'left') {
    this.frame = 15;
  } else {
    this.frame = 4;
  }

  // wall sliding (pre wall-jump)
  if (this.body.onWall() && this.left > 0 && this.right < this.game.width) {
    this.body.drag.x = this.dragConst;
    this.currentState = this.wallSlideState;
  }

  // hit the ground
  if (this.body.onFloor()) {
    this.body.drag.x = this.dragConst;
    this.currentState = this.groundState;
    this.dropDust();
  }
};

MinerGame.Player.prototype.wallSlideState = function() {
  // if not leaning in to wall, break away from wall after this.wallBreakTime frames
  if ((this.cursors.right.isDown && this.facing === 'right') ||
     (this.cursors.left.isDown && this.facing === 'left')) {
    this.wallBreakClock = 0;
  } else {
    this.wallBreakClock++;
  }

  // "fall" off wall if not leaning into wall
  if (this.wallBreakClock >= this.wallBreakTime) {
    this.wallBreakClock = 0;
    this.currentState = this.airState;
  }

  // slide more slowly
  if (this.body.velocity.y >= this.maxFallSpeed / 4) {
    this.body.velocity.y = this.maxFallSpeed / 4;
  }

  // animate
  this.animations.stop();
  if (this.facing === 'left') {
    this.frame = 10;
  } else {
    this.frame = 1;
  }

  // dust
  if (this.game.time.time > this.dustTimer + 40 && this.body.velocity.y >= 30) {
    // make dust
    this.dropDust(true);
    this.dustTimer = this.game.time.time;
  }

  // let go of the wall
  if (!this.body.onWall()) {
    this.wallBreakClock = 0;
    this.body.maxVelocity.y = this.maxFallSpeed;
    this.currentState = this.airState;
  }

  // hit the floor
  if (this.body.onFloor()) {
    this.wallBreakClock = 0;
    this.body.maxVelocity.y = this.maxFallSpeed;
    this.currentState = this.groundState;
    this.dropDust();
  }
};

MinerGame.Player.prototype.drillState = function() {

  // animations
  this.animations.stop();
  // shake player
  var aY = Math.random() + 0.4;
  if (aY > 0.6) aY = 0.6;
  this.anchor.y = aY;

  // fall slowly, move constant right or left
  this.body.velocity.y = 15;
  this.body.maxVelocity.x = this.hSpeed * 2;
  if (this.facing === 'right') {
    this.body.velocity.x = this.body.maxVelocity.x;
    this.frame = 3;

    // revive drill sprite
    this.drill.anchor.x = 0;
    this.drill.reset(this.right, this.y);
    this.drill.revive();
    this.drill.animations.play('drill-right', 15);
    // drop dust
    if (this.game.time.time > this.dustTimer + 40) {
      this.dropDust(true, this.body.left, this.body.centerY);
      this.dustTimer = this.game.time.time;
      this.drillSound.play();
    }
  } else {
    this.body.velocity.x = -this.body.maxVelocity.x;
    this.frame = 8;

    // revive drill sprite
    this.drill.anchor.x = 1;
    this.drill.reset(this.left, this.y);
    this.drill.revive();
    this.drill.animations.play('drill-left', 15);
    // drop dust
    if (this.game.time.time > this.dustTimer + 40) {
      this.dropDust(true, this.body.right, this.body.centerY);
      this.dustTimer = this.game.time.time;
      this.drillSound.play();
    }
  }

  // drill particles
  this.drillParticles.x = this.x;
  this.drillParticles.y = this.y;
  if (!this.drillParticles.on) {
    this.drillParticles.start(false, 5000, 20);
  }

  // done drilling, released button
  if (this.drillBtn.isUp) {
    this.drill.kill();
    this.drillParticles.on = false;
    this.body.maxVelocity.x = this.hSpeed;
    this.anchor.y = 0.5;
    if (this.body.onFloor()) {
      this.currentState = this.groundState;
    } else {
      this.currentState = this.airState;
    }
  }
};

// UTILITIES //
MinerGame.Player.prototype.moveX = function() {
  // set acceleration on input
  if (this.cursors.left.isDown) {
    this.facing = 'left';
    this.body.acceleration.x = -this.accelConst;
    // less acceleration if in air
    if (!this.body.onFloor()) {
      this.body.acceleration.x = -this.accelConst / 2;
    }
  } else if (this.cursors.right.isDown) {
    this.facing = 'right';
    this.body.acceleration.x = this.accelConst;
    // less acceleration if in air
    if (!this.body.onFloor()) {
      this.body.acceleration.x = this.accelConst / 2;
    }
  } else {
    this.body.acceleration.x = 0;
  }
};
