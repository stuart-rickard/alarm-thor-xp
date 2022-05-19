const activateButton = document.getElementById("activate");
const groups = document.getElementById("groups");
const addAlarmButton = document.getElementById("add-alarm");
const alarmForm = document.getElementById("new-alarm-form-1");
const alarmInput = document.getElementById("alarmForTest");
const alarmTimesBoxes = document.getElementsByClassName("alarm-times");

const cl = function (log) {
  console.log(log);
};

const context = new AudioContext();

function sound(duration, frequency) {
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
  sound(200, 100)
    .then(() => delay(400))
    .then(() => sound(200, 120))
    .then(() => delay(400))
    .then(() => sound(200, 150))
    .then(() => delay(400))
    .then(() => sound(200, 300))
    .then(() => sound(100, 600))
    .then(() => sound(100, 450))
    .then(() => sound(100, 600))
    .then(() => sound(200, 300))
    .then(() => delay(400))
    .then(() => sound(200, 300))
    .then(() => sound(100, 600))
    .then(() => sound(100, 450))
    .then(() => sound(100, 600))
    .then(() => sound(200, 300))
    .then(() => delay(400))
    .then(() => sound(200, 150))
    .then(() => delay(400))
    .then(() => sound(200, 120))
    .then(() => delay(400))
    .then(() => sound(200, 100));
}

activateButton.addEventListener("click", function (evt) {
  makeAlarm();
});

addAlarmButton.addEventListener("click", function (evt) {
  evt.preventDefault();
  cl("addAlarmButton was clicked");
  const newTime = document.createElement("p");
  newTime.innerText = alarmInput.value;
  alarmTimesBoxes[0].append(newTime);
  alarmForm.reset();
});

// TODO store setting
// TODO sort alarm times
// TODO multiple groups
// TODO rationalize variable names

// once started, check current day and time against timers
// get current time
cl(Date.now());
// compare to alarm time
// alarm for any timers that are due
// change their appearance
