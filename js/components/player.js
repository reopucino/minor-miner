var MinerGame = MinerGame || {};

// PLAYER CLASS //
MinerGame.Player = function(game, x, y) {
  Phaser.Sprite.call(this, game, x, y, 'player');
  this.game = game;
  this.game.layers.player.add(this); // rendering layer
  this.anchor.setTo(0.5);

  // sounds
  this.jumpSound = this.game.add.audio('jump');
  this.jumpSound.volume -= .6;
  this.rocketSound = this.game.add.audio('rocket');
  this.rocketSound.volume -= .5;
  this.footstepSound = this.game.add.audio('footstep');
  this.footstepSound.volume -= .55;
  this.dustSound = this.game.add.audio('dust');
  this.dustSound.volume -= .4;

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
  this.dropDust = function(repeated) {
    var dust = player.dustGroup.getFirstExists(false);
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
  this.canAirJump = true;
  this.rocketDuration = 250;
  this.rocketClock = 0;
  this.body.maxVelocity.x = 190;
  this.maxFallSpeed = 500;
  this.body.maxVelocity.y = this.maxFallSpeed;
  this.accelConst = 1800;
  this.body.acceleration.x = 0;
  this.dragConst = 2000;
  this.body.drag.x = this.dragConst;
  this.wallCheck = false; // for custom wall check
  this.wasOnGround = true; // for custom ground check
  this.groundDelay = 80; // player can jump up to 40 ms after leaving ground

  // move player with cursor keys, jump with x
  this.cursors = this.game.input.keyboard.createCursorKeys();
  this.jumpBtn = this.game.input.keyboard.addKey(Phaser.Keyboard.X);

  // jump button handler
  this.jumpBtn.onDown.add(function() {
    // if player is dead, or if player has already jumped, return
    if (!this.body || this.spawning) {
      console.log('stopped extra jump');
      return;
    }

    // if on the wall
    if (this.body.onWall() && !this.body.onFloor()) {
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
    // in the air
    } else {
      if (this.canAirJump) {
        this.canAirJump = false;
        this.currentState = this.rocketState;
        this.rocketSound.play();
        this.rocketClock = this.game.time.time;
      }
    }
  }, this);

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
  // delayed "onGround" check for better controls
  this.wasOnGround = true;
  // reset airjump flag
  this.canAirJump = true;

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
  this.body.drag.x = this.dragConst / 5;

  // animate
  if (this.facing === 'left') {
    this.frame = 15;
  } else {
    this.frame = 4;
  }

  // wall sliding (pre wall-jump)
  if (this.body.onWall()) {
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
  // slide more slowly
  if (this.body.velocity.y >= this.maxFallSpeed / 2) {
    this.body.velocity.y = this.maxFallSpeed / 2;
  }

  // animate
  this.animations.stop();
  if (this.facing === 'left') {
    this.frame = 10;
  } else {
    this.frame = 1;
  }

  // dust
  if (this.game.time.time > this.dustTimer + 40 && this.body.velocity.y >= 50) {
    // make dust
    this.dropDust(true);
    this.dustTimer = this.game.time.time;
  }

  // let go of the wall
  if (!this.body.onWall()) {
    this.body.maxVelocity.y = this.maxFallSpeed;
    this.currentState = this.airState;
  }

  // hit the floor
  if (this.body.onFloor()) {
    this.body.maxVelocity.y = this.maxFallSpeed;
    this.currentState = this.groundState;
    this.dropDust();
  }
};

MinerGame.Player.prototype.rocketState = function() {
  // gain speed for this.rocketDuration
  if (this.game.time.time - this.rocketClock <= this.rocketDuration) {
    this.body.velocity.y = this.jumpSpeed;
  }

  // still rocketing straight up
  this.body.velocity.x = 0;

  // shake the player sprite
  var offset = Math.random() - 0.4;
  offset = offset < 0.3 ? 0.3 : offset;
  offest = offset > 0.6 ? 0.6 : offset;
  this.anchor.x = offset;
  // make dust trail
  if (this.game.time.time > this.dustTimer + 40) {
    this.dropDust(true);
    this.dustTimer = this.game.time.time;
  }

  // animate rocketing up
  this.animations.stop();
  if (this.facing === 'right') {
    this.frame = 7;
  } else {
    this.frame = 12;
  }

  // at peak of jump, go back to normal air state
  if (this.body.velocity.y >= -150){
    this.currentState = this.airState;
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
