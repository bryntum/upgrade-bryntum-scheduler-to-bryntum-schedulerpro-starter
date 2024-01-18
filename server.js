import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";
import mysql from "mysql2/promise";
import path from "path";

dotenv.config();
global.__dirname = path.resolve();

const port = process.env.PORT || 1337;
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(
  express.static(path.join(__dirname, "/node_modules/@bryntum/schedulerpro"))
);
app.use(bodyParser.json());

app.listen(port, () => {
  console.log("Server is running on port " + port + "...");
});

const db = mysql.createPool({
  host: process.env.HOST,
  user: process.env.MYSQL_USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

async function serverConfig() {
  app.get("/load", async (req, res) => {
    try {
      const [
        [resources],
        [events],
        [dependencies],
        [assignments],
        [calendars],
      ] = await Promise.all([
        db.query("SELECT * FROM scheduler_resources"),
        db.query("SELECT * FROM scheduler_events"),
        db.query("SELECT * FROM scheduler_dependencies"),
        db.query("SELECT * FROM scheduler_assignments"),
        db.query("SELECT * FROM scheduler_calendars"),
      ]);

      const calendarsData = calendars.map((calendar) => {
        const calendarObj = {
          id: calendar.id,
          name: calendar.name,
          intervals: calendar.intervals,
        };
        if (calendar?.unspecifiedTimeIsWorking) {
          calendarObj.unspecifiedTimeIsWorking =
            calendar.unspecifiedTimeIsWorking;
        }
        return calendarObj;
      });

      res.send({
        success: true,
        project: {
          calendar: "workweek",
        },
        resources: {
          rows: resources,
        },
        events: {
          rows: events,
        },
        dependencies: {
          rows: dependencies,
        },
        assignments: {
          rows: assignments,
        },
        calendars: {
          rows: calendarsData,
        },
      });
    } catch (error) {
      console.error({ error });
      res.send({
        success: false,
        message:
          "There was an error loading the resources, events, dependencies, and assignments data.",
      });
    }
  });

  app.post("/sync", async function (req, res) {
    const { requestId, resources, events, dependencies, assignments } =
      req.body;

    try {
      const response = { requestId, success: true };
      let eventMapping = {};

      if (resources) {
        const rows = await applyTableChanges("scheduler_resources", resources);
        // if new data to update client
        if (rows) {
          response.resources = { rows };
        }
      }

      if (events) {
        const rows = await applyTableChanges("scheduler_events", events);
        if (rows) {
          if (events?.added) {
            rows.forEach((row) => {
              eventMapping[row.$PhantomId] = row.id;
            });
          }
          response.events = { rows };
        }
      }

      if (assignments) {
        if (events && events?.added) {
          assignments.added.forEach((assignment) => {
            assignment.eventId = eventMapping[assignment.eventId];
          });
        }
        const rows = await applyTableChanges(
          "scheduler_assignments",
          assignments
        );
        if (rows) {
          response.assignments = { rows };
        }
      }

      if (dependencies) {
        const rows = await applyTableChanges(
          "scheduler_dependencies",
          dependencies
        );
        if (rows) {
          response.dependencies = { rows };
        }
      }

      res.send(response);
    } catch (error) {
      console.error({ error });
      res.send({
        requestId,
        success: false,
        message: "There was an error syncing the data.",
      });
    }
  });
}

serverConfig();

async function applyTableChanges(table, changes) {
  let rows;
  if (changes.added) {
    rows = await createOperation(changes.added, table);
  }
  if (changes.removed) {
    await deleteOperation(changes.removed, table);
  }
  if (changes.updated) {
    await updateOperation(changes.updated, table);
  }
  return rows;
}

async function createOperation(added, table) {
  const results = await Promise.all(
    added.map(async (record) => {
      const { $PhantomId, exceptionDates, intervals, segments, ...data } =
        record;

      let insertData;
      if (table === "scheduler_events") {
        insertData = {
          ...data,
          exceptionDates: exceptionDates
            ? JSON.stringify(exceptionDates)
            : null,
          segments: segments ? JSON.stringify(segments) : null,
        };
      }
      if (table === "scheduler_dependencies") {
        insertData = {
          ...data,
          exceptionDates: exceptionDates
            ? JSON.stringify(exceptionDates)
            : null,
        };
      }
      if (table === "scheduler_calendars") {
        insertData = {
          ...data,
          intervals: intervals ? JSON.stringify(intervals) : null,
        };
      }
      if (
        table === "scheduler_resources" ||
        table === "scheduler_assignments"
      ) {
        insertData = data;
      }
      const [result] = await db.query("INSERT INTO ?? set ?", [
        table,
        insertData,
      ]);
      // Return necessary data for client-side update
      return { $PhantomId, id: result.insertId, ...data };
    })
  );
  return results;
}

function deleteOperation(deleted, table) {
  return db.query(
    `DELETE FROM ${table} WHERE id in (?)`,
    deleted.map(({ id }) => id)
  );
}

function updateOperation(updated, table) {
  return Promise.all(
    updated.map(({ id, exceptionDates, segments, intervals, ...data }) => {
      let insertData;
      if (table === "scheduler_events") {
        insertData = {
          ...data,
          exceptionDates: exceptionDates
            ? JSON.stringify(exceptionDates)
            : null,
          segments: segments ? JSON.stringify(segments) : null,
        };
      }
      if (table === "scheduler_dependencies") {
        insertData = {
          ...data,
          exceptionDates: exceptionDates
            ? JSON.stringify(exceptionDates)
            : null,
        };
      }
      if (table === "scheduler_calendars") {
        insertData = {
          ...data,
          intervals: intervals ? JSON.stringify(intervals) : null,
        };
      }
      if (
        table === "scheduler_resources" ||
        table === "scheduler_assignments"
      ) {
        insertData = data;
      }

      return db.query("UPDATE ?? set ? where id = ?", [table, insertData, id]);
    })
  );
}
