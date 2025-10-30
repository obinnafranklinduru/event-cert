const dbModel = require("../config/db");

/**
 * Finds the mint transaction hash from the database for a given user and campaign.
 *
 * @param {string} attendeeAddress The user's wallet address.
 * @param {string | number} campaignId The campaign ID to check.
 * @returns {Promise<string|null>} The transaction hash if found, otherwise null.
 */
async function findExistingMint(attendeeAddress, campaignId) {
  const db = await dbModel;

  return new Promise((resolve, reject) => {
    const sql = `SELECT transactionHash FROM mints WHERE attendeeAddress = ? AND campaignId = ?`;

    console.log(
      `Querying DB for existing mint: User ${attendeeAddress}, Campaign ${campaignId}`
    );

    // db.get finds the first matching row
    db.get(sql, [attendeeAddress, campaignId], (err, row) => {
      if (err) {
        console.error("Error querying database:", err.message);
        return reject(new Error("Failed to query database."));
      }

      if (row) {
        console.log(`Found matching mint in DB. Hash: ${row.transactionHash}`);
        resolve(row.transactionHash);
      } else {
        // No match
        console.log("No matching mint found in DB.");
        resolve(null);
      }
    });
  });
}

module.exports = findExistingMint;
