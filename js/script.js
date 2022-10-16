const documentBody = document.body;
const countdownEl = document.getElementById("countdown");

const context = new AudioContext();

let settings = {
  timeOfNextAlarmToday: false, // false initially and when there's no alarm in the future today
  timeToNextAlarm: 0,
  lastAlarm: {
    // initially, a time in the past
    date: "200000",
    time: "0000",
  },
  pulsePeriod: 1, // seconds; must be less than 60
  // this empty group settings apply is replaced if there are groups stored in Local Storage
  groups: {},
};

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

// delay function is used to create a gap in sound in the makeAlarm function
function delay(duration) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), duration);
  });
}

function makeAlarm() {
  sound(200, 300)
    .then(() => sound(100, 600))
    .then(() => sound(100, 450))
    .then(() => sound(100, 600))
    .then(() => sound(200, 300))
    .then(() => delay(400))
    .then(() => sound(200, 300))
    .then(() => sound(100, 600))
    .then(() => sound(100, 450))
    .then(() => sound(100, 600))
    .then(() => sound(200, 300));
}

// TIME FORMAT CONVERSION FUNCTIONS

// convert,for example, 1803 to 6:03 PM
function convertToAMPM(fourCharTime) {
  let hourString = fourCharTime[0] + fourCharTime[1];
  hour = Number(hourString);
  // AM times
  if (hour < 12) {
    // Midnight
    if (hourString == 0) {
      let ampmTime = "12:" + fourCharTime[2] + fourCharTime[3] + " AM";
      return ampmTime;
      // After midnight
    } else {
      let ampmTime =
        hour.toString() + ":" + fourCharTime[2] + fourCharTime[3] + " AM";
      return ampmTime;
    }
    // PM times
  } else {
    // Reduce hour by 12, except noon hour
    if (hour > 12) {
      hour = hour - 12;
    }
    let ampmTime =
      hour.toString() + ":" + fourCharTime[2] + fourCharTime[3] + " PM";
    return ampmTime;
  }
}

// convert, for example, 18:03 to 1803
function convertToFourCharTime(fiveCharTime) {
  let fourCharTime = fiveCharTime.replace(":", "");
  return fourCharTime;
}

// convert a Date to YYMMDD format
function convertToSixCharDate(date) {
  let year = date.getFullYear();
  let month = date.getMonth();
  let monthTwoChar =
    month + 1 < 10 ? "0" + (month + 1).toString() : (month + 1).toString();
  let day = date.getDay();
  let dayTwoChar = day < 10 ? "0" + day.toString() : day.toString();
  return year.toString().slice(-2) + monthTwoChar + dayTwoChar;
}

// convert a Date to hhmm format
function convertDateToFourCharTime(date) {
  let nowHour = date.getHours();
  let nowMinute = date.getMinutes();
  let hourTwoChar =
    nowHour < 10 ? "0" + nowHour.toString() : nowHour.toString();
  let minuteTwoChar =
    nowMinute < 10 ? "0" + nowMinute.toString() : nowMinute.toString();
  return hourTwoChar + minuteTwoChar;
}

// used to find the group from the id of a clicked element
function groupOf(idString) {
  let secondHyphenIndex = idString.indexOf("-", 6);
  let groupString = idString.slice(0, secondHyphenIndex);
  return groupString;
}

