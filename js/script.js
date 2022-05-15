const activateButton = document.getElementById("activate");
const groups = document.getElementById("groups");
const addAlarmButtons = document.getElementsByClassName("add-alarm");
const alarmForm = document.getElementById("new-alarm-form-1");
let data = new FormData();

const cl = function (log) {
  console.log(log);
};

function sound(duration, frequency) {
  var context = new AudioContext();
  return new Promise((resolve, reject) => {
    try {
      let oscillator = context.createOscillator();
      oscillator.type = "sine";
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

function delay(duration) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), duration);
  });
}

function makeAlarm() {
  sound(200, 300)
    .then(() => sound(100, 600))
    .then(() => sound(100, 900))
    .then(() => sound(200, 300))
    .then(() => delay(200))
    .then(() => sound(200, 300))
    .then(() => sound(100, 600))
    .then(() => sound(100, 900))
    .then(() => sound(200, 300));
}

activateButton.addEventListener("click", function (evt) {
  makeAlarm();
});

alarmForm.addEventListener("click", function (evt) {
  evt.preventDefault();
  cl("alarmForm was clicked");
  cl(evt);
  data.append("time", document.getElementById("new-alarm-form-1").value);
  cl(data);
});

// groups.addEventListener("click", function (evt) {
//   console.log("groups clicked");
//   console.log(evt);
//   if (evt.path.includes("button.add-alarm")) {
//     console.log("im included");
//   }
// });

// create add new entry button

// TODO store setting

// once started, check current day and time against timers
// get current time
// compare to alarm time
// alarm for any timers that are due
// change their appearance
