import { encrypt } from './encryption.mjs';

let appPassword = null;
let accessToken = null;
let expDate = null;
let providerType = null;

async function hasValidCredential() {
    if (providerType === 'gmail-imap') {
        return appPassword !== null;
    } else if (providerType === 'gmail-oauth' || providerType === 'outlook-oauth') {
        return accessToken !== null && expDate > new Date();
    }
    return false;
}

async function queueNewJob(userId) {
    if (!(await hasValidCredential())) {
        throw new Error('Invalid credentials.');
    }

    let credential = providerType === 'gmail-imap' ? appPassword : accessToken;
    let encrypted = await encryptCreds(credential);
    await createJob(encrypted, userId);
}

function setIMAPCredentials(_appPassword) {
    appPassword = _appPassword;
    providerType = 'gmail-imap';
}

function setOAuthCredentials(_accessToken, _expDate, _providerType) {
    accessToken = _accessToken;
    expDate = new Date(_expDate);
    providerType = _providerType; // should be either 'gmail-oauth' or 'outlook-oauth'
}

export {
    hasValidCredential,
    queueNewJob,
    setIMAPCredentials,
    setOAuthCredentials,
};
