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

If you are creating a server-side application, you can create a Outlook auth flow similar to this:

```javascript
class OutlookOAuth {
  constructor(app, config) {
    this.config = config;
    this.app = app;
    this.cca = new ConfidentialClientApplication(this.config.msalConfig);
    this.success_url = this.config.success_url;
  }

  setupRoutes() {
    this.app.get(this.config.authRoute, this.outlookAuthHandler.bind(this));
    this.app.get(this.config.callbackRoute, this.outlookAuthCallbackHandler.bind(this));
  }

  // Route handler for Outlook that redirects user to auth URL generated with CCA
  async outlookAuthHandler(req, res) {
    const authCodeUrlParameters = {
      scopes: this.config.scopes,
      redirectUri: this.config.redirectUri,
    };
    try {
      const response = await this.cca.getAuthCodeUrl(authCodeUrlParameters);
      res.redirect(response);
    } catch (error) {
      console.error(error);
      res.status(400).send('An error occurred during the Outlook authentication process.');
    }
  }

  // Callback handler for successful Outlook authentication
  async outlookAuthCallbackHandler(req, res) {
    const tokenRequest = {
      code: req.query.code,
      scopes: this.config.scopes,
      redirectUri: this.config.redirectUri,
    };

    try {
      const response = await this.cca.acquireTokenByCode(tokenRequest);
      const credential = await encryptCreds(response.accessToken);
      await createJob("outlook-oauth", credential);
      res.redirect(this.success_url);
    } catch (error) {
      res.status(400).send('Error occurred during Outlook authentication.');
    }
  }
}
```

Then, you can kick off a remote scrape job like this:
```javascript
import OutlookOAuth from './OutlookOAuth.js';

const outlookOAuthConfig = {
  authRoute: '/outlook-auth',
  callbackRoute: '/outlook-auth/callback',
  scopes: ['user.read'],
  redirectUri: 'http://localhost:3000/outlook-auth/callback',
  msalConfig: msalConfig,
  port: port, 
  success_url: success_url,
};

const outlookOAuth = new OutlookOAuth(app, outlookOAuthConfig);
outlookOAuth.setupRoutes();
```

If you are working on a browser side application, you can set up a script tag like this once you get the access token, and utilize the BlinkReceiptJS.js file:
```html
<script>
    function onLoad() {
        if (BlinkReceiptJS.hasValidCredential()) {
            BlinkReceiptJS.queueNewJob(userId);
        } else {
            //prompt user to give credentials
        }
    }
    function onUserEnterIMAPCredentials(appPassword) {
        BlinkReceiptJS.appPassword = appPassword;
        BlinkReceiptJS.queueNewJob(userId);
    }
    function onUserEnterOauthCredentials(accessToken, expDate) {
        BlinkReceiptJS.accessToken = accessToken;
        BlinkReceiptJS.expDate = expDate;
        BlinkReceiptJS.queueNewJob(userId);
    }
</script>
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

If you are creating a server-side application, you can create a Google auth flow similar to this:
```javascript
class GmailOAuth {
  constructor(app, config) {
    this.config = config;
    this.app = app;
    this.oauth2Client = new google.auth.OAuth2(
      this.config.client_id,
      this.config.client_secret,
      this.config.redirect_uris
    );
    this.success_url = this.config.success_url;
  }

  setupRoutes() {
    this.app.get(this.config.authRoute, this.googleAuthHandler.bind(this));
    this.app.get(this.config.callbackRoute, this.googleAuthCallbackHandler.bind(this));
  }

  // Route handler that redirects user to Google auth URL generated with OAuth2 client
  googleAuthHandler(req, res) {
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.config.scope
    });
    res.redirect(url);
  }

  // Callback handler for successful Google authentication
  async googleAuthCallbackHandler(req, res) {
    const { code } = req.query;
    try {
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
  
        const credential = await encryptCreds(tokens.access_token);
        await createJob("gmail-oauth", credential);
  
        res.redirect(this.success_url);
      } catch (error) {
        res.status(400).send({ error: 'Authentication failed. Please try again.' });
      }
  }
}
```

Then, you can kick off a remote scrape job like this:

```javascript
import GmailOAuth from './GmailOAuth.js';
const data = fs.readFileSync(path/to/key.json);
const parsedData = JSON.parse(data);
const clientId = parsedData.web.client_id;
const clientSecret = parsedData.web.client_secret;
const redirectUri = parsedData.web.redirect_uris[0];

const scopesgoogle = [
  'https://mail.google.com/'
];

const googleOAuthConfig = {
  authRoute: '/google-auth',
  callbackRoute: '/google-auth/callback',
  scope: scopesgoogle,
  client_id: clientId,
  client_secret: clientSecret,
  redirect_uris: redirectUri,
  port: port,
  success_url: success_url,
};

const gmailOAuth = new GmailOAuth(app, googleOAuthConfig);
gmailOAuth.setupRoutes(); 
```

If you are working on a browser side application, you can set up a script tag like this once you get the access token, and utilize the BlinkReceiptJS.js file:
```html
<script>
    function onLoad() {
        if (BlinkReceiptJS.hasValidCredential()) {
            BlinkReceiptJS.queueNewJob(userId);
        } else {
            //prompt user to give credentials
        }
    }
    function onUserEnterIMAPCredentials(appPassword) {
        BlinkReceiptJS.appPassword = appPassword;
        BlinkReceiptJS.queueNewJob(userId);
    }
    function onUserEnterOauthCredentials(accessToken, expDate) {
        BlinkReceiptJS.accessToken = accessToken;
        BlinkReceiptJS.expDate = expDate;
        BlinkReceiptJS.queueNewJob(userId);
    }
</script>
```


## Setting Up Your Google IMAP Login

Have users enable 2-Step verification at [Google's 2-Step Verification page](https://myaccount.google.com/signinoptions/two-step-verification/enroll-welcome) and generate a 16 digit app password at [Google's App Passwords page](https://myaccount.google.com/apppasswords). 

If you are creating a server-side application, you can create a IMAP flow like this:

```javascript
class GmailImap {
  constructor(config) {
    this.config = config;
  }

  async initialize() {
    const { email, password } = this.config;

    try {
      const credential = await encryptCreds(email + ":" + password);
      await createJob("gmail-imap", credential);

      // Return 200 to indicate success
      return 200;
    } catch (error) {
      console.error("Error occurred during Google IMAP authentication and job creation: ", error);
      
      // Return 400 to indicate error
      return 400;
    }
  }
}
```

And pass in collected user email and app password:
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

If you are working on a browser side application, you can set up a script tag like this once you get the email and password, and utilize the BlinkReceiptJS.js file:
```html
<script>
    function onLoad() {
        if (BlinkReceiptJS.hasValidCredential()) {
            BlinkReceiptJS.queueNewJob(userId);
        } else {
            //prompt user to give credentials
        }
    }
    function onUserEnterIMAPCredentials(appPassword) {
        BlinkReceiptJS.appPassword = appPassword;
        BlinkReceiptJS.queueNewJob(userId);
    }
    function onUserEnterOauthCredentials(accessToken, expDate) {
        BlinkReceiptJS.accessToken = accessToken;
        BlinkReceiptJS.expDate = expDate;
        BlinkReceiptJS.queueNewJob(userId);
    }
</script>
```