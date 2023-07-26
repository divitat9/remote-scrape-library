import express from 'express';
import { ConfidentialClientApplication } from '@azure/msal-node';
import createJob from './createJob.js';
import globals from './globals.js';

class OutlookOAuth {
  constructor(config) {
    this.config = config;
    this.app = express();
    this.pca = new ConfidentialClientApplication(this.config.msalConfig);
  }

  setupRoutes() {
    this.app.get(this.config.authRoute, this.outlookAuthHandler.bind(this));
    this.app.get(this.config.callbackRoute, this.outlookAuthCallbackHandler.bind(this));
  }

  async outlookAuthHandler(req, res) {
    const authCodeUrlParameters = {
      scopes: this.config.scopes,
      redirectUri: this.config.redirectUri,
    };
    try {
      const response = await this.pca.getAuthCodeUrl(authCodeUrlParameters);
      res.redirect(response);
    } catch (error) {
      console.error(error);
      res.status(400).send('An error occurred during the Outlook authentication process.');
    }
  }

  async outlookAuthCallbackHandler(req, res) {
    const tokenRequest = {
      code: req.query.code,
      scopes: this.config.scopes,
      redirectUri: this.config.redirectUri,
    };

    try {
      const response = await this.pca.acquireTokenByCode(tokenRequest);
      globals.setProvider("outlook-oauth");
      globals.setOAuth(response.accessToken);
      await globals.encryptCredential("outlook-oauth");
      await createJob("outlook-oauth");
      res.status(200).json({ message: "Outlook OAuth authentication and job creation successful!" });
    } catch (error) {
      res.status(400).send('Error occurred during Outlook authentication.');
    }
  }

  startServer() {
    this.app.listen(this.config.port, () => {
      console.log(`App listening on port ${this.config.port}`);
    });
  }

  initialize() {
    this.setupRoutes();
    this.startServer();
  }
}

export default OutlookOAuth;
