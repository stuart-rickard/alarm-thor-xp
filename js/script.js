const documentBody = document.body;

// const activateButton = document.getElementById("activate");
// const groups = document.getElementById("groups");
// const addAlarmButton = document.getElementById("add-alarm");
// const alarmForm = document.getElementById("new-alarm-form-1");
// const alarmInput = document.getElementById("alarmForTest");
// const alarmTimesBoxes = document.getElementsByClassName("alarm-times");
const weekDaysSelectors = document.getElementsByClassName("weekDays-selector");
const groupActiveRadios = document.getElementsByClassName("radio-buttons");

const context = new AudioContext();

const cl = function (log) {
  console.log(log);
};

let settings = {
  clockDelta: 0, // minutes
  groups: [
    {
      groupActive: true,
      activeDays: {
        Sunday: false,
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
      },
      alarms: [],
    },
  ],
};

let audioContextActivated = false;

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

const proceedWith = {
  "make-alert-sound": function () {
    cl("hello from make alert sound");
    audioContextActivated = true;
    makeAlarm();
  },
  "data-do-is-null": function () {
    cl("There is nothing to do for this click location.");
  },
  "add-alarm": function (evt) {
    cl("addAlarmButton was clicked");
    const newTime = document.createElement("p");
    let newAlarm = evt.target.value;
    newTime.innerText = newAlarm;
    settings.groups[0].alarms.push(newAlarm);
    cl(alarmInput.value);
    cl(settings);
    alarmTimesBoxes[0].append(newTime);
    alarmForm.reset();
  },
};

function handleClick(evt) {
  evt.preventDefault();
  cl("data-do is: " + evt.target.getAttribute("data-do"));
  cl(evt);
  let functionToDo = evt.target.getAttribute("data-do") || "data-do-is-null";
  cl(functionToDo);
  proceedWith[functionToDo](evt);
}

documentBody.addEventListener("click", function (evt) {
  cl("body clicked");
  handleClick(evt);
});

// activateButton.addEventListener("click", function (evt) {
// makeAlarm();
// });

weekDaysSelectors[0].addEventListener("click", function (evt) {
  if (evt.path[0].tagName == "LABEL") {
    return;
  }
  cl("id: " + evt.path[0].getAttribute("id"));
  cl("tagName: " + evt.path[0].tagName);
  cl("checked: " + evt.target.checked);
  cl("day: " + evt.target.getAttribute("data-day"));
  cl("group: " + evt.target.getAttribute("data-group"));
  cl(evt);
});

groupActiveRadios[0].addEventListener("click", function (evt) {
  // need to handle null responses
  cl(evt.target.getAttribute("data-radio"));
  // cl(evt);
});

// addAlarmButton.addEventListener("click", function (evt) {
//   cl("addAlarmButton was clicked");
//   const newTime = document.createElement("p");
//   let newAlarm = alarmInput.value;
//   newTime.innerText = newAlarm;
//   settings.groups[0].alarms.push(newAlarm);
//   cl(alarmInput.value);
//   cl(settings);
//   alarmTimesBoxes[0].append(newTime);
//   alarmForm.reset();
// });

// TODO store setting
// TODO sort alarm times
// TODO multiple groups
// TODO rationalize variable names

// once started, check current day and time against timers
// check day
// check current time is equal to or later than alarm

const isEarlierThanNow = function (testedTime) {
  let hour = testedTime[0] * 10 + testedTime[1] * 1;
  let minute = testedTime[3] * 10 + testedTime[4] * 1;
  let dN = new Date();
  let nowHour = dN.getHours();
  let nowMinute = dN.getMinutes();
  if (hour < nowHour || (hour == nowHour && minute <= nowMinute)) {
    return true;
  } else {
    return false;
  }
};

// alarm for any timers that are due
if (isEarlierThanNow("12:26")) {
  // makeAlarm();
}
// change their appearance

// const toDo = function () {
//   proceedWith["make-alert-sound"]();
// };

// toDo();
