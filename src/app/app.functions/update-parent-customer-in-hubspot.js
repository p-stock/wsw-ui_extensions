/* ----------  PACKAGES ---------- */
const axios = require('axios');
const hubspot = require('@hubspot/api-client');
/* ++++++++++  PACKAGES ++++++++++ */

/* ----------  CONSTANTS ---------- */
const IS_PROD = false;
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const HS_PORTAL_ID = IS_PROD ? 139505817 : 143998115;
const HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP = "wsw_sap_id";
const HS_ACCESS_TOKEN = process.env.WSW_ACCESS_TOKEN;
const HS_ASSOCIATION_TYPE_COMPANY_TO_DEAL = 6;
const HS_CO_PARENT_CUSTOMER_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP = IS_PROD ? "wsw_debitor_id_erp" : "wsw_sap_id";
const HS_CO_PARENT_CUSTOMER_OBJECT_TYPE_ID = IS_PROD ? null : "2-129833360";
const HS_CO_PARENT_CUSTOMER_FULLY_QUALIFIED_NAME = IS_PROD ? null : `p${HS_PORTAL_ID}_parent_customers`;
const HS_CO_PARENT_CUSTOMER_TO_COMPANY_ASSOCIATION_TYPE_ID = IS_PROD ? null : 61;
const HS_COMPANY_TO_CO_PARENT_CUSTOMER_ASSOCIATION_TYPE_ID = IS_PROD ? null : 62;
const HS_CO_PARENT_CUSTOMER_TO_DEAL_ASSOCIATION_TYPE_ID = IS_PROD ? null : 65;
/* ++++++++++  CONSTANTS ++++++++++ */

/* ---------- FUNCTIONS ---------- */
async function updateHubSpotParentCustomer(parentCustomerId,updateBody) {
    let data = updateBody;

    let config = {
        method: 'patch',
        maxBodyLength: Infinity,
        url: `${HUBSPOT_BASE_URL}/crm/v3/objects/${HS_CO_PARENT_CUSTOMER_OBJECT_TYPE_ID}/${parentCustomerId}`,
        headers: {
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${HS_ACCESS_TOKEN}`,
        },
        data: data    
      };
      
      try {
        let responseUpdateParentCustomer = await axios.request(config);
        console.log('responseStatus function updateParentCustomer:',responseUpdateParentCustomer.status);
        return responseUpdateParentCustomer.data
      } catch(error) {
        console.log(error);
        throw new Error(error);
      }
}

/* ++++++++++ FUNCTIONS ++++++++++ */

exports.main = async (context = {}) => {
  const { parentCustomerDebitorenId, associatedCompanyId, associatedParentCustomerId } = context.parameters;
  console.log(context.parameters);

  try {
    let updateBody = { 
        properties: {
            [HS_CO_PARENT_CUSTOMER_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP]: parentCustomerDebitorenId
        }
    }

    console.log(updateBody);

    let resultUpdateHubSpotParentCustomer = await updateHubSpotParentCustomer(associatedParentCustomerId,updateBody);
    console.log(resultUpdateHubSpotParentCustomer);
    return {
      message: `Successfully executed the serverless function (update-parent-customer-in-hubspot).`, 
      body: resultUpdateHubSpotParentCustomer,
      statusCode: 200
    }
  } catch (error) {
    let message = `There was an error executing the serverless function (update-parent-customer-in-hubspot): ${error.message}`
    return { message, statusCode: 400 };
  }
};
