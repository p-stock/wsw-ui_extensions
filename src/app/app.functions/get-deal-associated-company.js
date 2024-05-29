/* ----------  PACKAGES ---------- */
const axios = require('axios');
const hubspot = require('@hubspot/api-client');
/* ++++++++++  PACKAGES ++++++++++ */

/* ----------  CONSTANTS ---------- */
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP = "wsw_sap_id";
const HS_ACCESS_TOKEN = process.env.WSW_ACCESS_TOKEN;
const HS_ASSOCIATION_TYPE_COMPANY_TO_DEAL = 6;
const HS_COMPANY_PARENT_CUSTOMER_ID_SAP_PROPERTY_SYNC_INTERNAL_VALUE = "wsw_parent_customer_id_sap";
const HS_COMPANY_PARENT_CUSTOMER_ID_HS_PROPERTY_SYNC_INTERNAL_VALUE = "wsw_parent_customer_id_hs";
/* ++++++++++  CONSTANTS ++++++++++ */

/* ---------- FUNCTIONS ---------- */
async function getDealAssociatedCompanies(dealId) {
    let data = {
        "filterGroups": [
            {
                "filters": [
                    {
                        "propertyName": "associations.deal",
                        "operator": "EQ",
                        "value": dealId
                    }
                ]
            }
        ],
        "properties": [
            "hs_object_id",
            "name",
            "city",
            "wsw_country",
            HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP,
            HS_COMPANY_PARENT_CUSTOMER_ID_HS_PROPERTY_SYNC_INTERNAL_VALUE,
            HS_COMPANY_PARENT_CUSTOMER_ID_SAP_PROPERTY_SYNC_INTERNAL_VALUE
        ],
        "after": 0,
        "limit": 2,
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
        console.log('responseStatus function getDealAssociatedCompany:',responseSearchCompanies.status);
        console.log(responseSearchCompanies.data.results);
        return responseSearchCompanies.data.results
    } catch(error) {
        throw new Error(error);
    }
}
/* ++++++++++ FUNCTIONS ++++++++++ */

exports.main = async (context = {}) => {
  const { dealId } = context.parameters;
  let responseType = 'SUCCESS';
  let responseBody = 'Successfully run get deal associated company in HubSpot.';
  console.log(context.parameters);

  try {
    // prepare create body
    let resultGetAssociatedHubSpotCompany = await getDealAssociatedCompanies(dealId);
    if (resultGetAssociatedHubSpotCompany.length != 1) {
        return {
            message: `There is none or more than one company associated to the deal.`,
            statusCode: 400
        }
    }
    if (resultGetAssociatedHubSpotCompany[0].properties[HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP]) {
        return {
            message: `Associated company ${resultGetAssociatedHubSpotCompany[0].id} already has ${HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP} = ${resultGetAssociatedHubSpotCompany[0].properties[HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP]}.`,
            statusCode: 400
        }      
    }
    
    console.log('successfully executed',JSON.stringify(resultGetAssociatedHubSpotCompany[0]))
    return {
        message: `Successfully executed the serverless function (get-deal-associated-company).`, 
        body: resultGetAssociatedHubSpotCompany[0],
        statusCode: 200
    }
  } catch (error) {
    let message = `There was an error executing the serverless function (get-deal-associated-company): ${error.message}`
    return { message, statusCode: 400 };
  }
};
