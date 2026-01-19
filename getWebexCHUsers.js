const fs = require("fs");
const axios = require("axios");
const parse = require("parse-link-header");
const { stringify } = require("csv-stringify");

const orgId;
const accessToken;
const url = "https://webexapis.com/v1/people?callingData=true";
const headers = {
  Authorization: `Bearer ${accessToken}`,
};
const params = {
  orgId,
  max: 50,
};

let orgUserData = [];

async function getCHUserList(url, headers, params) {
  try {
    response = await axios.get(url, { headers, params });
    response.data.items.map((user) => {
      orgUser = {
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        email: user.emails[0],
        id: user.id,
        locationId: "",
      };
      if (user.locationId) {
        orgUser.locationId = user.locationId;
      }
      orgUserData.push(orgUser);
    });
    let parsed = parse(response.headers.link);
    if (parsed) {
      params.cursor = parsed.next.cursor;
      await new Promise((resolve) => setTimeout(resolve, 500));
      return getCHUserList(url, headers, params);
    }
    if (!parsed) {
      stringify(orgUserData, { header: true }, (err, output) => {
        fs.writeFile("chUserData.csv", output, "utf8", (err) => {
          if (err) {
            console.error(err);
          }
        });
      });
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

getCHUserList(url, headers, params);
