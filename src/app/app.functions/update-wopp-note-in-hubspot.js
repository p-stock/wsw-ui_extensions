/* ----------  PACKAGES ---------- */
const axios = require('axios');
const hubspot = require('@hubspot/api-client');
/* ++++++++++  PACKAGES ++++++++++ */

/* ----------  CONSTANTS ---------- */
const IS_PROD = false;
const HS_PORTAL_ID = IS_PROD ? 139505817 : 143998115;
const HS_CO_WOPP_OBJECT_TYPE_ID = IS_PROD ? null : "2-127145904";
const HS_CO_WOPP_FULLY_QUALIFIED_NAME = IS_PROD ? null : `p${HS_PORTAL_ID}_wsw_wopps`;
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP = "wsw_sap_id";
const HS_ACCESS_TOKEN = process.env.WSW_ACCESS_TOKEN;
const HS_ASSOCIATION_TYPE_COMPANY_TO_DEAL = 6;
const MAX_CHARACTERS_SINGLE_LINE_TEXT = 65536;
const ESTIMATED_LENGTH_NOTE = 1000;
/* ++++++++++  CONSTANTS ++++++++++ */

/* ---------- FUNCTIONS ---------- */
const getUpdatedNoteProperties = (objectArray,key,value,updates) => {
  return objectArray.map(note => {
      if (note[key] === value) {
      return { ...note, ...updates };
      }
      return note;
  });
}

async function updateHubSpotWopp(woppId,updateBody) {
    let data = updateBody;
    
    let config = {
        method: 'patch',
        maxBodyLength: Infinity,
        url: `${HUBSPOT_BASE_URL}/crm/v3/objects/${HS_CO_WOPP_OBJECT_TYPE_ID}/${woppId}`,
        headers: {
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${HS_ACCESS_TOKEN}`,
        },
        data: data 
      };
      
      try {
        let responseUpdateObject = await axios.request(config);
        console.log('responseStatus function updateHubSpotWopp:',responseUpdateObject.status);
        return responseUpdateObject.data
      } catch(error) {
        console.log(error);
        throw new Error(error);
      }
}
/* ++++++++++ FUNCTIONS ++++++++++ */

exports.main = async (context = {}) => {
    // console.log(context.parameters);  
    const { woppId, notePosition, woppNotes1, woppNotes2, woppNotes3, updateAmount, updateMe, updateMaterial, updateDescription, updateKurztext, updateErgaenztVon, updateTime, userEmail } = context.parameters;

    try {
      let lengthNotes1 = woppNotes1 ? woppNotes1.length : 0;
      let lengthNotes2 = woppNotes2 ? woppNotes2.length : 0;
      let lengthNotes3 = woppNotes3 ? woppNotes3.length : 0;
      let updateProperties = {
        properties: {}
      };
      let updates = {
        // position: notePosition,
        amount: updateAmount,
        me: updateMe,
        material: updateMaterial,
        description: updateDescription,
        kurztext: updateKurztext,
        ergaenzt_von: updateErgaenztVon,
        update_date: updateTime,
        updatedBy: userEmail
      };
      
      console.log('lengthNotes1',lengthNotes1,'lengthNotes2',lengthNotes2,'lengthNotes3',lengthNotes3);

      if (lengthNotes3 > 0) {
        let foundObjects = JSON.parse(woppNotes3).filter(n => n.position === notePosition);
        if (foundObjects.length > 0) {
            updateProperties.properties = {'wsw_wopp_notes_3': JSON.stringify(getUpdatedNoteProperties(JSON.parse(woppNotes3),'position',notePosition,updates)) }
        }
      } else if (lengthNotes2 > 0) {
        let foundObjects = JSON.parse(woppNotes2).filter(n => n.position === notePosition);
        if (foundObjects.length > 0) {
            updateProperties.properties = {'wsw_wopp_notes_2': JSON.stringify(getUpdatedNoteProperties(JSON.parse(woppNotes2),'position',notePosition,updates)) }
        }
      } else {
        let foundObjects = JSON.parse(woppNotes1).filter(n => n.position === notePosition);
        if (foundObjects.length > 0) {
            updateProperties.properties = {'wsw_wopp_notes_1': JSON.stringify(getUpdatedNoteProperties(JSON.parse(woppNotes1),'position',notePosition,updates))}
        }        
      }

      // update wopp
      let responseUpdateWopp = await updateHubSpotWopp(woppId,updateProperties);
      return {
        message: `Successfully executed the serverless function (update-wopp-note-in-hubspot).`, 
        body: responseUpdateWopp,
        statusCode: 200
      }
    } catch (error) {
      let message = `There was an error executing the serverless function (update-wopp-note-in-hubspot): ${error.message}`
      return { message, statusCode: 400 };
    }
  };