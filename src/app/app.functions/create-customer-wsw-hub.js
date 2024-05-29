/* ----------  PACKAGES ---------- */
const axios = require('axios');
const { create } = require('domain');
const https = require('https');
/* ++++++++++  PACKAGES ++++++++++ */

/* ----------  CONSTANTS ---------- */
const WSW_HUB_BASE_URL = 'https://wswdischub.wsw.de/api';
const WSW_NEW_CUSTOMER_ID_PROPERTY_INTERNAL_VALUE = 'CustomerIDCreated';
/* ++++++++++  CONSTANTS ++++++++++ */

/* ---------- FUNCTIONS ---------- */
function encodeCredentials(username, password) {
  const credentials = `${username}:${password}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');
  return encodedCredentials;
}

async function createWswHubCustomer(createBody) {
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${WSW_HUB_BASE_URL}/v1/customers/customercreate`,
    headers: {
      'Content-Type': 'application/json',  
      'Authorization': `Basic ${encodeCredentials(process.env.WSW_HUB_BASIC_AUTH_USERNAME,process.env.WSW_HUB_BASIC_AUTH_PASSWORD)}`
    },
    data: createBody  
  };
  // add httpsAgent to ignore error "Unable to verify the first certificate"
  config['httpsAgent'] = new https.Agent({rejectUnauthorized: false})
  
  try {
    let responseCreateCustomer = await axios.request(config);
    console.log('Response create wsw customer: ' + JSON.stringify(responseCreateCustomer.data));
    return responseCreateCustomer.data
  } catch(error) {
    throw new Error(error);
  }

}
/* ++++++++++ FUNCTIONS ++++++++++ */

exports.main = async (context = {}) => {
  const { wswHubCustomerCreateProperties, wswHubParentCustomerCreateProperties } = context.parameters;
  try {
    // make wsw hub call create customer
    console.log('create customer wsw:',JSON.stringify(wswHubCustomerCreateProperties));
    
    // -TEST
    let returnBody = {
      newWswCustomerId: '123customer',
      newWswParentCustomerId: '3456parentcustomer'
    }
    /*
    let resultCreateWswHubCustomer = await createWswHubCustomer(wswHubCustomerCreateProperties);
    let returnBody = {
      newWswCustomerId: resultCreateWswHubCustomer[WSW_NEW_CUSTOMER_ID_PROPERTY_INTERNAL_VALUE]
    }
    */
   // +TEST

    // make wsw hub call create parent customer
    let createWswHubParentCustomer = ! Object.keys(wswHubParentCustomerCreateProperties).length === 0;
    if (createWswHubParentCustomer) {
      console.log('create parent customer wsw:',JSON.stringify(createWswHubParentCustomer));
      // -TEST
      /*
      let resultCreateWswHubParentCustomer = await createWswHubCustomer(wswHubParentCustomerCreateProperties);
      returnBody[newWswParentCustomerId] = resultCreateWswHubParentCustomer[WSW_NEW_CUSTOMER_ID_PROPERTY_INTERNAL_VALUE];
      */
     // +TEST
    }

    return {
      message: `Successfully executed the serverless function (create-customer-wsw-hub). Customer ${createWswHubParentCustomer ? 'and Parent customer ' : ''}created in wsw: `, 
      body: returnBody,
      statusCode: 200
    }
  } catch (error) {
    let message = `There was an error executing the serverless function (create-customer-wsw-hub): ${error.message}`
    return { message, statusCode: 400 };
  }
};
