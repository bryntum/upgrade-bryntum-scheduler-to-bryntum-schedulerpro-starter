import MyEventModel from "./lib/eventModel.js";
import { CrudManager, DateHelper, Scheduler, StringHelper } from "./scheduler.module.js";


const terminalHideDelay = 300,
  terminalShowDelay = 100;

const crudManager = new CrudManager({
  eventStore: {
    modelClass: MyEventModel,
  },
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
});

const scheduler = new Scheduler({
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
    eventEdit: {
      editorConfig: {
        title: "Edit appointment",
        autoUpdateRecord: true,
      },
      // Customize its contents
      items: {
        patientField: {
          type: "text",
          name: "patient",
          label: "Patient",
          // Place after name field
          weight: 150,
          required: true,
        },
        durationField: {
          type: "duration",
          name: "duration",
          label: "Duration",
          unit: "hour",
          min: 0,
          weight: 160,
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
        confirmedField: {
          type: "checkbox",
          name: "confirmed",
          label: "Appointment confirmed?",
          cls: "confirmedField",
        },
      },
    },
    filterBar: true,
  },
  crudManager,
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
});
