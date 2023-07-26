import fs from 'fs';
import { default as wasm, encrypt, init_panic_hook} from './encryption.mjs';
import store from 'store2';

//Centralized module for managing, storing, and encrypting email credentials.
const globals = {
  provider: '',
  googleimapcred: '',
  googleauthcred: '',
  outlookauthcred: '',

  setProvider(newProvider) {
    if (newProvider === 'gmail-imap' || newProvider === 'outlook-oauth' || newProvider === 'gmail-oauth') {
      this.provider = newProvider;
      console.log("Provider Name:" + this.provider);
    } else {
      console.error('Invalid provider value');
    }
  },

  getProvider() {
    return this.provider;
  },

  setImap(newimapcred) {
    this.googleimapcred = newimapcred;
    console.log("Unencrypted Credential:" + this.googleimapcred);
  },

  setGAuth(newgauthcred) {
    this.googleauthcred = newgauthcred;
    console.log("Unencrypted Credential:" + this.googleauthcred);
  },

  setOAuth(newoauthcred) {
    this.outlookauthcred = newoauthcred;
    console.log("Unencrypted Credential:" + this.outlookauthcred);
  },

  encryptCredential: async function (providerType) {
    //Function to encrypt credentials using the encryption wasm module, requires input of provider type
    let credential;

    //Checking for validity of provider
    if (providerType === 'gmail-imap') {
      credential = this.googleimapcred;
    } else if (providerType === 'gmail-oauth') {
      credential = this.googleauthcred;
    } else if (providerType === 'outlook-oauth') {
      credential = this.outlookauthcred;
    } else {
      console.error('Invalid credential type');
      return;
    }

    //Navigating to wasm module in file structure
    const currentModulePath = new URL(import.meta.url).pathname;
    const currentDirectory = currentModulePath.substring(
      0,
      currentModulePath.lastIndexOf('/')
    );
    const wasmPath = `${currentDirectory}/encryption_bg.wasm`;
    
    //Reading wasm module for data
    const data = fs.readFileSync(wasmPath);
    await wasm(data);

    //Initialize a panic hook to handle runtime errors/panic conditions in Rust encryption file
    init_panic_hook();

    //Encrypt the credentials using the encrypt function from the wasm module
    const hexCred = encrypt(credential);
    console.log('Hex credential:', hexCred);
    const encryptedCredential = Buffer.from(hexCred, 'hex').toString('base64');
    console.log('Encrypted credential:', encryptedCredential);

    //Store the encrypted credential in local storage using the store2 library
    store.set('encryptedCredential', encryptedCredential);

    return encryptedCredential;
  },

  getEncryptedCredential() {
    //If a encrypted credential already exists in local storage, return that
    if (store.has('encryptedCredential')) {
      return store.get('encryptedCredential');
    } else {
      return null;
    }
  }
};

export default globals;