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
  express.static(path.join(__dirname, "/node_modules/@bryntum/scheduler"))
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
  // Scheduler
  app.get("/load", async (req, res) => {
    try {
      const [[resources], [events], [dependencies]] = await Promise.all([
        db.query("SELECT * FROM scheduler_resources"),
        db.query("SELECT * FROM scheduler_events"),
        db.query("SELECT * FROM scheduler_dependencies"),
      ]);
      res.send({
        success: true,
        resources: {
          rows: resources,
        },
        events: {
          rows: events,
        },
        dependencies: {
          rows: dependencies,
        },
      });
    } catch (error) {
      console.error({ error });
      res.send({
        success: false,
        message:
          "There was an error loading the resources, events, and dependencies data.",
      });
    }
  });

  app.post("/sync", async function (req, res) {
    const { requestId, resources, events, dependencies } = req.body;
    try {
      const response = { requestId, success: true };
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
          response.events = { rows };
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

function createOperation(added, table) {
  return Promise.all(
    added.map(async (record) => {
      const { $PhantomId, exceptionDates, ...data } = record;
      const [result] = await db.query("INSERT INTO ?? set ?", [
        table,
        table === "resources" || table === "dependencies"
          ? data
          : {
              ...data,
              exceptionDates: JSON.stringify(exceptionDates),
            },
      ]);
      // report to the client that we changed the record identifier
      return { $PhantomId, id: result.insertId };
    })
  );
}

function deleteOperation(deleted, table) {
  return db.query(
    `DELETE FROM ${table} WHERE id in (?)`,
    deleted.map(({ id }) => id)
  );
}

function updateOperation(updated, table) {
  return Promise.all(
    updated.map(({ id, exceptionDates, ...data }) => {
      return db.query("UPDATE ?? set ? where id = ?", [
        table,
        table === "resources" || table === "dependencies"
          ? data
          : {
              ...data,
              exceptionDates: JSON.stringify(exceptionDates),
            },
        id,
      ]);
    })
  );
}
