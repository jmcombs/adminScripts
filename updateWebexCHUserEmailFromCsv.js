const fs = require("fs");
const axios = require("axios");
const parse = require("csv-parse");
const stringify = require("csv-stringify");

const accessToken;
const url = "https://webexapis.com/v1/people";
const headers = {
  Authorization: `Bearer ${accessToken}`,
};

const chUsersCsv = "./chusers.csv";

async function parseCsv(csvFile) {
  let records = [];
  const parser = fs
    .createReadStream(csvFile)
    .pipe(parse({ delimiter: ",", columns: true }));
  for await (const record of parser) {
    records.push(record);
  }
  return records;
}
async function writeCsv(csvData, csvFile) {
  stringify(csvData, { header: true }, (err, output) => {
    fs.writeFile(csvFile, output, "utf8", (err) => {
      if (err) {
        console.error(err);
      }
    });
  });
}
async function updateWebexCHUserEmailFromCSV(url, headers) {
  try {
    const users = await parseCsv(chUsersCsv);
    for await (const user of users) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        getResponse = await axios.get(`${url}/${user.chPersonId}`, {
          headers,
        });
        let chUser = getResponse.data;
        chUser.emails[0] = user.chUpdatedEmail;
        putResponse = await axios.put(`${url}/${user.chPersonId}`, chUser, {
          headers,
        });
        if (putResponse.status === 200) {
          console.log(`User ${chUser.displayName} successfully updated`);
          user.chUpdateEmailResult = "Success";
        }
      } catch (error) {
        if (error.response.status == 404) {
          console.error(`User ${user.chEmail} not found`);
          user.chUpdateEmailResult = "User not found";
        }
        console.error(
          `Other Failure: ${error.response.status} ${JSON.stringify(
            error.response.data
          )}`
        );
        user.chUpdateEmailResult = `Other failure: ${
          error.response.status
        } ${JSON.stringify(error.response.data)}`;
      }
    }
    writeCsv(users, chUsersCsv);
  } catch (error) {
    throw error;
  }
}

updateWebexCHUserEmailFromCSV(url, headers);
