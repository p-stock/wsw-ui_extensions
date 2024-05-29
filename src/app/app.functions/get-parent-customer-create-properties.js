/* ----------  PACKAGES ---------- */
const axios = require('axios');
const hubspot = require('@hubspot/api-client');
/* ++++++++++  PACKAGES ++++++++++ */

/* ----------  CONSTANTS ---------- */
const IS_PROD = false;
const HS_PORTAL_ID = IS_PROD ? 139505817 : 143998115;
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP = IS_PROD ? "wsw_debitor_id_erp" : "wsw_sap_id";
const HS_CO_PARENT_CUSTOMER_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP = IS_PROD ? "wsw_debitor_id_erp" : "wsw_sap_id";
const HS_ACCESS_TOKEN = process.env.WSW_ACCESS_TOKEN;
const HS_ASSOCIATION_TYPE_COMPANY_TO_DEAL = 6;
const HS_COMPANY_PARENT_CUSTOMER_ID_SAP_PROPERTY_SYNC_INTERNAL_VALUE = "wsw_parent_customer_id_sap";
const HS_COMPANY_PARENT_CUSTOMER_ID_HS_PROPERTY_SYNC_INTERNAL_VALUE = "wsw_parent_customer_id_hs";
const RELEVANT_PARENT_CUSTOMER_PROPERTIES_QUERY_PARAM = `hs_object_id,${HS_CO_PARENT_CUSTOMER_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP}`
const HS_CO_PARENT_CUSTOMER_OBJECT_TYPE_ID = IS_PROD ? null : "2-129833360";
const HS_CO_PARENT_CUSTOMER_FULLY_QUALIFIED_NAME = IS_PROD ? null : `p${HS_PORTAL_ID}_parent_customers`;
/* ++++++++++  CONSTANTS ++++++++++ */

/* ---------- FUNCTIONS ---------- */
async function getParentCustomer(parentCustomerId,relevantParentCustomerPropertiesQueryParam) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${HUBSPOT_BASE_URL}/crm/v3/objects/${HS_CO_PARENT_CUSTOMER_OBJECT_TYPE_ID}/${parentCustomerId}?properties=${relevantParentCustomerPropertiesQueryParam} `,
        headers: {
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${HS_ACCESS_TOKEN}`,
        }
    };
    try {
        let responseGetParentCustomer = await axios.request(config);
        console.log('responseStatus function getParentCustomer:',responseGetParentCustomer.status);
        console.log(responseGetParentCustomer.data);
        return responseGetParentCustomer.data
    } catch(error) {
        console.log(error);
        throw new Error(error);
    }
}
/* ++++++++++ FUNCTIONS ++++++++++ */

exports.main = async (context = {}) => {
  const { parentCustomerId } = context.parameters;
  console.log(context.parameters);

  try {
    // prepare create body
    let resultGetAssociatedHubSpotParentCustomer = await getParentCustomer(parentCustomerId,RELEVANT_PARENT_CUSTOMER_PROPERTIES_QUERY_PARAM);
    if (! resultGetAssociatedHubSpotParentCustomer) {
        return {}
    }
    
    let wswHubParentCustomerCreateProperties = {
        "Kontengruppe": "0001 Auftraggeber / Z001 Debitor allgemein / ...", 
        "Buchungskreis": "",
        "Verkaufsorganisation": "",
        "Vertriebsweg": "",
        "Sparte": "",
        "Name": resultGetAssociatedHubSpotParentCustomer.properties.name ? resultGetAssociatedHubSpotParentCustomer.properties.name : '',
        "Suchbegriff 1": "",
        "Ort": resultGetAssociatedHubSpotParentCustomer.properties.city ? resultGetAssociatedHubSpotParentCustomer.properties.city : '',
        "Land": resultGetAssociatedHubSpotParentCustomer.properties.wsw_country ? resultGetAssociatedHubSpotParentCustomer.properties.wsw_country : '',
        "Transportzone": ""
    }
    console.log('Successfully executed the serverless function (get-parent-customer-create-properties).',JSON.stringify(wswHubParentCustomerCreateProperties))


    return wswHubParentCustomerCreateProperties;
  } catch (error) {
    console.log(`There was an error executing the serverless function (get-parent-customer-create-properties): ${error.message}`);
    return {};
  }
};
