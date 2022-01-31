const fs = require("fs");
const axios = require("axios");
const parse = require("csv-parse");
const stringify = require("csv-stringify");

// To obtain Graph API Access Token run `Get-AzAccessToken -ResourceTypeName MSGraph` from `Az` PowerShell Module
const accessToken;
const url = "https://graph.microsoft.com/v1.0/groups";
const headers = {
  Authorization: `Bearer ${accessToken}`,
};

const aadUsersCsv = "./aadusers.csv";
const aadGroupName = "CTP-SG-CiscoWebex-Cloud-Collab";
let aadGroupInfo;

async function parseCsv(csvFile) {
  let records = [];
  const readStream = fs.createReadStream(csvFile);
  const parser = readStream.pipe(parse({ delimiter: ",", columns: true }));
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
async function addAADUserToGroupFromCsv(url, headers) {
  try {
    const users = await parseCsv(aadUsersCsv);
    const params = {
      $filter: `displayName eq '${aadGroupName}'`,
      $select: "id,displayName,description",
    };
    getResponse = await axios.get(url, {
      params,
      headers,
    });
    aadGroupInfo = {
      id: getResponse.data.value[0].id,
      displayName: getResponse.data.value[0].displayName,
      description: getResponse.data.value[0].description,
    };
    for await (const user of users) {
      try {
        const postUrl = `${url}/${aadGroupInfo.id}/members/$ref`;
        const postData = {
          "@odata.id": `https://graph.microsoft.com/v1.0/users/${user.aadId}`,
        };
        postResponse = await axios.post(postUrl, postData, {
          headers,
        });
        if (postResponse.status === 204) {
          user.aadGroupResult = "Sucess";
          console.log(
            `Successfully added ${user.email} to ${aadGroupInfo.displayName}`
          );
        }
      } catch (error) {
        if (error.response.status === 400) {
          console.error(
            `User ${user.email} is already a member of ${aadGroupInfo.displayName}`
          );
          user.aadResult = "User is already a member of Security Group";
        } else if (error.response.status === 404) {
          console.error(`User ${user.email} not found`);
          user.aadResult = "User not found";
        } else {
          console.error(
            `Other Failure: ${error.response.status} ${JSON.stringify(
              error.response.data
            )}`
          );
          user.aadResult = `Other failure: ${
            error.response.status
          } ${JSON.stringify(error.response.data)}`;
        }
      }
    }
    writeCsv(users, aadUsersCsv);
    console.log("Successfuly ran 'addAADUserToGroupFromCsv'");
  } catch (error) {
    console.log(error);
    throw error;
  }
}

addAADUserToGroupFromCsv(url, headers);
