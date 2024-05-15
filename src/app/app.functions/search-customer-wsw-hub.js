/* ----------  PACKAGES ---------- */
const axios = require('axios');
const https = require('https');
/* ++++++++++  PACKAGES ++++++++++ */

/* ----------  CONSTANTS ---------- */
const WSW_HUB_BASE_URL = 'https://wswdischub.wsw.de/api';
/* ++++++++++  CONSTANTS ++++++++++ */

/* ---------- FUNCTIONS ---------- */
function encodeCredentials(username, password) {
  const credentials = `${username}:${password}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');
  return encodedCredentials;
}

async function searchWswHubCustomers(companyName) {
  // -TEST
  // companyName = 'auer';
  // +TEST
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `${WSW_HUB_BASE_URL}/v1/customers/customersearch?searchvalue=${companyName}`,
    headers: { 
      'Authorization': `Basic ${encodeCredentials(process.env.WSW_HUB_BASIC_AUTH_USERNAME,process.env.WSW_HUB_BASIC_AUTH_PASSWORD)}`
    }    
  };
  // add httpsAgent to ignore error "Unable to verify the first certificate"
  config['httpsAgent'] = new https.Agent({rejectUnauthorized: false})
  
  try {
    let responseSearchCustomers = await axios.request(config);
    console.log(JSON.stringify(responseSearchCustomers.data.length));
    return responseSearchCustomers.data
  } catch(error) {
    throw new Error(error);
  }

}
/* ++++++++++ FUNCTIONS ++++++++++ */

exports.main = async (context = {}) => {
  const { companyId, companyName } = context.parameters;
  let responseType = 'SUCCESS';
  let responseBody = 'Successfully run customer search in WSW Hub.';

  try {
    if (! companyName || companyName.length == 0) {
      return { message: 'Invalid Input! Input can not be empty.', statusCode: 400 };
    }
    // make wsw hub call 
    let resultSearchWswHubCompanies = await searchWswHubCustomers(companyName);
    return {
      message: `Successfully executed the serverless function (search-customer-wsw-hub).`, 
      body: resultSearchWswHubCompanies,
      statusCode: 200
    }
  } catch (error) {
    let message = `There was an error executing the serverless function (search-customer-wsw-hub): ${error.message}`
    return { message, statusCode: 400 };
  }

};
