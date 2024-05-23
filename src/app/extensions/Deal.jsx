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
import { CrmAssociationTable } from '@hubspot/ui-extensions/crm';

const IS_PROD = false;
const HS_PORTAL_ID = IS_PROD ? 139505817 : 143998115;
const HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP = IS_PROD ? "wsw_debitor_id_erp" : "wsw_sap_id";
const HS_RELEVANT_PIPELINE_IDS = IS_PROD ? [/* 496760816 Scoping Kunde */ /*, 496760817 Scoping Intern */] : [ "496760816" /* Scoping Kunde */, "496760817" /* Scoping Intern */];
const HS_DEAL_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP = IS_PROD ? "wsw_account_sap_id" : "wsw_account_sap_id";

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
  const contextInfo = context;
  const dealId = context.crm.objectId;
  const [dealName, setDealName] = useState("");
  const [dealstage, setDealstage] = useState("");
  const [pipeline, setPipeline] = useState("");
  const [dealAccountSapId, setDealAccountSapId] = useState("");
  const [extensionActivated, setExtensionActivated] = useState(false);
  const [searchCompanyName, setSearchCompanyName] = useState("");
  const [hubSpotCompaniesByDebitorenId, setHubSpotCompaniesByDebitorenId] = useState([]);
  const [validationMessageInput, setValidationMessageInput] = useState('');
  const [inputIsValid, setInputIsValid] = useState(false);
  const [wswHubCustomers, setWswHubCustomers] = useState([]);
  const [showWswHubCustomerSearchResultTable, setWswHubCustomerSearchResultTable] = useState(false);
  const [searchResultCompanyIdForSapDebId, setSearchResultCompanyIdForSapDebId] = useState([]);
  const [searchResultCompanyIdForSapDebIdIsVisible, setSearchResultCompanyIdForSapDebIdIsVisible] = useState(false);
  const [newlyCreatedHsCompanyId, setNewlyCreatedHsCompanyId] = useState("");
  const [newlyCreatedHsCompanyIdIsVisible, setNewlyCreatedHsCompanyIdIsVisible] = useState(false);
  const [associatedCompanyId, setAssociatedCompanyId] = useState("");

  // useEffect fetch properties
  useEffect(() => {
    fetchProperties(["hs_object_id", "dealname", "pipeline" , "dealstage", HS_DEAL_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP])
      .then(properties => {
        setDealName(properties.dealname);
        setPipeline(properties.pipeline);
        setDealstage(properties.dealstage);
        setExtensionActivated(HS_RELEVANT_PIPELINE_IDS.includes(properties.dealstage));
        setDealAccountSapId(properties[HS_DEAL_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP]);
      })
  }, [fetchProperties]);

 // useEffect get deal's associated company
  useEffect(async () => {
    const { response } = await runServerless({ name: "getDealAssociatedCompany", parameters: { dealId: dealId }});
    console.log(response);
    setAssociatedCompanyId(response.statusCode == 200 ? response.body.id : '');
  }, [runServerless])

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

  const handleClickRowButtonCreateCompanyInHubSpot = async (customer) => {
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
        sendAlert({ message: `A new company with ${HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP} = ${customer['KUNNR']} will be created and associated to the deal (id = ${dealId}).`})
        setSearchResultCompanyIdForSapDebIdIsVisible(false);
        const { response: response2 } = await runServerless(
          {
            name: "createCompanyInHubSpot",
            parameters: {
              customer: customer,
              dealId: dealId
            }
          }
        );
        if (response2.statusCode == 200) {
          sendAlert( { message: response2.message });
          setNewlyCreatedHsCompanyId(response2.body.id);
          setNewlyCreatedHsCompanyIdIsVisible(true);
        } else {
          sendAlert({ message: response2.message, type: 'danger' })
        }
      } else {
        // company with sap debitoren id already in HubSpot -> associate existing company with deal
        sendAlert({ message: `Creation not possible! Company (id = ${response.body[0].id}) with ${HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP} = ${customer['KUNNR']} already exists -> Follow Link below.`,type: 'danger'})
        setSearchResultCompanyIdForSapDebId(response.body[0].id);
        setSearchResultCompanyIdForSapDebIdIsVisible(true);
      }
      console.log(hubSpotCompaniesByDebitorenId);
    } else {
      sendAlert({ message: response.message, type: 'danger' })
    }
  };

  const handleClickRowButtonUpdateCompanyInHubSpot  = async (customer) => {
    const { response } = await runServerless(
      { 
        name: "searchCompanyByDebitorIdHubSpot", 
        parameters: { 
          customerDebitorenId: customer['KUNNR']
        } 
      }
    );
    if (response.statusCode == 200) {
      // sendAlert({ message: response.message});
      // setHubSpotCompaniesByDebitorenId(response.body);
      if (response.body.length == 0) {
        // company with sap debitoren id not yet in HubSpot -> create new company and associate with deal
        sendAlert({ message: `A company with ${HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP} = ${customer['KUNNR']} currently does not exist in HubSpot.`})
        setSearchResultCompanyIdForSapDebIdIsVisible(false);
        const { response_update } = await runServerless(
          {
            name: "updateCompanyInHubSpot", 
            parameters: { 
              customerDebitorenId: customer['KUNNR'],
              associatedCompanyId: associatedCompanyId,
            } 
          }
        )
        if (response_update.statusCode == 200) {
          sendAlert({ message: response_update.message })
        } else {
          sendAlert({ message: response_update.message, type: 'danger' })
        }
      } else {
        // company with sap debitoren id already in HubSpot -> associate existing company with deal
        sendAlert({ message: `Company (id = ${response.body[0].id}) with ${HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP} = ${customer['KUNNR']} already exists in HubSpot -> Follow Link below.`})
        // setSearchResultCompanyIdForSapDebId(response.body[0].id);
        // setSearchResultCompanyIdForSapDebIdIsVisible(true);
      }
      console.log(hubSpotCompaniesByDebitorenId);
    } else {
      sendAlert({ message: response.message, type: 'danger' })
    }
  };

  // component functions
  function hsAssociatedCompaniesTableComponent() {
    return (
      <CrmAssociationTable
        objectTypeId="0-2"
        propertyColumns={['name', HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP]}
        pageSize={10}
        preFilters={[
          {
            operator: 'HAS_PROPERTY',
            property: HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP
          },
        ]}
        sort={[
          {
            direction: 1,
            columnName: HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP
          },
        ]}
        searchable={true}
        pagination={true}
      />
    )
  }

  function wswHubCustomerSearchResultTableComponent() {
    if (wswHubCustomers.length > 0) {
      return (
      <Flex>
        <Table paginated="true" maxVisiblePageButtons="5" showFirstLastButtons="true">
          <TableHead>
            <TableRow>
              <TableHeader>KUNNR</TableHeader>
              <TableHeader>MCOD1</TableHeader>
              <TableHeader>MCOD3</TableHeader>
              <TableHeader>PSTLZ</TableHeader>
              <TableHeader>SORTL</TableHeader>
              <TableHeader>Check HS Company</TableHeader>
              <TableHeader>Create HS Company</TableHeader>
              <TableHeader>Update assoc. HS Company</TableHeader>
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
                <TableCell>
                  <Button onClick={() => handleClickRowButtonCreateCompanyInHubSpot(item)}>
                    Create HS Company with KUNNR
                  </Button>
                </TableCell>
                <TableCell>
                  <Button disabled={associatedCompanyId==''} onClick={() => handleClickRowButtonUpdateCompanyInHubSpot(item)}>
                    Update assoc. HS Company with KUNNR
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
        No results found for company name {searchCompanyName} 
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

  function newlyCreatedHsCompanyLinkComponent() {
    return (
      <Tile flush={false}>
        <Text>
          <Link href={`https://app-eu1.hubspot.com/contacts/${HS_PORTAL_ID}/record/0-2/${newlyCreatedHsCompanyId}`} variant="dark">Link</Link> to newly created company with id {newlyCreatedHsCompanyId}.
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
      <Text format={{ fontWeight: "bold" }}>
          Associated Companies with {HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP} populated
      </Text>
      <Flex direction="row" align="end" gap="small">
        {hsAssociatedCompaniesTableComponent()}
      </Flex>
      <Divider />
      <Flex direction="row" align="end" gap="small">
        <Input
          label="Search Company Name"
          name="companySearchName"
          description="Search for Name in WSW-Hub"
          required={true}
          error={!inputIsValid}
          validationMessage={validationMessageInput}
          tooltip="Functionality only activated when Deal in Scoping Stage."
          placeholder="search name"
          onChange={(value) => {
            setSearchCompanyName(value)
          }}
          readOnly={!extensionActivated}
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
      <Button disabled={!extensionActivated} type="submit" onClick={handleClickSearchCustomersWswHub}>
        Suche Debitorenname in WSW-Hub
      </Button>
      <Divider />
      { showWswHubCustomerSearchResultTable ? wswHubCustomerSearchResultTableComponent() : null }
      { searchResultCompanyIdForSapDebIdIsVisible ? searchResultCompanyIdForSapDebIdComponent() : null }
      { newlyCreatedHsCompanyIdIsVisible ? newlyCreatedHsCompanyLinkComponent() : null }
      <Text>
      </Text>
    </>
  );
};
