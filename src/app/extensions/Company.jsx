import React, { useState, useEffect } from "react";
import {
  Button,
  Divider,
  EmptyState,
  Flex,
  Form,
  Input,
  Link,
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Text,
  Tile,
  hubspot
} from "@hubspot/ui-extensions";

const HS_PORTAL_ID = 143998115;
const HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP = "wsw_sap_id";

// Define the extension to be run within the Hubspot CRM
hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    fetchProperties={actions.fetchCrmObjectProperties}
    sendAlert={actions.addAlert}
  />
));

// Define the Extension component, taking in runServerless, context, fetchProperties & sendAlert as props
const Extension = ({ context, runServerless, fetchProperties, sendAlert }) => {
  const [companyName, setCompanyName] = useState("");
  const [debitorenIdSap, setDebitorenIdSap] = useState("");
  const [searchCompanyName, setSearchCompanyName] = useState("");
  const [hubSpotCompaniesByDebitorenId, setHubSpotCompaniesByDebitorenId] = useState([]);
  const [validationMessageInput, setValidationMessageInput] = useState('');
  const [inputIsValid, setInputIsValid] = useState(false);
  const [wswHubCustomers, setWswHubCustomers] = useState([]);
  const [showWswHubCustomerSearchResultTable, setWswHubCustomerSearchResultTable] = useState(false);
  const [searchResultCompanyIdForSapDebId, setSearchResultCompanyIdForSapDebId] = useState([]);
  const [searchResultCompanyIdForSapDebIdIsVisible, setSearchResultCompanyIdForSapDebIdIsVisible] = useState(false);
  const contextInfo = context;
  const companyId = context.crm.objectId;

  // useEffect fetch properties
  useEffect(() => {
    fetchProperties(["hs_object_id", "name", HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP])
      .then(properties => {
        setCompanyName(properties.name);
        setDebitorenIdSap(properties[HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP])
      })
  }, [fetchProperties]);

  // useEffects run serverless functions
  /*
  useEffect(async () => {
    let { response } = await runServerless({ name: "checkUserEmail", parameters: {contextInfo: contextInfo }});
    setUserEmailValid(response.emailValid);
    setCreateUpdateCustomerButtonIsDisabled(!response.emailValid)
  }, [runServerless])
  */

  // handle clicks
  // Call serverless function to execute with parameters.
  // The `searchCustomerWswHub` function name is configured inside `serverless.json`
  const handleClickSearchCustomersWswHub = async () => {
    if (! inputIsValid) {
      sendAlert({ message: `Empty Input is not valid`, type: 'danger' });
      setWswHubCustomers([]);
      setSearchResultCompanyIdForSapDebIdIsVisible(false);
      return;
    }
    const { response } = await runServerless(
      { 
        name: "searchCustomerWswHub", 
        parameters: { 
          companyName: searchCompanyName
        } 
      }
    );
    if (response.statusCode == 200) {
      sendAlert({ message: response.message });
      setWswHubCustomers(response.body);
      setWswHubCustomerSearchResultTable(true);
      setSearchResultCompanyIdForSapDebIdIsVisible(false);
    } else {
      sendAlert({ message: response.message, type: 'danger' })
    }
  };

  const handleRowButtonClick = async (customer) => {
    const { response } = await runServerless(
      { 
        name: "handleCustomerWswHub", 
        parameters: { 
          customer: customer
        } 
      }
    );
    if (response.statusCode == 200) {
      sendAlert({ message: response.response});
      setWswHubCustomers(response.wswCustomers);
    } else {
      sendAlert({ message: response.response, type: 'danger' })
    }
  };

  const handleClickRowButtonCheckDebNummerInHubSpot = async (customer) => {
    const { response } = await runServerless(
      { 
        name: "searchCompanyByDebitorIdHubSpot", 
        parameters: { 
          customerDebitorenId: customer['KUNNR']
        } 
      }
    );
    if (response.statusCode == 200) {
      sendAlert({ message: response.message});
      setHubSpotCompaniesByDebitorenId(response.body);
      if (response.body.length == 0) {
        // company with sap debitoren id not yet in HubSpot -> create new company and associate with deal
        sendAlert({ message: `A company with ${HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP} = ${customer['KUNNR']} currently does not exist in HubSpot.`})
        setSearchResultCompanyIdForSapDebIdIsVisible(false);
      } else {
        // company with sap debitoren id already in HubSpot -> associate existing company with deal
        sendAlert({ message: `Company (id = ${response.body[0].id}) with ${HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP} = ${customer['KUNNR']} already exists in HubSpot -> Follow Link below.`})
        setSearchResultCompanyIdForSapDebId(response.body[0].id);
        setSearchResultCompanyIdForSapDebIdIsVisible(true);
      }
      console.log(hubSpotCompaniesByDebitorenId);
    } else {
      sendAlert({ message: response.message, type: 'danger' })
    }
  };

  // component functions
  function wswHubCustomerSearchResultTableComponent() {
    if (wswHubCustomers.length > 0) {
      return (
      <Flex>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>KUNNR</TableHeader>
              <TableHeader>MCOD1</TableHeader>
              <TableHeader>MCOD3</TableHeader>
              <TableHeader>PSTLZ</TableHeader>
              <TableHeader>SORTL</TableHeader>
              <TableHeader>Check HS Company</TableHeader>
            
            </TableRow>
          </TableHead>
          <TableBody>
            {wswHubCustomers.map((item) => (
              <TableRow key={item['KUNNR']}>
                <TableCell>{item['KUNNR']}</TableCell>
                <TableCell>{item['MCOD1']}</TableCell>
                <TableCell>{item['MCOD3']}</TableCell>
                <TableCell>{item['PSTLZ']}</TableCell>
                <TableCell>{item['SORTL']}</TableCell>
                <TableCell>
                  <Button onClick={() => handleClickRowButtonCheckDebNummerInHubSpot(item)}>
                      KUNNR in HS
                    </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Flex>
      )
    } else {
      return (
        <Text>
        No results found for company name  
        </Text>
      )
    }
  }

  function searchResultCompanyIdForSapDebIdComponent() {
    return (
      <Tile flush={false}>
        <Text>
          <Link href={`https://app-eu1.hubspot.com/contacts/${HS_PORTAL_ID}/record/0-2/${searchResultCompanyIdForSapDebId}`} variant="dark">Link</Link> to existing company with id {searchResultCompanyIdForSapDebId}.
        </Text>
      </Tile>
    )
  }

  // entire component
  return (
    <>
      <Text>
        <Text format={{ fontWeight: "bold" }}>
          UI extension Data Flow
        </Text>
      </Text>
      <Text>Debitorennummer: {debitorenIdSap ? debitorenIdSap : '-'}</Text>
      <Flex direction="row" align="end" gap="small">
        <Input
          label="Search Company Name"
          name="companySearchName"
          description="Search for Name in WSW-Hub"
          required={true}
          error={!inputIsValid}
          validationMessage={validationMessageInput}
          placeholder={companyName}
          onChange={(value) => {
            setSearchCompanyName(value)
          }}
          onInput={(value) => {
            if (!value || value == '') {
              setValidationMessageInput('Empty input is not valid');
              setInputIsValid(false)
            } else {
              setValidationMessageInput('Valid Input');
              setInputIsValid(true);
            }
          }}
        />
      </Flex>
      <Flex direction="row" align="end" gap="small">
        <Button type="submit" onClick={handleClickSearchCustomersWswHub}>
          Suche Debitorenname in WSW-Hub
        </Button>
      </Flex>
      <Divider />
      { showWswHubCustomerSearchResultTable == true ? wswHubCustomerSearchResultTableComponent() : null }
      { searchResultCompanyIdForSapDebIdIsVisible ? searchResultCompanyIdForSapDebIdComponent() : null }
      <Text>
      </Text>
    </>
  );
};
