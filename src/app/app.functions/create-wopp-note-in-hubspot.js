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
function getMaxMinObjectFromJsonArrayForCertainKey(objectArray,key,max=true) {
  if (objectArray.length == 0) return { position: 0 };  
  let maxMinObject;
  if (max) {
      maxMinObject = objectArray.reduce((max, o) => {
          return (o[key] > max[key]) ? o : max;
      }, objectArray[0]);
  } else {
      maxMinObject = objectArray.reduce((min, o) => {
          return (o[key] < min[key]) ? o : min;
      }, objectArray[0]);
  }
  return maxMinObject;
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
        return {
          statusCode: 200,
          body: responseUpdateObject.data
        }
      } catch(error) {
        console.log(error);
        throw new Error(error);
      }
}

/* ++++++++++ FUNCTIONS ++++++++++ */

exports.main = async (context = {}) => {
    const { woppId, newNoteMaterial, newNoteAmount, newNoteDescription, newNoteErgaenztVon , newNoteKurztext, woppNotes1, woppNotes2, woppNotes3, contextInfo } = context.parameters;
  
    try {
      let currentDate = new Date().toISOString()
      let userEmail = contextInfo.user.email;
      let lengthNotes1 = woppNotes1 ? woppNotes1.length : 0;
      let lengthNotes2 = woppNotes2 ? woppNotes2.length : 0;
      let lengthNotes3 = woppNotes3 ? woppNotes3.length : 0;
      

      // create wopp update body
      let newNote = {
        material: newNoteMaterial,
        kurztext: newNoteKurztext,
        amount: newNoteAmount,
        description: newNoteDescription,
        ergaenzt_von: newNoteErgaenztVon,
        update_date: null,
        create_date: currentDate,
        updated_by: userEmail
      }

      let lengthNewNote = JSON.stringify(newNote).length;
      let updateProperties = {
        properties: {}
      };
      let alertPropertiesAreReachingLimit = false;
      let messagePropertiesAreReachingLimit = ` Notes will exceed available property limit soon. Please address admin!`;

      console.log('length1',lengthNotes1,'length2',lengthNotes2,'length3',lengthNotes3,'new',lengthNewNote);

      if (lengthNotes3 > 0) {
        if (lengthNotes3 + lengthNewNote > MAX_CHARACTERS_SINGLE_LINE_TEXT) {
            throw new Error(`Notes have exceeded available property limit. Please address admin!`)
        } else {
            if (MAX_CHARACTERS_SINGLE_LINE_TEXT - (lengthNotes3 + lengthNewNote) <= (ESTIMATED_LENGTH_NOTE * 3)) {
                alertPropertiesAreReachingLimit = true;
            }
            let newPosition = await getMaxMinObjectFromJsonArrayForCertainKey(JSON.parse(woppNotes3),'position');
            newNote['position'] = parseInt(newPosition.position) + 1000;
            updateProperties.properties = {'wsw_wopp_notes_3': JSON.stringify(JSON.parse(woppNotes3).concat(newNote)) }
        }
      } else if (lengthNotes2 > 0) {
        let newPosition = await getMaxMinObjectFromJsonArrayForCertainKey(JSON.parse(woppNotes2),'position');
        newNote['position'] = parseInt(newPosition.position) + 1000;
        if (lengthNotes2 + lengthNewNote > MAX_CHARACTERS_SINGLE_LINE_TEXT) {
            updateProperties.properties = { 'wsw_wopp_notes_3': JSON.stringify((lengthNotes3 > 0 ? JSON.parse(woppNotes3) : []).concat(newNote)) }
        } else {
            updateProperties.properties = {'wsw_wopp_notes_2': JSON.stringify((lengthNotes2 > 0 ? JSON.parse(woppNotes2) : []).concat(newNote)) }
        }        
      } else {
        let newPosition = await getMaxMinObjectFromJsonArrayForCertainKey(lengthNotes1 > 0 ? JSON.parse(woppNotes1) : [],'position');
        // console.log(JSON.stringify(newPosition));
        newNote['position'] = parseInt(newPosition.position) + 1000;
        if (lengthNotes1 + lengthNewNote > MAX_CHARACTERS_SINGLE_LINE_TEXT) {
            updateProperties.properties = { 'wsw_wopp_notes_2': JSON.stringify((lengthNotes2 > 0 ? JSON.parse(woppNotes2) : []).concat(newNote)) }
        } else {
            updateProperties.properties = { 'wsw_wopp_notes_1': JSON.stringify((lengthNotes1 > 0 ? JSON.parse(woppNotes1) : []).concat(newNote)) }
        }          
      }

      // console.log(JSON.stringify(updateProperties));

      // update wopp
      let responseUpdateWopp = await updateHubSpotWopp(woppId,updateProperties);
      let message = `Successfully executed the serverless function (create-wopp-note-in-hubspot).`;
      if (alertPropertiesAreReachingLimit) message += messagePropertiesAreReachingLimit;
      return { message, statusCode: 200 };
    } catch (error) {
      console.log(error);
      let message = `There was an error executing the serverless function (create-wopp-note-in-hubspot): ${error.message}`
      return { message, statusCode: 400 };
    }
  };