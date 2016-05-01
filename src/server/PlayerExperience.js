// Import Soundworks server side Experience
import { Experience } from 'soundworks/server';

/**
 * Server-side 'player' experience.
 */
export default class PlayerExperience extends Experience {
  /**
   *
   */
  constructor(clientType) {
    super(clientType);

    this.checkin = this.require('checkin');
    this.clientNotes = {};
  }

  /**
   * If anything needs to happen when a client enters the performance (*i.e.*
   * starts the experience on the client side), write it in the `enter`
   * method.
   */
  enter(client) {
    super.enter(client);
    // Send a message to all the other clients of the same type
    this.broadcast(client.type, client, 'play');

    this.receive(client, 'midinote', (midinote) => {
      console.log("received note " + midinote + " from client " + client.uuid + " (" + Object.keys(client) + ")");

      this.clientNotes[client.uuid] = midinote;
      console.log(this.clientNotes);

      // flesh out chords
      var chord = this.createChord(this.clientNotes);
      var clientNotes = this.clientNotes;
      console.log("constructed chord " + chord + " from aggregated clientNotes " + Object.keys(this.clientNotes).map(function(k) { return clientNotes[k]; }));

      // send chord data via MIDI
      var midi = require('midi');
      var output = new midi.output();
      // output.getPortCount();
      // output.getPortName(0);
      output.openPort(0);
      for (var i=0; i<chord.length; i++) {
        var note = chord[i];
        output.sendMessage([144, note, 90]); //  [command, pitch, velocity]
        console.log("noteon " + note);
        (function(n) {
          setTimeout(function() {
              // var n = note;
              output.sendMessage([128, n, 40]);
              console.log("noteoff" + n);
          }, (Math.random()*2000) + 3000 );
        })(note);
      }
      output.closePort();

    });
  }

  exit(client) {
    super.exit(client);
    // ...
  }

  createChord(clientNotes) {
    var minChordSize = 3;
    var notes = [];
    for (var k in clientNotes) {
      notes.push(clientNotes[k]);
    }

    // method 1: calculate dissonance using lg(LCM(x, y)) for each note

    // method 2: fourths, fifths, octaves
    var intervals = [5, 7, 12];

    while (notes.length < minChordSize) {
      var newNotes = [];
      for (var i=0; i<notes.length; i++) {
        var note = notes[i];
        var intervalIdx = Math.floor(Math.random() * intervals.length);
        var newInterval = intervals[intervalIdx];
        var newNote = note + newInterval;
        newNotes.push(newNote);
      }

      for (var i=0; i<newNotes.length; i++) {
        notes.push(newNotes[i]);
      }
    }

    return notes;
  }


  /**
   * If anything needs to happen when a client connects to the server,
   * write it in the `connect` method.
   */
  // connect(client) {
  //   super.connect(client); // don't forget this
  //
  //   ... // your code
  // }

  /**
   * If anything needs to happen when a client disconnects from the server,
   * write it in the `disconnect` method.
   */
  // disconnect(client) {
  //   super.disconnect(client); // don't forget this
  //
  //   ... // your code
  // }
}
