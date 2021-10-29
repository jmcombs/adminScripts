const fs = require("fs");
const axios = require("axios");
const parse = require("csv-parse");
const stringify = require("csv-stringify");

const accessToken;
const url = "https://webexapis.com/v1/people";
const headers = {
  Authorization: `Bearer ${accessToken}`,
};

const chUsersCsv = "./deletechusers.csv";

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
async function deleteWebexCHUserFromCSV(url, headers) {
  try {
    const users = await parseCsv(chUsersCsv);
    for await (const user of users) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        getResponse = await axios.get(`${url}?email=${user.chEmail}`, {
          headers,
        });
        if (
          Array.isArray(getResponse.data.items) &&
          !getResponse.data.items.length
        ) {
          console.error(`User ${user.chEmail} not found`);
          user.chResult = "User not found";
        }
        if (
          Array.isArray(getResponse.data.items) &&
          getResponse.data.items.length
        ) {
          user.chPersonId = getResponse.data.items[0].id;
          deleteResponse = await axios.delete(`${url}/${user.chPersonId}`, {
            headers,
          });
          if (deleteResponse.status === 200 || deleteResponse.status === 204) {
            console.log(`User ${user.chEmail} removed`);
            user.chResult = "User removed";
          }
        }
      } catch (error) {
        if (error.response) {
          console.error(
            `Failure: ${error.response.status} ${JSON.stringify(
              error.response.data
            )}`
          );
          user.chResult = `Failure: ${error.response.data} ${JSON.stringify(
            error.response.data
          )}`;
        } else {
          console.error(error);
        }
      }
    }
    writeCsv(users, chUsersCsv);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

deleteWebexCHUserFromCSV(url, headers);
