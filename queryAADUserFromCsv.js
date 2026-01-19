const fs = require("fs");
const axios = require("axios");
const { parse } = require("csv-parse");
const { stringify } = require("csv-stringify");

// To obtain Graph API Access Token run `Get-AzAccessToken -ResourceTypeName MSGraph` from `Az` PowerShell Module
const accessToken = "";
const url = "https://graph.microsoft.com/v1.0/users";
const headers = {
  Authorization: `Bearer ${accessToken}`,
  ConsistencyLevel: "eventual",
};

const aadUsersCsv = "./aadusers.csv";
const aadUserDataCsv = "./userdata.csv";

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
async function queryAADUserFromCSV(url, headers) {
  try {
    const users = await parseCsv(aadUsersCsv);
    let usersData = [];
    for await (const user of users) {
      try {
        const params = {
          $filter: `(userPrincipalName eq '${user.email}') OR (mail eq '${user.email}') OR (proxyAddresses/any(x:x eq 'smtp:${user.email}'))`,
          $select:
            "id,userprincipalname,accountenabled,givenname,surname,displayname,mail,officeLocation,streetAddress,city,state,postalCode,country",
        };
        response = await axios.get(url, {
          params,
          headers,
        });
        if (
          Array.isArray(response.data?.value) &&
          !response.data.value.length
        ) {
          console.error(`User ${user.email} not found`);
          user.aadResult = "User not found";
        } else {
          user.aadId = response.data.value[0].id;
          user.aadResult = "Sucess";
          let userData = {
            id: response.data.value[0].id,
            userPrincipalName: response.data.value[0].userPrincipalName,
            accountEnabled: response.data.value[0].accountEnabled,
            givenName: response.data.value[0].givenName,
            surname: response.data.value[0].surname,
            displayName: response.data.value[0].displayName,
            mail: response.data.value[0].mail,
            officeLocation: response.data.value[0].officeLocation,
            streetAddress: response.data.value[0].streetAddress,
            city: response.data.value[0].city,
            state: response.data.value[0].state,
            postalCode: response.data.value[0].postalCode,
            country: response.data.value[0].country,
            // Custom: Adding CH Email and CH Org to AAD Data
            "Control Hub Email": user.chEmail,
            "Control Hub Person ID": user.chPersonId,
            "Control Hub Org": user.chOrg,
          };
          if (userData.accountEnabled === true) {
            userData.accountEnabled = "TRUE";
          }
          if (userData.accountEnabled === false) {
            userData.accountEnabled = "FALSE";
          }
          console.log(`Successfully querried Azure AD for ${user.email}`);
          usersData.push(userData);
        }
      } catch (error) {
        if (error.response.status === 404) {
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
    writeCsv(usersData, aadUserDataCsv);
    writeCsv(users, aadUsersCsv);
    console.log("Successfuly ran 'queryAADUserFromCSV'");
  } catch (error) {
    console.log(error);
    throw error;
  }
}

queryAADUserFromCSV(url, headers);
