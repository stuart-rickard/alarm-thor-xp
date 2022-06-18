// TODO CHECK FOR SLICE ERRORS

const documentBody = document.body;
const countdownEl = document.getElementById("countdown");

const context = new AudioContext();

const cl = function (log) {
  console.log(log);
};

let settings = {
  clockDelta: 0, // minutes
  siteChanged: false,
  timeOfNextAlarmToday: false, // false initially and when there's no alarm in the future today
  timeToNextAlarm: 0, // seconds
  lastAlarm: {
    // initially, a time in the past
    date: "200000",
    time: "0000",
  },
  pulsePeriod: 5, // seconds; must be less than 60
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

let dayStringAssign = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

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
  // TODO deal with new day and with restart on same day

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
    hour = Number(hourString);
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

function convertToSixCharDate(date) {
  let year = date.getFullYear();
  let month = date.getMonth();
  let monthTwoChar =
    month + 1 < 10 ? "0" + (month + 1).toString() : (month + 1).toString();
  let day = date.getDay();
  let dayTwoChar = day < 10 ? "0" + day.toString() : day.toString();
  return year.toString().slice(-2) + monthTwoChar + dayTwoChar;
}

function convertDateToFourCharTime(date) {
  let nowHour = date.getHours();
  let nowMinute = date.getMinutes();
  let hourTwoChar =
    nowHour < 10 ? "0" + nowHour.toString() : nowHour.toString();
  let minuteTwoChar =
    nowMinute < 10 ? "0" + nowMinute.toString() : nowMinute.toString();
  return hourTwoChar + minuteTwoChar;
}

function groupOf(idString) {
  let secondHyphenIndex = idString.indexOf("-", 6);
  let groupString = idString.slice(0, secondHyphenIndex);
  return groupString;
}

function secondsToNextAlarm(date) {
  let nowHour = date.getHours();
  let nowMinute = date.getMinutes();
  let nowSeconds = date.getSeconds();
  // TODO - resolve line below.
  // let nextAlarm = false;
  let nextAlarm = settings.timeOfNextAlarmToday;
  if (nextAlarm) {
    // compare
    // hours
    let deltaHours = Number(nextAlarm.slice(0, 2)) - nowHour;
    // minutes
    // TODO ERROR IN THIS CALCULATION
    let deltaMinutes =
      Number(nextAlarm.slice(-2)) - nowMinute - (nowSeconds ? 1 : 0);
    // seconds
    let deltaSeconds = 60 - nowSeconds;
    // convert
    let deltaHoursString =
      deltaHours < 10
        ? deltaHours == 0
          ? "00"
          : "0" + deltaHours.toString()
        : deltaHours.toString();
    let deltaMinutesString =
      deltaMinutes < 10
        ? deltaMinutes == 0
          ? "00"
          : "0" + deltaMinutes.toString()
        : deltaMinutes.toString();
    let deltaSecondsString =
      deltaSeconds < 10
        ? deltaSeconds == 0
          ? "00"
          : "0" + deltaSeconds.toString()
        : deltaSeconds.toString();
    let countDownTime =
      deltaHoursString + ":" + deltaMinutesString + ":" + deltaSecondsString;
    return countDownTime;
  } else {
    return "No alarm set for the rest of today.";
  }
}

function timeToNextAlarm() {
  settings.timeOfNextAlarmToday = false; // reset next alarm time
  let dN = new Date();
  // let nowHour = dN.getHours();
  // let nowMinute = dN.getMinutes();
  // let nowSeconds = dN.getSeconds();
  let nowTimeFourChar = convertDateToFourCharTime(dN);
  let nowDay = dN.getDay();
  nowDay = dayStringAssign[nowDay];
  let alarmToTest = "";

  for (group in settings.groups) {
    if (settings.groups[group].groupActive) {
      if (settings.groups[group].activeDays[nowDay]) {
        for (let i = 0; i < settings.groups[group].alarms.length; i++) {
          alarmToTest = settings.groups[group].alarms[i];
          if (alarmToTest > nowTimeFourChar) {
            cl(
              settings.timeOfNextAlarmToday
                ? settings.timeOfNextAlarmToday
                : "2401"
            );
            if (
              alarmToTest <
              (settings.timeOfNextAlarmToday
                ? settings.timeOfNextAlarmToday
                : "2401") // if timeOfNextAlarmToday is false, compare to "2401", which will always be true
            )
              settings.timeOfNextAlarmToday = alarmToTest;
            // TODO deal with new day and with restart on same day
          } else {
            if (alarmToTest == nowTimeFourChar) {
              let dateNowSixChar = convertToSixCharDate(dN);
              if (
                settings.lastAlarm.date != dateNowSixChar ||
                settings.lastAlarm.time != alarmToTest
              ) {
                settings.lastAlarm.date = dateNowSixChar;
                settings.lastAlarm.time = alarmToTest;
                makeAlarm();
              }
            } else {
            }
          }
        }
      }
    }
  }
  settings.timeToNextAlarm = secondsToNextAlarm(dN);
  countdownEl.innerText = "Time until next alarm: " + settings.timeToNextAlarm;
}

const createElement = function ({
  type,
  styles,
  attributes,
  props,
  eventHandlers,
  appendTo,
}) {
  let elementType = type || "div";
  let elementStyles = styles || {};
  let elementAttributes = attributes || {};
  let elementProps = props || {};
  let elementEventHandlers = eventHandlers || {};
  let elementAppendTo = appendTo || "body";

  let element = document.createElement(elementType);
  for (let key in elementStyles) {
    element.style[key] = elementStyles[key];
  }
  for (let key in elementAttributes) {
    element.setAttribute(key, elementAttributes[key]);
  }
  for (let key in elementProps) {
    element[key] = elementProps[key];
  }
  for (let key in elementEventHandlers) {
    element.addEventListener(key, elementEventHandlers[key]);
  }
  elementAppendTo.append(element);

  cl(element);
  // not sure we need the return statement
  // return element;
};

const proceedWith = {
  "next-alarm": function () {
    timeToNextAlarm();
  },

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
      const newAlarmDeleteButton = document.createElement("button");
      let newAlarmText = "Alarm time: " + convertToAMPM(newAlarmTimeFourChar);
      // TODO: AM times show up with 0, but pm times don't
      newAlarmTimeEl.innerText = newAlarmText;
      newAlarmDeleteButton.innerText = "x delete this alarm";
      newAlarmTimeEl.style.display = "inline-block";
      newAlarmDeleteButton.setAttribute("id", "group-1-delete-alarm-btn");
      newAlarmDeleteButton.setAttribute("data-do", "delete-alarm");
      document.getElementById(`${group}-alarm-times`).append(newAlarmTimeEl);
      document
        .getElementById(`${group}-alarm-times`)
        .append(newAlarmDeleteButton);
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
    evt.preventDefault();
    cl("add group");
    let argElDetails = {
      type: "div",
      styles: {
        color: "#fff",
        "background-color": "#3da6ed",
        "border-radius": "2px",
      },
      props: {
        innerText: "text",
      },
      appendTo: documentBody,
    };
    createElement(argElDetails);
  },
};

