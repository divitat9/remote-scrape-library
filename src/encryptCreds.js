import fs from 'fs';
import { default as wasm, encrypt, init_panic_hook} from './encryption.mjs';

async function encryptCreds (credential) {
    //Function to encrypt credentials using the encryption wasm module

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

    return encryptedCredential;
}

export default encryptCreds;
