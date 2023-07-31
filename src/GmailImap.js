import createJob from './createJob.js';
import encryptCreds from './encryptCreds.js';


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

export default GmailImap;