function handleClick(evt) {
  // evt.preventDefault();
  cl("data-do is: " + evt.target.getAttribute("data-do"));
  // cl(evt);
  let functionToDo = evt.target.getAttribute("data-do") || "data-do-is-null";
  proceedWith[functionToDo](evt);
}

// function pulse() {
//   pulseInterval = setInterval(cl("hello"), settings.pulsePeriod * 1000);
//   // clearInterval(pulseInterval);
// }

documentBody.addEventListener("click", function (evt) {
  cl("body clicked");
  handleClick(evt);
});

function pulse() {
  cl("hello *************************");
  timeToNextAlarm();
}

setInterval(pulse, settings.pulsePeriod * 1000);
// setInterval(cl("hello"), settings.pulsePeriod * 1000);

// pulse();
// TODO store setting
// TODO sort alarm times
// TODO multiple groups
// TODO rationalize variable names

// once started, check current day and time against timers
// check day
// check current time is equal to or later than alarm

// const isEarlierThanNow = function (testedTime) {
//   let hour = testedTime[0] * 10 + testedTime[1] * 1;
//   let minute = testedTime[3] * 10 + testedTime[4] * 1;
//   let dN = new Date();
//   let nowHour = dN.getHours();
//   let nowMinute = dN.getMinutes();
//   if (hour < nowHour || (hour == nowHour && minute <= nowMinute)) {
//     return true;
//   } else {
//     return false;
//   }
// };

// alarm for any timers that are due
// if (isEarlierThanNow("12:26")) {
//   // makeAlarm();
// }
// change their appearance

// const toDo = function () {
//   proceedWith["make-alert-sound"]();
// };

// toDo();

// timeToNextAlarm();
