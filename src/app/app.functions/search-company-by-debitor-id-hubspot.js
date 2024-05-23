/* ----------  PACKAGES ---------- */
const axios = require('axios');
const hubspot = require('@hubspot/api-client');
/* ++++++++++  PACKAGES ++++++++++ */

/* ----------  CONSTANTS ---------- */
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP = "wsw_sap_id";
const HS_ACCESS_TOKEN = process.env.WSW_ACCESS_TOKEN;
/* ++++++++++  CONSTANTS ++++++++++ */

/* ---------- FUNCTIONS ---------- */
async function searchHubSpotCompanies(wsw_debitor_id_erp) {
  let data = {
    "filterGroups": [
        {
            "filters": [
                {
                    "propertyName": HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP,
                    "operator": "EQ",
                    "value": wsw_debitor_id_erp
                }
            ]
        }
    ],
    "properties": [
        "hs_object_id",
        "name",
        HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP
    ],
    "after": 0,
    "limit": 1,
    "sorts": [
        {
            "propertyName": "hs_createdate",
            "direction": "ASCENDING"
        }
    ]
  };

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${HUBSPOT_BASE_URL}/crm/v3/objects/0-2/search`,
    headers: {
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${HS_ACCESS_TOKEN}`,
    },
    data: data    
  };
  
  try {
    let responseSearchCompanies = await axios.request(config);
    console.log('responseStatus function searchHubSpotCompanies:',responseSearchCompanies.status);
    return responseSearchCompanies.data.results
  } catch(error) {
    throw new Error(error);
  }

}
/* ++++++++++ FUNCTIONS ++++++++++ */

exports.main = async (context = {}) => {
  const { customerDebitorenId } = context.parameters;
  let responseType = 'SUCCESS';
  let responseBody = 'Successfully run company search in HubSpot.';
  console.log(context.parameters);
  console.log(customerDebitorenId);

  try {
    // make hubspot call 
    let resultSearchHubSpotCompanies = await searchHubSpotCompanies(customerDebitorenId.toString());
    return {
      message: `Successfully executed the serverless function (search-company-by-debitor-id-hubspot).`, 
      body: resultSearchHubSpotCompanies,
      statusCode: 200
    }
  } catch (error) {
    let message = `There was an error executing the serverless function (search-company-by-debitor-id-hubspot): ${error.message}`
    return { message, statusCode: 400 };
  }
};
