// Import Soundworks library (client side)
import * as soundworks from 'soundworks/client';
import PlayerRenderer from './PlayerRenderer';
// import './tuner.js';

const audioContext = soundworks.audioContext;

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center flex-center">
      <p class="big"><%= title %></p>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

/**
 * `player` experience.
 * This experience plays a sound when it starts, and plays another sound when
 * other clients join the experience.
 */
export default class PlayerExperience extends soundworks.Experience {
  constructor(audioFiles) {
    super();

    this.platform = this.require('platform', { features: ['web-audio'] });
    this.loader = this.require('loader', { files: audioFiles });
    this.checkin = this.require('checkin', { showDialog: false });
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = { title: "Let's go!" };
    this.viewCtor = soundworks.CanvasView;
    this.view = this.createView();

    this.words = "I met a traveller from an antique land Who said Two vast and trunkless legs of stone Stand in the desert Near them on the sand Half sunk a shattered visage lies whose frown And wrinkled lip and sneer of cold command Tell that its sculptor well those passions read Which yet survive stamped on these lifeless things The hand that mocked them and the heart that fed And on the pedestal these words appear My name is Ozymandias king of kings Look on my works ye Mighty and despair Nothing beside remains Round the decay Of that colossal wreck boundless and bare The lone and level sands stretch far away In Egypts sandy silence all alone Stands a gigantic Leg which far off throws The only shadow that the Desert knows I am great Ozymandias saith the stone The King of Kings this mighty City shows The wonders of my hand The Citys gone Nought but the Leg remaining to disclose The site of this forgotten Babylon We wonderand some Hunter may express Wonder like ours when thro the wilderness Where London stood holding the Wolf in chace He meets some fragment huge and stops to guess What powerful but unrecorded race Once dwelt in that annihilated place".toLowerCase().split(" ");
  }

  start() {
    super.start(); // don't forget this

    if (!this.hasStarted)
      this.init();

    this.show();

    // play the first loaded buffer immediately
    const src = audioContext.createBufferSource();
    src.buffer = this.loader.buffers[0];
    src.connect(audioContext.destination);
    src.start(audioContext.currentTime);

    // play the second loaded buffer when the message `play` is received from
    // the server, the message is send when another player joins the experience.
    this.receive('play', () => {
      const delay = Math.random();
      const src = audioContext.createBufferSource();
      src.buffer = this.loader.buffers[1];
      src.connect(audioContext.destination);
      src.start(audioContext.currentTime + delay);
    });

    // pitch tracking
    // var mic = navigator.mediaDevices.getUserMedia({audio: true, video: false})
    //           .then(function(mediaStream) {
    //             console.log(mediaStream);
    //           })
    //           .catch(function(err) {
    //             console.log("ERROR: " + err.name);
    //           });

    // pitch tracking using Tuner()
    this.tuner = new Tuner();
    var prevNote = 0;
    var client = this;
    console.log(this.tuner);

    // poem settings
    // var numWords = 4;

    var getCurNote = function() {

        if (Tuner.curNote != prevNote) {
          // send and update
          client.send('midinote', Tuner.curNote);
          console.log("sent! " + prevNote + "->" + Tuner.curNote);
          prevNote = Tuner.curNote;

          // poem
          var dice = Math.random();
          if (dice > 0.5) {
            var word = client.words[Math.floor(Math.random()*client.words.length)];
            $("#poem").text(word);
          }
        }
    };
    
    setInterval(getCurNote, 100);

    // this.receive

    // initialize rendering
    this.renderer = new PlayerRenderer(100, 100);
    this.view.addRenderer(this.renderer);
    // this given function is called before each update (`Renderer.render`) of the canvas
    this.view.setPreRender(function(ctx, dt) {
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, ctx.width, ctx.height);
      ctx.restore();
    });
  }
}
