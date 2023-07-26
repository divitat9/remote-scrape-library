import createJob from './createJob.js';
import globals from './globals.js';

class GmailImap {
  constructor(config) {
    this.config = config;
  }

  async initialize() {
    const { email, password } = this.config;

    globals.setProvider("gmail-imap");
    globals.setImap(email + ":" + password);

    try {
      await globals.encryptCredential("gmail-imap");
      await createJob("gmail-imap");

      // Return 200 to indicate success
      return 200;
    } catch (error) {
      console.error("Error occurred during Google IMAP authentication and job creation: ", error);
      
      // Return 400 to indicate error
      return 400;
    }
  }
}

export default GmailImap;