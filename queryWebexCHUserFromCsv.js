const fs = require("fs");
const axios = require("axios");
const parse = require("csv-parse");
const stringify = require("csv-stringify");

const accessToken;
const url = "https://webexapis.com/v1/people";
const headers = {
  Authorization: `Bearer ${accessToken}`,
};

const chUsersCsv = "./aadusers.csv";

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
async function queryWebexCHUserFromCSV(url, headers) {
  try {
    const users = await parseCsv(chUsersCsv);
    for await (const user of users) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      response = await axios.get(`${url}?email=${user.email}`, { headers });
      if (Array.isArray(response.data.items) && !response.data.items.length) {
        console.error(`User ${user.email} not found`);
        user.chResult = "User not found";
      }
      if (Array.isArray(response.data.items) && response.data.items.length) {
        user.chPersonId = response.data.items[0].id;
        user.chEmail = response.data.items[0].emails[0];
        user.chOrgId = response.data.items[0].orgId;
        user.chResult = "Success";
        console.log(`Successfully querried Webex for ${user.email}`);
      }
    }
    writeCsv(users, chUsersCsv);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

queryWebexCHUserFromCSV(url, headers);
