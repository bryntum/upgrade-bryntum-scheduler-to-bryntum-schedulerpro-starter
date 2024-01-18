import {
  DateHelper,
  EventModel,
  StringHelper,
} from "../schedulerpro.module.js";

// A custom task class with a few extra fields
export default class TaskWithCalendar extends EventModel {
  static get fields() {
    return [
      "patient",
      "confirmed",
      "requiredRole",
      // override field defaultValue to hours
      { name: "durationUnit", defaultValue: "h" },
    ];
  }

  get firstCalendarInterval() {
    return this.calendar?.intervalStore.first;
  }

  get calendarInfo() {
    const { calendar, firstCalendarInterval } = this;

    if (firstCalendarInterval.isRecurrent()) {
      return StringHelper.encodeHtml(calendar.name);
    }
    return `${DateHelper.format(
      firstCalendarInterval.startDate,
      "MMM Do"
    )} - ${DateHelper.format(this.firstCalendarInterval.endDate, "MMM Do")}`;
  }
}

TaskWithCalendar.initClass();
