# Upgrade from Bryntum Scheduler to Bryntum Scheduler Pro guide: starter repository

## Set up a MySQL database locally

First set up a MySQL database locally by installing MySQL Server and MySQL Workbench. MySQL Workbench is a MySQL GUI that we'll use to create a database with tables for the Scheduler data and to run queries. Download MySQL Server and MySQL Workbench from the MySQL community downloads page. If you're using Windows, you can use the MySQL Installer to download the MySQL products. Use the default configurations when configuring MySQL Server and Workbench. Make sure that you configure the MySQL Server to start at system startup for convenience.

Open the MySQL Workbench desktop application. Open the local instance of the MySQL Server that you configured.

We'll write our MySQL queries in the query tab and execute the queries by pressing the yellow lightning bolt button.

## Create a MySQL database for the Bryntum Scheduler data: Adding tables and example data

Let's run some MySQL queries in MySQL Workbench to create, use, and populate a database for our Bryntum Scheduler. Execute the following query to create a database called `bryntum_scheduler_pro`:


```sql
CREATE DATABASE bryntum_scheduler_pro;
```

Run the following query so that we set our newly created database for use:

```sql
USE bryntum_scheduler_pro;
```

Let's create the three tables that we'll use for our Bryntum Scheduler data: `scheduler_resources`, `scheduler_events`, and `scheduler_dependencies`:

```sql
create TABLE `scheduler_resources`
(
    `id`         int          NOT NULL AUTO_INCREMENT,
    `name`       varchar(255) NOT NULL,
    `eventColor` varchar(255) DEFAULT NULL,
    `role`       varchar(255) NOT NULL,
    `iconCls`    varchar(255) DEFAULT NULL,
    `image`      boolean      DEFAULT FALSE,
    PRIMARY KEY (`id`)
);
```

```sql
create TABLE `scheduler_events`
(
    `id`             int          NOT NULL AUTO_INCREMENT,
    `name`           varchar(255) NOT NULL,
    `patient`        varchar(255) NOT NULL,
    `requiredRole`   varchar(255) NOT NULL,
    `confirmed`      boolean               DEFAULT FALSE,
    `readOnly`       boolean               DEFAULT FALSE,
    `resourceId`     int                   DEFAULT NULL,
    `timeZone`       varchar(255)          DEFAULT NULL,
    `draggable`      boolean               DEFAULT TRUE,
    `resizable`      varchar(255)          DEFAULT null,
    `children`       varchar(255)          DEFAULT null,
    `allDay`         boolean               DEFAULT FALSE,
    `duration`       float(11, 2) unsigned DEFAULT NULL,
    `durationUnit`   varchar(255)          DEFAULT 'hour',
    `startDate`      datetime              DEFAULT NULL,
    `endDate`        datetime              DEFAULT NULL,
    `exceptionDates` json                  DEFAULT null,
    `recurrenceRule` varchar(255)          DEFAULT null,
    `cls`            varchar(255)          DEFAULT null,
    `eventColor`     varchar(255)          DEFAULT null,
    `eventStyle`     varchar(255)          DEFAULT null,
    `iconCls`        varchar(255)          DEFAULT null,
    `style`          varchar(255)          DEFAULT null,
    CONSTRAINT `fk_scheduler_events_resourceId` FOREIGN KEY (`resourceId`) REFERENCES `scheduler_resources` (`id`) ON DELETE CASCADE,
    INDEX (`resourceId`),
    PRIMARY KEY (`id`)
);
```

```sql
create TABLE  `scheduler_dependencies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `from` int DEFAULT NULL,
  `to` int DEFAULT NULL,
   `fromEvent` int DEFAULT NULL,
   `toEvent` int DEFAULT NULL,
  `fromSide` varchar(10) DEFAULT 'right',
  `toSide` varchar(10) DEFAULT 'left',
  `type` int DEFAULT NULL,
  `cls` varchar(255) DEFAULT NULL,
  `lag` float DEFAULT 0,
  `lagUnit` varchar(255) DEFAULT 'hour',
  `exceptionDates` json  DEFAULT null,
  PRIMARY KEY (`id`),
  INDEX (`from`),
  CONSTRAINT `fk_scheduler_dependencies_from_event` FOREIGN KEY (`from`) REFERENCES `scheduler_events`(`id`) ON DELETE CASCADE,
  INDEX (`to`),
  CONSTRAINT `fk_scheduler_dependencies_to_event` FOREIGN KEY (`to`) REFERENCES `scheduler_events`(`id`) ON DELETE CASCADE
);
```

Now let's add some example resources data to the `scheduler_resources` table:

```sql
INSERT INTO `scheduler_resources` (id, name, role, iconCls, image)
VALUES (1, 'Lucy', 'Technician', 'b-icon b-fa-user', false),
       (2, 'Monique', 'Nurse', 'b-icon b-fa-user-nurse', false),
       (3, 'Jan', 'Doctor', 'b-icon b-fa-user-md', false),
       (4, 'Wendy', 'Nurse', 'b-icon b-fa-user-nurse', false),
       (5, 'Ronelle', 'Doctor', 'b-icon b-fa-user-md', false),
       (6, 'Liam', 'Technician', 'b-icon b-fa-user', false);
