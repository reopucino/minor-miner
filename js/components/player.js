var MinerGame = MinerGame || {};

// PLAYER CLASS //
MinerGame.Player = function(game, x, y) {
  Phaser.Sprite.call(this, game, x, y, 'player');
  this.game = game;
  this.game.layers.player.add(this); // rendering layer
  this.anchor.setTo(0.5);

  // sounds
  this.jumpSound = this.game.add.audio('jump');
  this.jumpSound.volume -= .5;

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
    dust.anchor.setTo(0.5);
    dust.checkWorldBounds = true;
    dust.outOfBoundsKill = true;
    dust.exists = false;
    this.dustGroup.add(dust);
  }
  var player = this;
  this.dropDust = function(x, y) {
    x = x || player.x;
    y = y || player.bottom;
    var dust = player.dustGroup.getFirstExists(false);
    dust.reset(x, y);
    dust.animations.play('float', 10, false, true);
    dust.body.velocity.y = -10;
  };

  // physics
  this.game.physics.arcade.enable(this);
  this.body.collideWorldBounds = true;
  this.body.setSize(8, 12, 4, 4);
  this.body.gravity.y = 450;
  this.body.maxVelocity.x = 260;
  this.body.maxVelocity.y = 250;
  this.accelConst = 1500;
  this.body.acceleration.x = 0;
  this.body.drag.x = 1400;
  this.wallCheck = false; // for custom wall check
  this.groundCheck = false; // for custom ground check
  this.jumpTimer = 0;

  // move player with cursor keys, jump with x
  this.cursors = this.game.input.keyboard.createCursorKeys();
  this.jumpBtn = this.game.input.keyboard.addKey(Phaser.Keyboard.X);

  // jump button handler
  this.jumpBtn.onDown.add(function() {
    // if player is dead, or if player has already jumped, return

    if (!this.body || this.spawning || this.jumpTimer > this.game.time.time - 280) {
      console.log('stopped extra jump');
      return;
    }

    var x;
    // if on the wall
    if (this.onWall() && !this.onFloor()) {
      this.jumpTimer = this.game.time.time;
      this.jumpSound.play();
      this.body.velocity.y = -220;
      // jump away from wall
      if (this.facing === 'left') {
        this.body.velocity.x = this.body.maxVelocity.x - 80;
      } else {
        this.body.velocity.x = -this.body.maxVelocity.x + 80;
      }
      // make dust on the wall
      for (var i = 0; i < 3; i++) {
        // left or right, depending on player.facing
        if (this.facing === 'left') {
          x = this.left + 5;
        } else {
          x = this.right - 5;
        }
        this.dropDust(x, this.bottom);
      }
      this.currentState = this.airState;
    // if on the floor (not on the wall)
    } else if (this.onFloor()) {
      this.jumpTimer = this.game.time.time;
      this.jumpSound.play();
      this.body.velocity.y = -210;
      this.currentState = this.airState;
      this.dropDust(x);
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

  // stop running animation if stopping
  if (Math.abs(this.body.velocity.x) <= 125) {
    // stop running animation
    this.animations.stop();
    if (this.facing === 'left') {
      this.frame = 14;
    } else {
      this.frame = 5;
    }

    // if not completely motionless - "sliding"
    if (Math.abs(this.body.velocity.x)) {
      if (this.game.time.time > this.dustTimer + 30) {
        this.dropDust();
        this.dustTimer = this.game.time.time;
      }
    }
  }

  // fell off a ledge
  if (!this.onFloor()) {
    this.currentState = this.airState;
  }
};

MinerGame.Player.prototype.airState = function() {
  // moving left or right
  this.moveX();

  // animate
  if (this.facing === 'left') {
    this.frame = 15;
  } else {
    this.frame = 4;
  }

  // "float" if player is holding jump button at top of arc
  if (this.body.velocity.y <= 25 && this.body.velocity.y > 0 && this.jumpBtn.isDown) {
    // halve gravity
    this.body.gravity.y = 250;
  } else {
    this.body.gravity.y = 500;
  }

  // wall sliding (pre wall-jump)
  if (this.onWall()) {
    this.currentState = this.wallSlideState;
  }

  // hit the ground
  if (this.onFloor()) {
    this.body.gravity.y = 500;
    this.currentState = this.groundState;
    this.dropDust();
  }
};

MinerGame.Player.prototype.wallSlideState = function() {
  // animate
  this.animations.stop();
  if (this.facing === 'left') {
    this.frame = 10;
  } else {
    this.frame = 1;
  }

  // dust
  if (this.game.time.time > this.dustTimer + 40) {
    // dust on left or right, depending on player.facing
    if (this.facing === 'left') {
      x = this.left + 5;
    } else {
      x = this.right - 5;
    }
    this.dropDust(x, this.bottom);
    this.dustTimer = this.game.time.time;
  }

  // let go of the wall
  if (!this.onWall()) {
    this.currentState = this.airState;
  }

  // hit the floor
  if (this.onFloor()) {
    this.currentState = this.groundState;
    this.dropDust();
  }
};

// UTILITIES //
MinerGame.Player.prototype.moveX = function() {
  // set acceleration on input
  if (this.cursors.left.isDown) {
    this.facing = 'left';
    this.body.acceleration.x = -this.accelConst;
    // less acceleration if in air
    if (!this.onFloor()) {
      this.body.acceleration.x = -this.accelConst / 2;
    }
  } else if (this.cursors.right.isDown) {
    this.facing = 'right';
    this.body.acceleration.x = this.accelConst;
    // less acceleration if in air
    if (!this.onFloor()) {
      this.body.acceleration.x = this.accelConst / 2;
    }
  } else {
    this.body.acceleration.x = 0;
  }
};

MinerGame.Player.prototype.onFloor = function() {
  if (this.body.onFloor()) {
    this.groundCheck = true;
    this.game.time.events.add(275, function() {
      this.groundCheck = false;
    }, this);
  }
  return this.groundCheck;
}

MinerGame.Player.prototype.onWall = function() {
  if (this.body.onWall()) {
    this.wallCheck = true;
    this.game.time.events.add(125, function() {
      this.wallCheck = false;
    }, this);
  }
  return this.wallCheck;
};
