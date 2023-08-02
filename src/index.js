const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { google } = require('googleapis');
const dotenv = require('dotenv');
const readline = require('readline');

const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config();

app.use(cors());

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

app.get("/", (req, res) => {
  let data = {};
  data["GET"] = req.query;
  res.send(data);
});

app.post("/", (req, res) => {
  console.log("POST request received");
  let data = {};
  data['POST'] = req.body;
  res.send(data);
});

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

async function authorize() {
  try {
    const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('Authorize this app by visiting this URL:', authUrl);

    const code = await askQuestion('Enter the authorization code: ');

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    return oAuth2Client;
  } catch (error) {
    console.error('Error authorizing Google Sheets:', error);
  }
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function connectToGoogleSheets(auth) {
  try {
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = '1g7QscbQ4zt_qYgRoPNnWVeC5iFJCs_IfdN0T09w6fgY';
    const range = 'Sheet1!A1:B5';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values;
    if (values.length) {
      console.log('Spreadsheet data:');
      values.forEach((row) => {
        console.log(row.join('\t'));
      });
    } else {
      console.log('No data found.');
    }
  } catch (error) {
    console.error('Error connecting to Google Sheets:', error);
  }
}

async function run() {
  try {
    const auth = await authorize();
    await connectToGoogleSheets(auth);
  } catch (error) {
    console.error('Error running the application:', error);
  }
}

run();

app.listen(PORT, () => {
  console.log(`API is listening on port ${PORT}`);
});
