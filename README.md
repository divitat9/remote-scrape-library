# Remote Scrape Library
This is a JavaScript module designed to simplify the process of accessing and extracting email data from multiple service providers, including Google (Gmail) and Microsoft (Outlook). It handles the authentication (both OAuth and IMAP), encryption, and scraping process. 


## Setting Up Your Microsoft Outlook App for Outlook OAuth Logins

Follow this tutorial: [Quickstart: Register an application with the Microsoft identity platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

Here are some important pointers on certain input values as you follow the tutorial:
- **Name:** Enter your Company/App Name.
- **Sign-In Audience:** Choose "Accounts in any organizational directory and personal Microsoft accounts".
- **Redirect URIs:** Add the necessary URIs. Make sure each follows the [respective platform guideline](https://learn.microsoft.com/en-us/azure/active-directory/develop/reply-url). Here are 2 that we added for our demo:
    - http://localhost:3000/outlookauth (Platform: Web)
    - http://localhost:3000/outlook-auth/callback (Platform: Web)
- **Configure platforms:** Select "Web" in the web application section.
- **Credentials:** Create a Client Secret, and use the “Value”, not “Secret ID”.

Next, add a **Scope** for user permission:
- For example, we used 'user.read'
- Add a client application for “Authorized client applications”. Enter the client ID and check off the scope you just created.

Ensure that all settings are consistent in the [Manifest file](https://learn.microsoft.com/en-us/azure/active-directory/develop/reference-app-manifest?WT.mc_id=Portal-Microsoft_AAD_RegisteredApps).

Update the following in .env file based on your own values (make sure you are using Client Secret Value):
```javascript
CLOUD_INSTANCE=https://login.microsoftonline.com/
TENANT_ID = xxx
CLIENT_ID = xxx
CLIENT_SECRET = xxx
REDIRECT_URI=xxx
POST_LOGOUT_REDIRECT_URI=xxx
```

Additionally, add the Microblink API Token into your .env file:
```javascript
API_TOKEN = xxx
```

Now, you can run the remote scrape by creating an outlookOAuth config object like so:

```javascript
import OutlookOAuth from './OutlookOAuth.js';
const outlookOAuth = new OutlookOAuth({
  port: 3000,
  msalConfig: {
    auth: {
      clientId: process.env.CLIENT_ID,
      authority: 'https://login.microsoftonline.com/common',
      clientSecret: process.env.CLIENT_SECRET,
    },
    system: {
      loggerOptions: {
        loggerCallback(loglevel, message, containsPii) {
          console.log(message);
        },
        piiLoggingEnabled: false,
        logLevel: 'Info',
      },
    },
  },
  scopes: ['user.read'],
  redirectUri: 'http://localhost:3000/outlook-auth/callback',
  authRoute: '/outlook-auth',
  callbackRoute: '/outlook-auth/callback',
});
```


## Setting Up Your Google App for Gmail OAuth Logins

Follow these steps: [Using OAuth 2.0 to Access Google APIs](https://support.google.com/cloud/answer/6158849)

- **Create a New Project:**<br>
    - **Project name:** Enter your app's name.<br>
    - **Location:** Choose 'No organization'.
- **Enable APIs & Services:**<br>
    - Enable the Gmail API by clicking 'ENABLE APIS AND SERVICES' and searching for it.
- **Credentials:**<br>
    - Click on OAuth 2.0 Client IDs.<br>
    - Create a Client Secret and enable it.<br> 
    - Set Redirect URI: for example, our demo app used http://localhost:3000/google-auth/callback<br>
    - Set Type: Web application
- **OAuth consent screen:**<br>
    - Make sure your redirect URIs were added to authorized domains (Note: The domains of the URIs you add should be automatically added to your OAuth consent screen as authorized domains).<br>
    - Set "Publishing Status" to "In production".<br>
    - Set "User type" to "External".

After the credentials are created, you will see your new OAuth 2.0 client ID. Click on the download button next to it to download the `key.json` file. Save it in the same directory as your code or specify the appropriate path.

Next, choose which **Scope** you will use for user permission:
- For instance, we used 'https://www.googleapis.com/auth/gmail.readonly'
A full list can be found [here](https://developers.google.com/identity/protocols/oauth2/scopes). 

 Now, you can run the remote scrape by creating a googleOAuth object like so:

```javascript
import GmailOAuth from './GmailOAuth.js';

const gmailOAuth = new GmailOAuth({
     port: 3000,
     authRoute: '/my-google-auth',
     callbackRoute: '/my-google-auth/callback',
     credentialsPath: '/path/to/key.json',
     scope: ['https://www.googleapis.com/auth/gmail.readonly']
  });
  
gmailOAuth.initialize();
```

## Setting Up Your Google IMAP Login

Have users enable 2-Step verification at [Google's 2-Step Verification page](https://myaccount.google.com/signinoptions/two-step-verification/enroll-welcome) and generate a 16 digit app password at [Google's App Passwords page](https://myaccount.google.com/apppasswords). 

Collect the user's email and app password and pass it into the GmailImap object like so:

```javascript

import GmailImap from './GmailImap.js';

(async function() {
  const gmailImap = new GmailImap({
    email: 'user@gmail.com',
    password: 'app-password'
  });

  const result = await gmailImap.initialize();

  if (result === 200) {
    console.log('Google IMAP authentication and job creation successful!');
  } else {
    console.log('Error occurred during Google IMAP authentication and job creation.');
  }
})();
```