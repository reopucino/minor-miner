var MinerGame = MinerGame || {};

MinerGame.finaleState = function(){};

MinerGame.finaleState.prototype.create = function() {
  // stop music
  if (MinerGame.currentTrack) {
    MinerGame.currentTrack.stop();
  }
  MinerGame.currentTrack = null;

  // camera fade in
  this.game.camera.flash(0x000000, 250);

  // draw background
  this.game.stage.backgroundColor = '#FF7F50';

  // add robot
  this.robot = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'robot');
  this.robot.anchor.setTo(0.5, 0.5);
  this.robot.animations.add('hover');
  this.robot.animations.play('hover', 8, true);

  // add little explosions
  this.smokeTimer = 0;
  this.exploding = true;
  this.smokes = this.game.add.group();
  for (var i = 0; i < 50; i++) {
    var smoke = this.game.add.sprite(0, 0, 'dust');
    this.game.physics.arcade.enable(smoke);
    smoke.animations.add('float');
    smoke.anchor.setTo(0.5, 0.4);
    smoke.exists = false;
    this.smokes.add(smoke);
  }

  // audio
  this.smokeSound = this.game.add.audio('dust');
  this.smokeSound.volume -= .4;
  this.blipSound = this.game.add.audio('blip');
  this.blipSound.volume -= 0.6;

  // init robot text
  // init tutorial text
  this.robotText = this.game.add.bitmapText(this.game.world.centerX, this.game.world.centerY + 200, 'carrier_command', '', 12);
  this.robotText.anchor.setTo(0.5, 0.5);

  this.charClock = 0;
  this.charTimer = 0;
  this.currCharIndex = 0;
  this.lineClock = 0;
  this.lineTimer = 0;
  this.currLineIndex = 0;
  this.lines = ['Why are you doing this to me?', 'ahhhh', 'hurts so good'];
  this.currLine = this.lines[0];
  this.drawText = true;
};

MinerGame.finaleState.prototype.update = function() {
  // animate smoking robot
  if (this.exploding) {
    this.robot.x = this.game.world.centerX + Math.random();
    this.robot.y = this.game.world.centerY + Math.random();
    this.smokeTimer++;
    if (this.smokeTimer % 15 === 0) {
      this.smokeBall();
    }
    if (this.smokeTimer % 24 === 0) {
      this.smokeBall();
    }
  }

  // draw robot's last words
  if (this.drawText) {
    // increment by chars
    this.charClock++;
    // update every 3 frames
    if (this.charClock > this.charTimer + 3 && !this.charsPaused) {
      // advance to next char and reset timer
      this.charTimer = this.charClock;
      this.robotText.text += this.currLine[this.currCharIndex];
      this.currCharIndex++;
      this.blipSound.play();
    }

    // at the end of a line, pause reading chars and advance to next line
    if (this.currCharIndex > this.currLine.length - 1) {
      this.charsPaused = true;
      // wait...
      this.lineClock++;
      if (this.lineClock > this.lineTimer + 80) { // 60 frames, 1 sec
        this.currLineIndex++;
        if (this.currLineIndex < this.lines.length) {
          // reset timers, advance to next line, unpause char parsing
          this.lineTimer = this.lineClock;
          this.currLine = this.lines[this.currLineIndex];
          this.charsPaused = false;
          // reset tut text and char ind pointer
          this.robotText.text = '';
          this.currCharIndex = 0;
        } else { // at end of lines, nothing more to read
          this.drawText = false;
          this.robotText.kill();
          this.explode();
        }
      }
    }
  }
};

MinerGame.finaleState.prototype.smokeBall = function() {
  // place smoke puff
  var smoke = this.smokes.getFirstExists(false);
  smoke.reset(this.robot.x + Math.random() * 24 - 12, this.robot.y + Math.random() * 32 - 16);
  smoke.animations.play('float', 10, false, true);
  smoke.body.velocity.y = -25;
  // play sound
  this.smokeSound.play();
};

MinerGame.finaleState.prototype.explode = function() {
  this.exploding = false;
  // destroy robot
  this.robot.pendingDestroy = true;

  // play noise

  // make bigger explosions everwhere

  // start happy music

  // show stats, continue text, etc.
};
