import { EventModel } from "../scheduler.module.js";

export default class MyEventModel extends EventModel {
  static get fields() {
    return [
      { name: "durationUnit", defaultValue: "hour" },
      { name: "patient", type: "string" },
      { name: "requiredRole", type: "string" },
      { name: "confirmed", type: "boolean" },
    ];
  }
}
