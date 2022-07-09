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
  nextGroup: 2,
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
    let nowTotalSeconds = nowHour * 3600 + nowMinute * 60 + nowSeconds;
    let nextAlarmTotalSeconds =
      nextAlarm.slice(0, 2) * 3600 + nextAlarm.slice(-2) * 60;
    let deltaValue = nextAlarmTotalSeconds - nowTotalSeconds;
    let deltaSeconds = deltaValue % 60;
    deltaValue = deltaValue - deltaSeconds;
    let deltaMinutes = (deltaValue % 3600) / 60;
    deltaValue = deltaValue - deltaMinutes * 60;
    let deltaHours = deltaValue / 3600;
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

// rename this function
function timeToNextAlarm() {
  settings.timeOfNextAlarmToday = false; // reset next alarm time
  let dN = new Date();
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

class AlarmCreateArgs {
  constructor(group, alarmTime, newAlarmText) {
    this.group = group;
    this.alarmTime = alarmTime;
    this.newAlarmText = newAlarmText;
  }

  provideAlarmCreateArgs() {
    return {
      1: {
        attributes: {
          id: `${this.group}-alarm-${this.alarmTime}`,
        },
        childElements: {
          1: {
            type: "p",
            props: {
              innerText: this.newAlarmText,
            },
          },
          2: {
            type: "button",
            attributes: {
              "data-do": "delete-alarm",
              id: `delete-btn-${this.group}-alarm-${this.alarmTime}`,
            },
            props: { innerText: "x delete this alarm" },
          },
        },
      },
    };
  }
}

// This is not a pure function because it uses a variable that is outside its scope
class GroupCreateArgs {
  1 = {
    attributes: {
      class: "group",
      id: `group-${settings.nextGroup}`,
    },

    childElements: {
      1: {
        type: "p",
        // styles,
        // attributes,
        props: { innerText: `Group ${settings.nextGroup}` },
        // eventHandlers,
        // appendTo:
      },
      2: {
        type: "button",
        // styles,
        attributes: {
          "data-do": "delete-group",
          id: `group-${settings.nextGroup}-delete-btn`,
        },
        props: { innerText: "x delete group" },
        // eventHandlers,
        // appendTo:
      },
      3: {
        type: "p",
        props: { innerText: "Turn group on or off" },
      },
      4: {
        attributes: {
          class: "radio-buttons",
        },
        childElements: {
          1: {
            type: "input",
            attributes: {
              type: "radio",
              id: `group-${settings.nextGroup}-radio-on`,
              name: `active-${settings.nextGroup}`,
              "data-do": "turn-group-on",
              checked: "",
            },
          },
          2: {
            type: "label",
            attributes: {
              for: `group-${settings.nextGroup}-radio-on`,
            },
            props: { innerText: "On" },
          },
          3: {
            type: "input",
            attributes: {
              type: "radio",
              id: `group-${settings.nextGroup}-radio-off`,
              name: `active-${settings.nextGroup}`,
              "data-do": "turn-group-off",
            },
          },
          4: {
            type: "label",
            attributes: {
              for: `group-${settings.nextGroup}-radio-off`,
            },
            props: { innerText: "Off" },
          },
        },
      },
      5: {
        type: "p",
        props: { innerText: "Select active days" },
      },
      6: {
        attributes: { class: "weekDays-selector" },
        childElements: {
          1: {
            type: "input",
            attributes: {
              type: "checkbox",
              id: `group-${settings.nextGroup}-day-sun`,
              class: "weekday",
              "data-do": "toggle-day",
            },
          },
          2: {
            type: "label",
            attributes: {
              for: `group-${settings.nextGroup}-day-sun`,
            },
            props: { innerText: "S" },
          },
          3: {
            type: "input",
            attributes: {
              type: "checkbox",
              id: `group-${settings.nextGroup}-day-mon`,
              class: "weekday",
              "data-do": "toggle-day",
              checked: "",
            },
          },
          4: {
            type: "label",
            attributes: {
              for: `group-${settings.nextGroup}-day-mon`,
            },
            props: { innerText: "M" },
          },
          5: {
            type: "input",
            attributes: {
              type: "checkbox",
              id: `group-${settings.nextGroup}-day-tue`,
              class: "weekday",
              "data-do": "toggle-day",
              checked: "",
            },
          },
          6: {
            type: "label",
            attributes: {
              for: `group-${settings.nextGroup}-day-tue`,
            },
            props: { innerText: "T" },
          },
          7: {
            type: "input",
            attributes: {
              type: "checkbox",
              id: `group-${settings.nextGroup}-day-wed`,
              class: "weekday",
              "data-do": "toggle-day",
              checked: "",
            },
          },
          8: {
            type: "label",
            attributes: {
              for: `group-${settings.nextGroup}-day-wed`,
            },
            props: { innerText: "W" },
          },
          9: {
            type: "input",
            attributes: {
              type: "checkbox",
              id: `group-${settings.nextGroup}-day-thu`,
              class: "weekday",
              "data-do": "toggle-day",
              checked: "",
            },
          },
          10: {
            type: "label",
            attributes: {
              for: `group-${settings.nextGroup}-day-thu`,
            },
            props: { innerText: "T" },
          },
          11: {
            type: "input",
            attributes: {
              type: "checkbox",
              id: `group-${settings.nextGroup}-day-fri`,
              class: "weekday",
              "data-do": "toggle-day",
              checked: "",
            },
          },
          12: {
            type: "label",
            attributes: {
              for: `group-${settings.nextGroup}-day-fri`,
            },
            props: { innerText: "F" },
          },
          13: {
            type: "input",
            attributes: {
              type: "checkbox",
              id: `group-${settings.nextGroup}-day-sat`,
              class: "weekday",
              "data-do": "toggle-day",
            },
          },
          14: {
            type: "label",
            attributes: {
              for: `group-${settings.nextGroup}-day-sat`,
            },
            props: { innerText: "S" },
          },
        },
      },
      7: {
        attributes: {
          class: "alarm-times",
          id: `group-${settings.nextGroup}-alarm-times`,
        },
        childElements: {
          1: {
            type: "h3",
            props: { innerText: "Alarm Times:" },
          },
          2: {
            type: "form",
            attributes: {
              id: `group-${settings.nextGroup}-new-alarm-form`,
            },
            childElements: {
              1: {
                type: "label",
                attributes: {
                  for: `group-${settings.nextGroup}-new-alarm-input`,
                },
                props: { innerText: "Choose a time for your alarm:" },
              },
              2: {
                type: "input",
                attributes: {
                  type: "time",
                  id: `group-${settings.nextGroup}-new-alarm-input`,
                  name: `group-${settings.nextGroup}-new-alarm-input`,
                  "data-do": "add-alarm",
                  required: "",
                },
              },
              3: {
                type: "button",
                attributes: {
                  id: `group-${settings.nextGroup}-add-alarm-btn`,
                  "data-do": "add-alarm",
                },
                props: { innerText: "+ add alarm" },
              },
            },
          },
          3: {
            type: "h2",
            props: { innerText: "No alarms have been set in this group" },
          },
        },
      },
    },
  };
}

// createElementsFromRecipeObject function
const createElementsFromRecipeObject = function (recipeObject, parentElement) {
  for (let key in recipeObject) {
    let createdElement = createElement({
      ...recipeObject[key],
      appendTo: parentElement,
    });
    cl("createdElement is: " + createdElement);
    // if there's a childElements property,
    if (recipeObject[key].childElements) {
      // send it to createElementsFromRecipeObject
      createElementsFromRecipeObject(
        recipeObject[key].childElements,
        // groupNumber,
        createdElement
      );
    }
  }
};

const createElement = function ({
  type,
  styles,
  attributes,
  props,
  eventHandlers,
  appendTo,
}) {
  cl("type is: " + type);
  // TODO resolve whether it's OK to duplicate this code at the createElementsFromRecipeObject level
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

  return element;
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
      // TODO: AM times show up with 0, but pm times don't
      let newAlarmText = "Alarm time: " + convertToAMPM(newAlarmTimeFourChar);
      let newArgs = new AlarmCreateArgs(
        group,
        newAlarmTimeFourChar,
        newAlarmText
      );
      createElementsFromRecipeObject(
        newArgs.provideAlarmCreateArgs(),
        document.getElementById(`${group}-alarm-times`)
      );

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
    cl(evt);
    let group = groupOf(evt.target.id);
  },

  "save-page": function (evt) {
    cl("save page");
  },

  "delete-group": function (evt) {
    cl("delete group");
  },

  "add-group": function (evt) {
    evt.preventDefault();
    cl("add group");
    let group = `group-${settings.nextGroup}`;
    cl("group is: " + group);
    settings.groups = {
      ...settings.groups,
      [group]: {
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
    };
    cl(settings);
    let newArgs = new GroupCreateArgs(); // update groupCreateArgs
    createElementsFromRecipeObject(
      newArgs,
      // group,
      documentBody
    );
    settings.nextGroup++;
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

function pulse() {
  cl("pulse *************************");
  timeToNextAlarm();
}

setInterval(pulse, settings.pulsePeriod * 1000);
