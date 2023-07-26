import express from 'express';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import createJob from './createJob.js';
import globals from './globals.js';

class GmailOAuth {
  constructor(config) {
    this.config = config;
    const rawCredentials = fs.readFileSync(path.resolve(this.config.credentialsPath));
    const credentials = JSON.parse(rawCredentials);
    this.app = express();
    this.oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uris[0]
    );
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
  
        globals.setProvider("gmail-oauth");
        globals.setGAuth(tokens.access_token);
        await globals.encryptCredential("gmail-oauth");
  
        await createJob("gmail-oauth");
  
        res.status(200).json({ message: "Google OAuth authentication and job creation successful!"});
      } catch (error) {
        res.status(400).send({ error: 'Authentication failed. Please try again.' });
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

export default GmailOAuth;
