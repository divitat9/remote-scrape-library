import fetch from 'node-fetch';

async function createJob(provider, credential) {
  try {
    const apiToken = process.env.API_TOKEN;
    const encryptedCreds = credential;

    const response = await fetch('https://scan.blinkreceipt.com/ereceipts/create_job', {
      method: 'POST',
      headers: {
        'api-key': apiToken,
        'uid': 1,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'credentials': encryptedCreds,
        'provider': provider
      })
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const responseData = await response.json();
    console.log(responseData);
  } catch (error) {
    console.error(error);
  }
}

export default createJob;
