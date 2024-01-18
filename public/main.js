import TaskWithCalendar from "./lib/TaskWithCalendar.js";
import {
  DateHelper,
  SchedulerPro,
  StringHelper,
} from "./schedulerpro.module.js";

const terminalHideDelay = 300,
  terminalShowDelay = 100;

function getAvailableResources(eventRecord) {
  return scheduler.resourceStore.query(
    (resourceRecord) =>
      resourceRecord.role === eventRecord.requiredRole ||
      !eventRecord.requiredRole
  );
}

const scheduler = new SchedulerPro({
  appendTo: document.body,
  startDate: new Date(2024, 0, 29, 8),
  endDate: new Date(2024, 0, 29, 16),
  rowHeight: 80,
  barMargin: 10,
  allowOverlap: false,
  tickSize: 100,
  timeResolution: {
    unit: "min",
    increment: 30,
  },
  snap: true,
  viewPreset: {
    base: "hourAndDay",
    headers: [
      {
        unit: "d",
        align: "center",
        dateFormat: "LL",
      },
      {
        unit: "h",
        align: "center",
        dateFormat: "h A",
      },
    ],
  },
  features: {
    stripe: true,
    eventBuffer: true,
    calendarHighlight: {
      calendar: "event",
      // This method should return the available resources for one or more events
      collectAvailableResources({ eventRecords }) {
        return getAvailableResources(eventRecords[0]);
      },
    },
    eventDrag: {
      // This method is used to validate drag drop operations
      validatorFn({ eventRecords, newResource, startDate, endDate }) {
        const task = eventRecords[0],
          { calendar } = task,
          valid =
            (!calendar || calendar.isWorkingTime(startDate, endDate, true)) &&
            getAvailableResources(task).includes(newResource),
          message = valid ? "" : "No available slot";

        return {
          valid,
          message:
            (valid ? "" : '<i class="b-icon b-fa-exclamation-triangle"></i>') +
            message,
        };
      },
      // Affect snapping on drag, making events snap to the vertical center of each resource
      snapToPosition({ resourceRecord, eventRecord, snapTo }) {
        if (scheduler.snap) {
          const row = scheduler.getRowFor(resourceRecord);
          if (row) {
            const eventElement =
                scheduler.getElementFromEventRecord(eventRecord),
              eventHeight = eventElement.offsetHeight,
              rowCenter = row.top + row.height / 2,
              distanceFromCenter = Math.abs(
                snapTo.y + eventHeight / 2 - rowCenter
              );

            if (distanceFromCenter < 15) {
              snapTo.y = rowCenter - eventHeight / 2;
            }
          }
        }
      },
    },
    dependencies: {
      // Makes dependency lines easier to click
      clickWidth: 5,
      // Round the corners of the dependency lines
      radius: 10,
      // How far in px from the edge of the event bar to place the terminals
      // (negative numbers are further away from the bar, positive further inside)
      terminalOffset: 0,
      // Size of dependency terminals in px
      terminalSize: 12,
      // Time to wait after mouse enters an event bar, before showing the terminals
      // (using a short delay, to make UI feel less "jumpy" when moving mouse over multiple events)
      terminalShowDelay,
      // Time to wait before hiding a terminal after mouse leaves the event bar / terminal.
      // Lets us use an animation for the hide operation
      terminalHideDelay,
    },
    dependencyEdit: {
      showLagField: false,
    },
    eventTooltip: {
      // A custom HTML template shown in a tooltip when events are hovered
      template: ({ eventRecord }) => `<dl>
        <dt>${StringHelper.encodeHtml(eventRecord.name)}</dt>
        <dd>
          <i class="b-icon b-fa-user"></i>${StringHelper.encodeHtml(
            eventRecord.resource.name
          )}
        </dd>
        <dt>Scheduled at:</dt>
        <dd>
            <i class="b-icon b-fa-calendar-alt"></i>${DateHelper.format(
              eventRecord.startDate,
              "LST"
            )} - ${DateHelper.format(eventRecord.endDate, "LST")}
          </dd>
          ${
            eventRecord.calendar
              ? `
          <dt>Schedule info:</dt>
          <dd>
              <i class="b-icon b-fa-calendar-alt"></i>${StringHelper.encodeHtml(
                eventRecord.calendarInfo
              )}
          </dd>`
              : ""
          }
      </dl>`,
    },
    taskEdit: {
      items: {
        generalTab: {
          items: {
            resourcesField: {
              required: true,
            },
            patientField: {
              type: "text",
              name: "patient",
              label: "Patient",
              // Place after name field
              weight: 150,
              required: true,
            },
            requiredRoleField: {
              type: "combo",
              name: "requiredRole",
              label: "Required role",
              weight: 170,
              items: ["Doctor", "Nurse", "Technician"],
              labelCls: "label-text-wrap",
              required: true,
            },

            preambleField: {
              name: "preamble",
              label: "Travel to",
              unit: "h",
            },
            postambleField: {
              name: "postamble",
              label: "Travel from",
              unit: "h",
            },
            confirmedField: {
              type: "checkbox",
              name: "confirmed",
              label: "Appointment confirmed?",
              cls: "confirmedField",
              weight: 700,
            },
          },
        },
      },
    },
    filterBar: true,
  },
  project: {
    calendar: "workweek",
    eventModelClass: TaskWithCalendar,
    // Configure urls used by the built-in CrudManager
    transport: {
      load: {
        url: "http://localhost:1337/load",
      },
      sync: {
        url: "http://localhost:1337/sync",
      },
    },
    autoLoad: true,
    autoSync: true,
    // This config enables response validation and dumping of found errors to the browser console.
    // It's meant to be used as a development stage helper only so please set it to false for production systems.
    validateResponse: true,
  },
  // This controls the contents of each event bar. You can return JSON (a DOMConfig object) or a simple HTML string
  eventRenderer({ eventRecord }) {
    return [
      {
        children: [
          {
            class: "b-event-name",
            text: eventRecord.name,
          },
          {
            class: "b-patient",
            text: `Patient: ${eventRecord.patient || ""}`,
          },
        ],
      },
      eventRecord.confirmed
        ? {
            tag: "i",
            class: "b-icon b-fa-check",
          }
        : null,
    ];
  },

  columns: [
    {
      type: "resourceInfo",
      text: "Doctor",
      width: 150,
      filterable: {
        filterField: {
          triggers: {
            search: {
              cls: "b-icon b-fa-filter",
            },
          },
          placeholder: "Filter staff",
        },
      },
    },
    {
      text: "Role",
      field: "role",
      editor: false,
      width: 150,
    },
  ],
  listeners: {
    eventSelectionChange() {
      const { selectedEvents } = this,
        { calendarHighlight } = this.features;

      if (!calendarHighlight.disabled && selectedEvents.length > 0) {
        calendarHighlight.highlightEventCalendars(selectedEvents);
      } else {
        calendarHighlight.unhighlightCalendars();
      }
    },
  },
});
