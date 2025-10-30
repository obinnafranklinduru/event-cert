const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./eventcerts.db", (err) => {
  if (err) {
    return console.error("Error opening database:", err.message);
  }
  console.log("Connected to the SQLite database.");
});

// SQL statement to create the table
const createTableSql = `
  CREATE TABLE IF NOT EXISTS mints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaignId INTEGER NOT NULL,
    attendeeAddress TEXT NOT NULL,
    transactionHash TEXT NOT NULL,
    mintedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- This ensures a user can only mint once per campaign
    UNIQUE(campaignId, attendeeAddress) 
  )
`;

const dbModel = new Promise((resolve, reject) => {
  db.run(createTableSql, (err) => {
    if (err) {
      console.error("Error creating table:", err.message);
      return reject(err);
    }
    console.log("Table 'mints' is ready.");
    // Resolve the promise *with* the db object
    resolve(db);
  });
});

module.exports = dbModel;
