var MinerGame = MinerGame || {};

// THANKS FOR PLAYING DEMO STATE //
MinerGame.thanksState = function(){};

MinerGame.thanksState.prototype = {
  create: function() {
    // thanks text
    this.game.add.bitmapText(this.game.camera.x + (this.game.camera.width / 2), this.game.camera.y + (this.game.camera.height / 2), 'carrier_command', 'THANKS FOR PLAYING THE DEMO\n\nPLEASE SEND FEEDBACK TO ALEX\n\nr.alex.morris.3@gmail.com\n\n@ramorris_3\n\nhttp://ralexmorris.com/blog', 12).anchor.setTo(0.5, 0.5);

    // create menu text
    this.startText = this.game.add.bitmapText(this.game.camera.x + (this.game.camera.width / 2), this.game.camera.height - 150, 'carrier_command', 'PRESS \'X\' TO RESTART', 12);
    this.startText.anchor.setTo(0.5, 0.5);

    // credit text
    this.game.add.bitmapText(14, this.game.height - 12, 'carrier_command', 'art by @ansimuz', 8).anchor.setTo(0,1);
    this.game.add.bitmapText(this.game.width - 12, this.game.height - 12, 'carrier_command', 'music by @ericskiff', 8).anchor.setTo(1, 1);

    // start button
    var startKey = this.game.input.keyboard.addKey(Phaser.Keyboard.X);
    startKey.onDown.add(function() {
      if (this.resetting) {
        return;
      }
      this.resetting = true;
      if (MinerGame.currentTrack) {
        MinerGame.currentTrack.stop();
        // REPLACE THESE WITH A RESET FUNCTION
        MinerGame.currentTrack = null;
        MinerGame.secrets = 0;
        MinerGame.startTime = 0; // FIX THIS
      }
      var startSound = this.add.audio('start_game');
      startSound.volume -= .5;
      startSound.play();
      // menu text fade in and out for 1.5 sec
      var startTween = this.game.add.tween(this.startText).to({ alpha: 0 }, 100, "Linear", true, 0, -1, true);
      // after 1.5 sec, transition to next state
      this.game.time.events.add(700, function() {
        this.resetting = false;
        this.game.state.start('menu');
      }, this);
    }, this);
  },
  update: function() {
    // shake starting text
    var randX = Math.random();
    var randY = Math.random();
    if (this.game.time.time % 2) {
      randX *= -1;
      randY *= -1;
    }
    var x = this.game.camera.x + (this.game.camera.width / 2);
    var y = this.game.camera.height - 150;
    this.startText.x = x + randX;
    this.startText.y = y + randY;
  }
}
