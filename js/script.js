const documentBody = document.body;

const context = new AudioContext();

const cl = function (log) {
  console.log(log);
};

let settings = {
  clockDelta: 0, // minutes
  siteChanged: false,
  timeOfNextAlarmToday: 2359,
  timeToNextAlarm: 0, // seconds
  groups: {
    "group-1": {
      groupActive: true,
      activeDays: {
        sun: false,
        mon: true,
        tue: true,
        wed: true,
        thu: true,
        fri: true,
        sat: false,
      },
      alarms: [],
    },
  },
};

let audioContextActivated = false;

function sound(duration, frequency) {
  return new Promise((resolve, reject) => {
    try {
      let oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.connect(context.destination);
      oscillator.frequency.value = frequency;
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

function convertToAMPM(fourCharTime) {
  let hourString = fourCharTime[0] + fourCharTime[1];
  // AM times
  if (hourString < 12) {
    // Midnight
    if (hourString == 0) {
      let ampmTime = "12:" + fourCharTime[2] + fourCharTime[3] + " AM";
      return ampmTime;
      // After midnight
    } else {
      let ampmTime =
        hourString + ":" + fourCharTime[2] + fourCharTime[3] + " AM";
      return ampmTime;
    }
    // PM times
  } else {
    hour = Number.parseInt(hourString);
    // Reduce hour by 12, except noon hour
    if (hour > 12) {
      hour = hour - 12;
    }
    let ampmTime =
      hour.toString() + ":" + fourCharTime[2] + fourCharTime[3] + " PM";
    return ampmTime;
  }
}

function convertToFourCharTime(fiveCharTime) {
  let fourCharTime = fiveCharTime.replace(":", "");
  return fourCharTime;
}

function groupOf(idString) {
  let secondHyphenIndex = idString.indexOf("-", 6);
  let groupString = idString.slice(0, secondHyphenIndex);
  cl(groupString);
  return groupString;
}

function timeToNextAlarm() {
  for (group in settings.groups) {
    cl(group);
  }
}

const proceedWith = {
  "make-alert-sound": function (evt) {
    cl("hello from make alert sound");
    audioContextActivated = true;
    makeAlarm();
  },

  "data-do-is-null": function (evt) {
    cl("There is nothing to do for this click location.");
  },

  "add-alarm": function (evt) {
    evt.preventDefault();
    let group = groupOf(evt.target.id);
    let timeInput = document.getElementById(`${group}-new-alarm-input`);
    let newAlarmTimeFiveChar = timeInput.value;
    if (newAlarmTimeFiveChar) {
      // Add time to status object
      let newAlarmTimeFourChar = convertToFourCharTime(newAlarmTimeFiveChar);
      settings.groups[group].alarms.push(newAlarmTimeFourChar);
      // Update DOM to display new time
      const newAlarmTimeEl = document.createElement("p");
      let newAlarmText = "Alarm time: " + convertToAMPM(newAlarmTimeFourChar);
      newAlarmTimeEl.innerText = newAlarmText;
      document.getElementById(`${group}-alarm-times`).append(newAlarmTimeEl);
      document.getElementById(`${group}-new-alarm-form`).reset();
    }
  },

  "turn-group-on": function (evt) {
    cl("turn group on");
    cl(evt);
    let group = groupOf(evt.target.id);
    if (evt.target.checked) {
      settings.groups[group].groupActive = true;
    }
  },

  "turn-group-off": function (evt) {
    cl("turn group off");
    cl(evt);
    let group = groupOf(evt.target.id);
    if (evt.target.checked) {
      settings.groups[group].groupActive = false;
    }
  },

  "toggle-day": function (evt) {
    cl(evt);
    cl("toggle day");
    let group = groupOf(evt.target.id);
    let day = evt.target.id.slice(-3);
    settings.groups[group].activeDays[day] = evt.target.checked;
  },

  "delete-alarm": function (evt) {
    cl("delete alarm");
  },

  "save-page": function (evt) {
    cl("save page");
  },

  "save-as-new-page": function (evt) {
    cl("save as new page");
  },

  "add-group": function (evt) {
    cl("add group");
  },
};

function handleClick(evt) {
  // evt.preventDefault();
  cl("data-do is: " + evt.target.getAttribute("data-do"));
  // cl(evt);
  let functionToDo = evt.target.getAttribute("data-do") || "data-do-is-null";
  proceedWith[functionToDo](evt);
}

documentBody.addEventListener("click", function (evt) {
  cl("body clicked");
  handleClick(evt);
});

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

cl(convertToFourCharTime("21:34"));
