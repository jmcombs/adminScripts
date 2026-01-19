const fs = require("fs");
const axios = require("axios");
const { parse } = require("csv-parse");
const { stringify } = require("csv-stringify");

const accessToken;
const url = "https://webexapis.com/v1/people";
const headers = {
  Authorization: `Bearer ${accessToken}`,
};

const chUsersCsv = "./chUserData.csv";

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
        getResponse = await axios.get(`${url}/${user.id}\?callingData=true`, {
          headers,
        });
        let chUser = getResponse.data;
        if (user.locationId) {
          chUser.licenses = [
            "Y2lzY29zcGFyazovL3VzL0xJQ0VOU0UvZTcyODdmMGMtNDQ4My00ZjM4LWEzMzctZTY4OGMwMGEyOWM0OkVFX2QxMWY3NTdlLTU1MDQtNDE1YS05OGEyLTAzNmVmMjZjYjcwY19keW5hbWl4LndlYmV4LmNvbQ",
            "Y2lzY29zcGFyazovL3VzL0xJQ0VOU0UvZTcyODdmMGMtNDQ4My00ZjM4LWEzMzctZTY4OGMwMGEyOWM0Ok1TXzFhZDAxZTgzLWY1M2ItNDgyYy1iN2ZkLTYzZDY0NmEwMDE0Ng",
            "Y2lzY29zcGFyazovL3VzL0xJQ0VOU0UvZTcyODdmMGMtNDQ4My00ZjM4LWEzMzctZTY4OGMwMGEyOWM0OkJDU1REXzYxNjY2Y2VkLTYxZTEtNGE1NS05ZWFhLWYwOGZkNDE0M2MxNg",
            "Y2lzY29zcGFyazovL3VzL0xJQ0VOU0UvZTcyODdmMGMtNDQ4My00ZjM4LWEzMzctZTY4OGMwMGEyOWM0OkZUQ19hMjQ3MzgyOC1hOTgwLTQ3MmYtODE5ZC02YjljY2UwOGU5MmI",
            "Y2lzY29zcGFyazovL3VzL0xJQ0VOU0UvZTcyODdmMGMtNDQ4My00ZjM4LWEzMzctZTY4OGMwMGEyOWM0OkNFXzEyM2UzNTY2LTVlMDYtNGJmMy04NDQ5LTFhYjUxYTFkMWNlMw",
            "Y2lzY29zcGFyazovL3VzL0xJQ0VOU0UvZTcyODdmMGMtNDQ4My00ZjM4LWEzMzctZTY4OGMwMGEyOWM0OkZNU185ZWNhNzgxNC0zMzEzLTQ2NGYtOTY0Mi0wMjM5ODc1YmM5Zjg",
            "Y2lzY29zcGFyazovL3VzL0xJQ0VOU0UvZTcyODdmMGMtNDQ4My00ZjM4LWEzMzctZTY4OGMwMGEyOWM0OkZTU18xYjcyOGZmOS03ZGU4LTRjYjctOTU0MC0yOTMyMGI1YTQyY2I",
          ];
        } else {
          chUser.licenses = [
            "Y2lzY29zcGFyazovL3VzL0xJQ0VOU0UvZTcyODdmMGMtNDQ4My00ZjM4LWEzMzctZTY4OGMwMGEyOWM0OkVFX2QxMWY3NTdlLTU1MDQtNDE1YS05OGEyLTAzNmVmMjZjYjcwY19keW5hbWl4LndlYmV4LmNvbQ",
            "Y2lzY29zcGFyazovL3VzL0xJQ0VOU0UvZTcyODdmMGMtNDQ4My00ZjM4LWEzMzctZTY4OGMwMGEyOWM0Ok1TXzFhZDAxZTgzLWY1M2ItNDgyYy1iN2ZkLTYzZDY0NmEwMDE0Ng",
            "Y2lzY29zcGFyazovL3VzL0xJQ0VOU0UvZTcyODdmMGMtNDQ4My00ZjM4LWEzMzctZTY4OGMwMGEyOWM0OkZUQ19hMjQ3MzgyOC1hOTgwLTQ3MmYtODE5ZC02YjljY2UwOGU5MmI",
            "Y2lzY29zcGFyazovL3VzL0xJQ0VOU0UvZTcyODdmMGMtNDQ4My00ZjM4LWEzMzctZTY4OGMwMGEyOWM0OkNFXzEyM2UzNTY2LTVlMDYtNGJmMy04NDQ5LTFhYjUxYTFkMWNlMw",
            "Y2lzY29zcGFyazovL3VzL0xJQ0VOU0UvZTcyODdmMGMtNDQ4My00ZjM4LWEzMzctZTY4OGMwMGEyOWM0OkZNU185ZWNhNzgxNC0zMzEzLTQ2NGYtOTY0Mi0wMjM5ODc1YmM5Zjg",
            "Y2lzY29zcGFyazovL3VzL0xJQ0VOU0UvZTcyODdmMGMtNDQ4My00ZjM4LWEzMzctZTY4OGMwMGEyOWM0OkZTU18xYjcyOGZmOS03ZGU4LTRjYjctOTU0MC0yOTMyMGI1YTQyY2I",
          ];
        }
        putResponse = await axios.put(
          `${url}/${user.id}\?callingData=true`,
          chUser,
          {
            headers,
          }
        );
        if (putResponse.status === 200) {
          console.log(`User ${chUser.displayName} successfully updated`);
          user.chUpdateLicenseResult = "Success";
        }
      } catch (error) {
        if (error.response.status === 404) {
          console.error(`User ${user.chEmail} not found`);
          user.chUpdateLicenseResult = "User not found";
        }
        console.error(
          `Other Failure: ${error.response.status} ${JSON.stringify(
            error.response.data
          )}`
        );
        user.chUpdateLicenseResult = `Other failure: ${
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
