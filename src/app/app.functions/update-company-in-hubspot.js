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
async function updateHubSpotCompany(companyId,updateBody) {
    let data = createBody;

    let config = {
        method: 'patch',
        maxBodyLength: Infinity,
        url: `${HUBSPOT_BASE_URL}/crm/v3/objects/companies/${companyId}`,
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

/* ++++++++++ FUNCTIONS ++++++++++ */

exports.main = async (context = {}) => {
  const { customerDebitorenId, associatedCompanyId } = context.parameters;
  console.log(context.parameters);

  try {
    let updateBody = { 
        properties: {
            [HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP]: customerDebitorenId
        }
    }
    let resultUpdateHubSpotCompany = await updateHubSpotCompany(associatedCompanyId,updateBody);
    return {
      message: `Successfully executed the serverless function (update-company-in-hubspot).`, 
      body: resultUpdateHubSpotCompany,
      statusCode: 200
    }
  } catch (error) {
    let message = `There was an error executing the serverless function (update-company-in-hubspot): ${error.message}`
    return { message, statusCode: 400 };
  }
};
