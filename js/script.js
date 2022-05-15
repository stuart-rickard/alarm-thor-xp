// starter for alarm tone

function sound(duration, frequency) {
  var context = new AudioContext();
  return new Promise((resolve, reject) => {
    try {
      let oscillator = context.createOscillator();
      oscillator.type = "triangle";
      oscillator.connect(context.destination);

      // Set the oscillator frequency in hertz
      oscillator.frequency.value = frequency;

      // Start audio with the desired duration
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + duration * 0.001);

      // Resolve the promise when the sound is finished
      oscillator.onended = () => {
        resolve();
      };
    } catch (error) {
      reject(error);
    }
  });
}

// create time and day entry input box
// create add new entry button

// create group box
// create new group button

// create save and start timer button

// once started, check current day and time against timers
// get current time
// compare to alarm time
// alarm for any timers that are due
// change their appearance
