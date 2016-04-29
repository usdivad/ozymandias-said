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
    var prevNote = -1;
    var client = this;
    console.log(this.tuner);

    var getCurNote = function() {
      var curNote = Tuner.curNote;
      // console.log(curNote);

      return function() {
        if (Tuner.curNote != prevNote) {
          client.send('midinote', Tuner.curNote);
          console.log("sent! " + prevNote + "->" + Tuner.curNote);

          prevNote = Tuner.curNote;
        }
      };
    };
    
    setInterval(getCurNote(), 100);

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