```

Add some example events data to the `scheduler_events` table:

```sql
INSERT INTO `scheduler_events` (id, name, patient, requiredRole, confirmed, duration, startDate, resourceId, iconCls)
VALUES (1, 'X-ray', 'Sarah Larson', 'Technician', true, 1, '2024-01-29T09:00', 1, 'b-fa b-fa-radiation'),
       (2, 'Doctor''s appointment', 'Sarah Jones', 'Doctor', false, 1, '2024-01-29T11:00', 3, 'b-fa b-fa-hospital'),
       (3, 'Annual checkup', 'Steven Marks', 'Nurse', false, 1.5, '2024-01-29T10:30', 2, 'b-fa b-fa-stethoscope'),
       (4, 'Vaccine shot', 'Kevin Rous', 'Nurse', true, 1, '2024-01-29T13:00', 2, 'b-fa b-fa-syringe'),
       (5, 'Knee surgery recovery assessment', 'James Newland', 'Doctor', true, 1.5, '2024-01-29T09:00', 5, 'b-fa b-fa-stethoscope'),
       (6, 'Surgery', 'Frank Villano', 'Doctor', true, 2, '2024-01-29T13:30', 3, 'b-fa b-fa-hospital'),
       (7, 'Travel vaccination', 'Peter Hammond', 'Nurse', true, 1, '2024-01-29T09:00', 2, 'b-fa b-fa-syringe'),
       (8, 'Flu vaccination', 'John Ellington', 'Nurse', true, 0.5, '2024-01-29T16:00', 4, 'b-fa b-fa-syringe'),
       (9, 'X-ray', 'Macy Lewis', 'Technician', true, 1, '2024-01-29T11:00', 6, 'b-fa b-fa-radiation'),
       (10, 'Checkup', 'Janine Davis', 'Nurse', false, 1, '2024-01-29T09:00', 4, 'b-fa b-fa-stethoscope'),
       (11, 'Checkup', 'Anthony Fantano', 'Nurse', true, 1, '2024-01-29T12:30', 4, 'b-fa b-fa-stethoscope'),
       (12, 'Checkup', 'Robert Killarney', 'Nurse', true, 1, '2024-01-29T14:00', 4, 'b-fa b-fa-stethoscope'),
       (13, 'Surgery', 'Paulo Santos', 'Doctor', true, 3, '2024-01-29T12:00', 5, 'b-fa b-fa-hospital');
```

Now add some example dependencies data to the `scheduler_dependencies` table:

```sql
INSERT INTO `scheduler_dependencies` (id, `from`, `to`)
VALUES (1, 1, 2);
```

## Install the dependencies and add the MySQL database connection details

Install the dependencies by running the following command:

```bash
npm install
```

In the `server.js` file, the Express server uses the MySQL2 library to connect to MySQL and run queries.

The `serverConfig` function runs when the server is started. It connects to the MySQL database. It also has some helper functions that are used for CRUD operations.

Now create a `.env` file in the root folder and add the following lines for connecting to your MySQL database:

```
HOST=localhost
PORT=1337
MYSQL_USER=root
PASSWORD=your-password
DATABASE=bryntum_scheduler_pro
```

Don't forget to add the root password for your MySQL server.

## Install the Bryntum Scheduler

Install the Bryntum Scheduler by following [step 1](https://bryntum.com/products/scheduler/docs/guide/Scheduler/quick-start/javascript-npm#access-to-npm-registry) and [step 4](https://bryntum.com/products/scheduler/docs/guide/Scheduler/quick-start/javascript-npm#install-component) of the [Getting Started with Bryntum Scheduler in JavaScript with npm package manager guide](https://bryntum.com/products/scheduler/docs/guide/Scheduler/quick-start/javascript-npm).

The HTML, CSS, and JavaScript file in the public folder contains the code for our client-side Bryntum Scheduler.

Run the local dev server by running the following command:

```bash
npm start
```

You'll see a Bryntum Scheduler with 13 events when you visit http://localhost:1337. The scheduler will have full CRUD functionality.
