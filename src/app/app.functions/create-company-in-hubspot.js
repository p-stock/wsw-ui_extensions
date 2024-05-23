/* ----------  PACKAGES ---------- */
const axios = require('axios');
const hubspot = require('@hubspot/api-client');
/* ++++++++++  PACKAGES ++++++++++ */

/* ----------  CONSTANTS ---------- */
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP = "wsw_sap_id";
const HS_ACCESS_TOKEN = process.env.WSW_ACCESS_TOKEN;
const HS_ASSOCIATION_TYPE_COMPANY_TO_DEAL = 6;
/* ++++++++++  CONSTANTS ++++++++++ */

/* ---------- FUNCTIONS ---------- */
async function createHubSpotCompany(createBody) {
    let data = createBody;

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${HUBSPOT_BASE_URL}/crm/v3/objects/companies`,
        headers: {
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${HS_ACCESS_TOKEN}`,
        },
        data: data    
      };
      
      try {
        let responseCreateCompany = await axios.request(config);
        console.log('responseStatus function createCompany:',responseCreateCompany.status);
        return responseCreateCompany.data
      } catch(error) {
        throw new Error(error);
      }
}

async function prepareCreateBody(customer,dealId=false) {
    let createBody = {};
    let properties = {
        name: customer["MCOD1"],
        city: customer["MCOD3"],
        zip: customer["PSTLZ"],
        description: customer["SORTL"]
    }
    properties[HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP] = customer['KUNNR'];
    createBody["properties"] = properties;
    if (dealId) {
        createBody["associations"] = [
            {
                types: [
                    {
                        associationCategory: 'HUBSPOT_DEFINED',
                        associationTypeId: HS_ASSOCIATION_TYPE_COMPANY_TO_DEAL
                    }
                ],
                to: {
                    id: dealId
                }
            }
        ];
    }
    return createBody;
}
/* ++++++++++ FUNCTIONS ++++++++++ */

exports.main = async (context = {}) => {
  const { customer, dealId } = context.parameters;
  let responseType = 'SUCCESS';
  let responseBody = 'Successfully run create company in HubSpot.';
  console.log(context.parameters);

  try {
    // prepare create body
    let createBody = await prepareCreateBody(customer,dealId);
    let resultCreateHubSpotCompany = await createHubSpotCompany(createBody);
    return {
      message: `Successfully executed the serverless function (create-company-in-hubspot).`, 
      body: resultCreateHubSpotCompany,
      statusCode: 200
    }
  } catch (error) {
    let message = `There was an error executing the serverless function (create-company-in-hubspot): ${error.message}`
    return { message, statusCode: 400 };
  }
};