// provides the time to the next alarm as a string; returns a "no alarm" message if there aren't any more alarms this day
function createTimeToNextAlarmString(date, nextAlarm) {
  let nowHour = date.getHours();
  let nowMinute = date.getMinutes();
  let nowSeconds = date.getSeconds();
  // let nextAlarm = settings.timeOfNextAlarmToday;
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

// check whether it is time to make an alarm sound and update timeOfNextAlarmToday string
function checkAlarmTimes() {
  settings.timeOfNextAlarmToday = false; // reset next alarm time

  // get current time and day in format to compare to alarms
  let dN = new Date();
  let nowTimeFourChar = convertDateToFourCharTime(dN);
  let nowDay = dN.getDay();
  nowDay = dayStringAssign[nowDay];

  // initially, alarmToTest is an empty string
  let alarmToTest = "";

  // look for active alarms by checking each alarm group
  for (group in settings.groups) {
    // if the group is active
    if (settings.groups[group].groupActive) {
      // and if the day is active
      if (settings.groups[group].activeDays[nowDay]) {
        // check each alarm in the group
        for (let i = 0; i < settings.groups[group].alarms.length; i++) {
          alarmToTest = settings.groups[group].alarms[i];
          // if the alarm is in the future (the string alarmToTest is alphabetically larger than the four character string for the current time)
          if (alarmToTest > nowTimeFourChar) {
            // check whether the alarm is closer in the future than the current stored time for the next alarm -- if so, update the stored time for the next alarm
            if (
              alarmToTest <
              (settings.timeOfNextAlarmToday
                ? settings.timeOfNextAlarmToday
                : "2401") // if timeOfNextAlarmToday is false, compare to "2401", which will always be true
            ) {
              settings.timeOfNextAlarmToday = alarmToTest;
            }
          } else {
            // if the alarm is not in the future, check whether the alarm should be sounded now
            if (alarmToTest == nowTimeFourChar) {
              let dateNowSixChar = convertToSixCharDate(dN);
              // if the alarm wasn't sounded today during the current minute
              if (
                settings.lastAlarm.date != dateNowSixChar ||
                settings.lastAlarm.time != alarmToTest
              ) {
                // sound the alarm and update settings so that we know the alarm was sounded today during the current minute
                makeAlarm();
                settings.lastAlarm.date = dateNowSixChar;
                settings.lastAlarm.time = alarmToTest;
              }
            }
          }
        }
      }
    }
  }
  // update the countdown timer
  settings.timeToNextAlarm = createTimeToNextAlarmString(dN, alarmToTest);
  countdownEl.innerText = "Time until next alarm: " + settings.timeToNextAlarm;
}

// class for creating arguments for alarm elements
class AlarmCreateArgs {
  constructor(group, alarmTime, newAlarmText, insertBefore) {
    this.group = group;
    this.alarmTime = alarmTime;
    this.newAlarmText = newAlarmText;
    this.insertBefore = insertBefore;
  }
  // the returned object is used as the argument for creating alarm elements in the createElementsFromRecipeObject function
  provideAlarmCreateArgs() {
    return {
      1: {
        attributes: {
          id: `${this.group}-alarm-${this.alarmTime}`,
        },
        insertBefore: this.insertBefore,
        childElements: {
          1: {
            type: "p",
            attributes: { class: "button-after" },
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

// class for creating arguments for group elements
class GroupCreateArgs {
  constructor(group, groupName) {
    this.group = group;
    this.groupName = groupName;
  }
  // the returned object is used as the argument for creating group elements in the createElementsFromRecipeObject function
  // the settings object is separately updated in add-group - edit with caution as they need to match!
  provideGroupCreateArgs() {
    return {
      1: {
        attributes: {
          class: "group",
          id: `${this.group}`,
        },

        childElements: {
          1: {
            type: "h2",
            attributes: { class: "button-after" },
            props: { innerText: this.groupName },
          },
          2: {
            type: "button",
            attributes: {
              "data-do": "delete-group",
              id: `${this.group}-delete-btn`,
            },
            props: { innerText: "x delete group" },
          },
          3: {
            attributes: {
              class: "radio-buttons",
            },
            childElements: {
              1: {
                type: "input",
                attributes: {
                  type: "radio",
                  id: `${this.group}-radio-on`,
                  name: `active-${this.group}`,
                  "data-do": "turn-group-on",
                  checked: "",
                },
              },
              2: {
                type: "label",
                attributes: {
                  for: `${this.group}-radio-on`,
                },
                props: { innerText: "Group On" },
              },
              3: {
                type: "input",
                attributes: {
                  type: "radio",
                  id: `${this.group}-radio-off`,
                  name: `active-${this.group}`,
                  "data-do": "turn-group-off",
                },
              },
              4: {
                type: "label",
                attributes: {
                  for: `${this.group}-radio-off`,
                },
                props: { innerText: "Group Off" },
              },
            },
          },
          4: {
            type: "p",
            props: { innerText: "Select active days" },
          },
          5: {
            attributes: { class: "weekDays-selector" },
            childElements: {
              1: {
                type: "input",
                attributes: {
                  type: "checkbox",
                  id: `${this.group}-day-sun`,
                  class: "weekday",
                  "data-do": "toggle-day",
                },
              },
              2: {
                type: "label",
                attributes: {
                  for: `${this.group}-day-sun`,
                },
                props: { innerText: "S" },
              },
              3: {
                type: "input",
                attributes: {
                  type: "checkbox",
                  id: `${this.group}-day-mon`,
                  class: "weekday",
                  "data-do": "toggle-day",
                  checked: "",
                },
              },
              4: {
                type: "label",
                attributes: {
                  for: `${this.group}-day-mon`,
                },
                props: { innerText: "M" },
              },
              5: {
                type: "input",
                attributes: {
                  type: "checkbox",
                  id: `${this.group}-day-tue`,
                  class: "weekday",
                  "data-do": "toggle-day",
                  checked: "",
                },
              },
              6: {
                type: "label",
                attributes: {
                  for: `${this.group}-day-tue`,
                },
                props: { innerText: "T" },
              },
              7: {
                type: "input",
                attributes: {
                  type: "checkbox",
                  id: `${this.group}-day-wed`,
                  class: "weekday",
                  "data-do": "toggle-day",
                  checked: "",
                },
              },
              8: {
                type: "label",
                attributes: {
                  for: `${this.group}-day-wed`,
                },
                props: { innerText: "W" },
              },
              9: {
                type: "input",
                attributes: {
                  type: "checkbox",
                  id: `${this.group}-day-thu`,
                  class: "weekday",
                  "data-do": "toggle-day",
                  checked: "",
                },
              },
              10: {
                type: "label",
                attributes: {
                  for: `${this.group}-day-thu`,
                },
                props: { innerText: "T" },
              },
              11: {
                type: "input",
                attributes: {
                  type: "checkbox",
                  id: `${this.group}-day-fri`,
                  class: "weekday",
                  "data-do": "toggle-day",
                  checked: "",
                },
              },
              12: {
                type: "label",
                attributes: {
                  for: `${this.group}-day-fri`,
                },
                props: { innerText: "F" },
              },
              13: {
                type: "input",
                attributes: {
                  type: "checkbox",
                  id: `${this.group}-day-sat`,
                  class: "weekday",
                  "data-do": "toggle-day",
                },
              },
              14: {
                type: "label",
                attributes: {
                  for: `${this.group}-day-sat`,
                },
                props: { innerText: "S" },
              },
            },
          },
          6: {
            attributes: {
              class: "alarm-times",
              id: `${this.group}-alarm-times`,
            },
            childElements: {
              1: {
                type: "h2",
                attributes: {
                  id: `${this.group}-alarm-times-text`,
                },
                props: { innerText: "No alarms have been set in this group" },
              },
              2: {
                type: "form",
                attributes: {
                  id: `${this.group}-new-alarm-form`,
                },
                childElements: {
                  1: {
                    type: "label",
                    attributes: {
                      for: `${this.group}-new-alarm-input`,
                    },
                    props: { innerText: "Choose a time for your alarm:" },
                  },
                  2: {
                    type: "input",
                    attributes: {
                      type: "time",
                      id: `${this.group}-new-alarm-input`,
                      name: `${this.group}-new-alarm-input`,
                      "data-do": "add-alarm",
                      required: "",
                    },
                  },
                  3: {
                    type: "button",
                    attributes: {
                      id: `${this.group}-add-alarm-btn`,
                      "data-do": "add-alarm",
                    },
                    props: { innerText: "+ add alarm" },
                  },
                },
              },
            },
          },
        },
      },
    };
  }
}

// creates a new alarm group in the DOM
function addGroup(group, nameInput) {
  // create an object describing the group elements we want to create
  let newArgs = new GroupCreateArgs(group, nameInput);
  // pass this object to the function that creates new elements in the DOM, along with the element under which the new elements should be placed
  createElementsFromRecipeObject(
    newArgs.provideGroupCreateArgs(),
    document.getElementById("groups")
  );
}

// creates elements in the DOM using 1) a recipe object that is passed in as an argument which describes the elements to be created, and 2) the parent element to which the new elements should be appended
const createElementsFromRecipeObject = function (recipeObject, parentElement) {
  for (let key in recipeObject) {
    let createdElement = createElement({
      ...recipeObject[key],
      appendTo: parentElement,
    });
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

// creates a single element which is described by the properties of an object that is passed as an argument
const createElement = function ({
  type,
  styles,
  attributes,
  props,
  eventHandlers,
  appendTo,
  insertBefore,
}) {
  // use default values for any properties that aren't defined in the argument object
  let elementType = type || "div";
  let elementStyles = styles || {};
  let elementAttributes = attributes || {};
  let elementProps = props || {};
  let elementEventHandlers = eventHandlers || {};
  let elementAppendTo = appendTo || "body";
  let elementInsertBefore = insertBefore || null;

  // create new element
  let element = document.createElement(elementType);
  // customize as needed
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
  // append it to the appropriate location in the DOM
  elementAppendTo.insertBefore(element, elementInsertBefore);

  // return the element as it may need to be used as a parent element
  return element;
};

// the values of proceedWith are functions which are run if the key of the property is the data-do class of an element that is clicked by the user; for example, if the user clicks an element that has a data-do class that is "add-alarm", the function with the "add-alarm" property is run; see the handleClick function
const proceedWith = {
  // we need the user to interact with the page to active the AudioContext -- otherwise the page can't make a sound; this function is intended to be run when the page is initially opened
  "activate-sound": function (evt) {
    // make a sound for the user
    makeAlarm();
    // change the style of the button
    document
      .getElementById("activate-alarms-btn")
      .setAttribute("class", "dormant");
    // update the text of the button
    document.getElementById("activate-alarms-btn").innerText =
      "AudioContext started; if you did not hear alarm, check speakers and click here again to test";
  },

  // add an alarm
  "add-alarm": function (evt) {
    evt.preventDefault();
    // get the group name and time input
    let group = groupOf(evt.target.id);
    let timeInput = document.getElementById(`${group}-new-alarm-input`);
    let newAlarmTimeFiveChar = timeInput.value;
    // if a time is provided, convert it to four character format and add it to the appropriate group in the settings object
    if (newAlarmTimeFiveChar) {
      let newAlarmTimeFourChar = convertToFourCharTime(newAlarmTimeFiveChar);
      settings.groups[group].alarms.push(newAlarmTimeFourChar);
      // sort the alarms from earliest to latest times
      settings.groups[group].alarms.sort((a, b) => a - b);
      // determine the index which the new alarm should appear before (if any)
      let followingSiblingIndex =
        settings.groups[group].alarms.indexOf(newAlarmTimeFourChar) + 2;
      // find the element which the new alarm should appear before (if any)
      let insertBefore = document.getElementById(`${group}-alarm-times`)
        .children[followingSiblingIndex];
      // create text for the new alarm
      let newAlarmText = "Alarm time: " + convertToAMPM(newAlarmTimeFourChar);
      // create an object describing the alarm elements we want to create
      let newArgs = new AlarmCreateArgs(
        group,
        newAlarmTimeFourChar,
        newAlarmText,
        insertBefore
      );
      // pass this object to the function that creates new elements in the DOM, along with the element under which the new elements should be placed
      createElementsFromRecipeObject(
        newArgs.provideAlarmCreateArgs(),
        document.getElementById(`${group}-alarm-times`)
      );

      // if there were previously no alarms, we need to update the text
      document.getElementById(`${group}-alarm-times-text`).innerText =
        "Alarm Times:";
      // reset the alarm time input form
      document.getElementById(`${group}-new-alarm-form`).reset();
    }

    // update Local Storage
    localStorage.setItem("groups", JSON.stringify(settings.groups));

    // update the page
    checkAlarmTimes();
  },

  // add a group
  "add-group": function (evt) {
    evt.preventDefault();
    // create a unique group number by incrementing the highest current group number
    let nextGroup = Object.keys(settings.groups).sort((a, b) => a - b);
    nextGroup = nextGroup.length ? Number(nextGroup.pop().slice(6)) + 1 : 1;
    nextGroup.toString();
    let group = `group-${nextGroup}`;
    // get the user's desired name for the group
    let nameInput =
      document.getElementById("new-group-name-input").value || "Unnamed Group";
    // add a group to the DOM using the unique group number and the user's desired name
    addGroup(group, nameInput);
    // update the settings object to reflect the new group
    settings.groups = {
      ...settings.groups,
      [group]: {
        // note that these properties are separately created in GroupCreateArgs - they need to match!
        name: nameInput,
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
    console.log(settings);
    // update Local Storage
    localStorage.setItem("groups", JSON.stringify(settings.groups));
    // reset the add group input form
    document.getElementById("add-group-form").reset();
  },

  // this runs if the user clicks on an element that does not have a data-do class
  "data-do-is-null": function (evt) {
    console.log(
      "There is nothing to do for this click location, but run checkAlarmTimes anyway."
    );
    checkAlarmTimes();
  },

  // delete an alarm time
  "delete-alarm": function (evt) {
    // get the group and time of the clicked delete alarm button
    let alarmDivId = evt.target.id.slice(11);
    let group = groupOf(alarmDivId);
    let alarmTime = alarmDivId.slice(-4);
    // delete the alarm from the approprate group in the setting object
    let alarmsArray = settings.groups[group].alarms;
    alarmsArray.splice(alarmsArray.indexOf(alarmTime), 1);
    // if there are no alarms left in the group, update the alarm times text
    if (!alarmsArray.length) {
      document.getElementById(`${group}-alarm-times-text`).innerText =
        "No alarms have been set in this group";
    }
    // remove the alarm element from the DOM
    document.getElementById(alarmDivId).remove();
    // update Local Storage
    localStorage.setItem("groups", JSON.stringify(settings.groups));
    // update the page
    checkAlarmTimes();
  },

  // delete a group
  "delete-group": function (evt) {
    // get the group from the event
    let groupDivId = evt.target.id.slice(0, -11);
    // remove the group from the DOM
    document.getElementById(groupDivId).remove();
    // remove the group from the settings object
    delete settings.groups[groupDivId];
    // update Local Storage
    localStorage.setItem("groups", JSON.stringify(settings.groups));
    // update the page
    checkAlarmTimes();
  },

  "toggle-day": function (evt) {
    let group = groupOf(evt.target.id);
    let day = evt.target.id.slice(-3);
    settings.groups[group].activeDays[day] = evt.target.checked;
    localStorage.setItem("groups", JSON.stringify(settings.groups));
    checkAlarmTimes();
  },

  "turn-group-off": function (evt) {
    let group = groupOf(evt.target.id);
    if (evt.target.checked) {
      settings.groups[group].groupActive = false;
    }
    localStorage.setItem("groups", JSON.stringify(settings.groups));
    checkAlarmTimes();
  },

  "turn-group-on": function (evt) {
    let group = groupOf(evt.target.id);
    if (evt.target.checked) {
      settings.groups[group].groupActive = true;
    }
    localStorage.setItem("groups", JSON.stringify(settings.groups));
    checkAlarmTimes();
  },
};

function handleClick(evt) {
  console.log("data-do is: " + evt.target.getAttribute("data-do"));
  let functionToDo = evt.target.getAttribute("data-do") || "data-do-is-null";
  proceedWith[functionToDo](evt);
}

function pulse() {
  checkAlarmTimes();
}

documentBody.addEventListener("click", function (evt) {
  handleClick(evt);
});

// get local storage data
let groups = JSON.parse(localStorage.getItem("groups"));
// rehydrate DOM
// - create groups
// -- for each group
if (groups) {
  for (let groupNumber in groups) {
    // --- get group ("group-#") and nameInput
    let nameInput = groups[groupNumber].name;
    // --- send these to addGroup
    addGroup(groupNumber, nameInput);
    if (!groups[groupNumber].groupActive) {
      let offRadioBtn = document.getElementById(`${groupNumber}-radio-off`);
      offRadioBtn.checked = true;
    }
    for (index in dayStringAssign) {
      let dayActiveStatus =
        groups[groupNumber].activeDays[dayStringAssign[index]];
      let dayCheckbox = document.getElementById(
        `${groupNumber}-day-${dayStringAssign[index]}`
      );
      if (dayActiveStatus) {
        dayCheckbox.checked = true;
      } else {
        dayCheckbox.checked = false;
      }
    }
    // --- create alarms within groups
    if (groups[groupNumber].alarms.length) {
      for (let alarm of groups[groupNumber].alarms) {
        let newAlarmText = "Alarm time: " + convertToAMPM(alarm);

        let newArgs = new AlarmCreateArgs(
          groupNumber,
          alarm,
          newAlarmText,
          null
        );
        createElementsFromRecipeObject(
          newArgs.provideAlarmCreateArgs(),
          document.getElementById(`${groupNumber}-alarm-times`)
        );

        document.getElementById(`${groupNumber}-alarm-times-text`).innerText =
          "Alarm Times:";
      }
    }
  }
  settings.groups = groups;
}

setInterval(pulse, settings.pulsePeriod * 1000);
