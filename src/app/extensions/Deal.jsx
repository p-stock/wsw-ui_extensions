import React, { useState, useEffect } from "react";
import {
  Button,
  Divider,
  EmptyState,
  ErrorState,
  Flex,
  Form,
  Heading,
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
  Accordion,
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
  const [wswHubCustomerCreateProperties, setWswHubCustomerCreateProperties] = useState({});
  const [showWswHubCustomerSearchResultTable, setWswHubCustomerSearchResultTable] = useState(false);
  const [searchResultCompanyIdForSapDebId, setSearchResultCompanyIdForSapDebId] = useState([]);
  const [searchResultCompanyIdForSapDebIdIsVisible, setSearchResultCompanyIdForSapDebIdIsVisible] = useState(false);
  const [newlyCreatedHsCompanyId, setNewlyCreatedHsCompanyId] = useState("");
  const [newlyCreatedHsCompanyIdIsVisible, setNewlyCreatedHsCompanyIdIsVisible] = useState(false);
  const [associatedCompanyId, setAssociatedCompanyId] = useState("");
  const [associatedCompanyName, setAssociatedCompanyName] = useState("");

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
    setAssociatedCompanyName(response.statusCode == 200 ? response.body.properties.name : '');
    setWswHubCustomerCreateProperties(response.statusCode == 200 ? {
        "Kontengruppe": "0001 Auftraggeber / Z001 Debitor allgemein / ...", 
        "Buchungskreis": "",
        "Verkaufsorganisation": "",
        "Vertriebsweg": "",
        "Sparte": "",
        "Name": response.body.properties.name ? response.body.properties.name : '',
        "Suchbegriff 1": "",
        "Ort": response.body.properties.city ? response.body.properties.city : '',
        "Land": response.body.properties.wsw_country ? response.body.properties.wsw_country : '',
        "Transportzone": ""          
      } 
    : {})
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
      // sendAlert({ message: response.message });
      setWswHubCustomers(response.body);
      setWswHubCustomerSearchResultTable(true);
      setSearchResultCompanyIdForSapDebIdIsVisible(false);
    } else {
      setWswHubCustomerSearchResultTable(false);
      setSearchResultCompanyIdForSapDebIdIsVisible(false);
      sendAlert({ message: response.message, type: 'danger' })
    }
  };

  const handleClickCreateCustomerWswHub = async () => {
    const { response } = await runServerless(
      { 
        name: "createCustomerWswHub", 
        parameters: { 
          wswHubCustomerCreateProperties: wswHubCustomerCreateProperties
        } 
      }
    );

    if (response.statusCode == 200) {
      // sendAlert({ message: response.message });
      // console.log(response.body);
      let newWswCustomerId = response.body.newWswCustomerId;
      const { response: response2 } = await runServerless(
        {
          name: "updateCompanyInHubSpot", 
          parameters: { 
            customerDebitorenId: newWswCustomerId,
            associatedCompanyId: associatedCompanyId
          } 
        }
      )
      if (response2.statusCode == 200) {
        sendAlert({ message: `A new customer has been created in WSW-Hub with Id ${newWswCustomerId}.` })
        setWswHubCustomerSearchResultTable(false);
        setSearchResultCompanyIdForSapDebIdIsVisible(false);
      } else {
        sendAlert({ message: response2.message, type: 'danger' })
      }
    } else {
      setWswHubCustomerSearchResultTable(false);
      setSearchResultCompanyIdForSapDebIdIsVisible(false);
      sendAlert({ message: response.message, type: 'danger' })
    }    
  }

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
      // sendAlert({ message: response.message});
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
          setWswHubCustomerSearchResultTable(false);
          setSearchResultCompanyIdForSapDebIdIsVisible(false);
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
        // sendAlert({ message: `A company with ${HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP} = ${customer['KUNNR']} currently does not exist in HubSpot.`})
        setSearchResultCompanyIdForSapDebIdIsVisible(false);
        const { response: response2 } = await runServerless(
          {
            name: "updateCompanyInHubSpot", 
            parameters: { 
              customerDebitorenId: customer['KUNNR'],
              associatedCompanyId: associatedCompanyId
            } 
          }
        )
        if (response2.statusCode == 200) {
          setWswHubCustomerSearchResultTable(false);
          setSearchResultCompanyIdForSapDebIdIsVisible(false);
          sendAlert({ message: response2.message })
        } else {
          sendAlert({ message: response2.message, type: 'danger' })
        }
      } else {
        sendAlert({ message: `Company (id = ${response.body[0].id}) with ${HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP} = ${customer['KUNNR']} already exists in HubSpot.`})
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
          /*
          {
            operator: 'HAS_PROPERTY',
            property: HS_COMPANY_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP
          },
          */
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
                <TableCell>
                  <Button onClick={() => handleClickRowButtonCheckDebNummerInHubSpot(item)}>
                    KUNNR in HS
                  </Button>
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleClickRowButtonCreateCompanyInHubSpot(item)}>
                    Create HS Company
                  </Button>
                </TableCell>
                <TableCell>
                  <Button disabled={associatedCompanyId==''} onClick={() => handleClickRowButtonUpdateCompanyInHubSpot(item)}>
                    Update assoc. HS Company
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
        <EmptyState title="No results found" layout="vertical" reverseOrder={true}>
          <Text>Try different search input</Text>
        </EmptyState>
      )
    }
  }

  function wswHubCustomerCreateComponent() {
    return (
      <Flex direction="column" align="start" gap="flush">
        <Text format={{fontWeight: 'bold'}}>
          Erstelle Debitor in WSW-Hub
        </Text>
        <Button disabled={associatedCompanyId==''} type="button" onClick={handleClickCreateCustomerWswHub}>
          Erstellen
        </Button>
        <Text variant="microcopy">
          Nur möglich, wenn Deal-Company Assoziierung vorhanden.
        </Text>
      </Flex>
    )   
  }

  function searchResultCompanyIdForSapDebIdComponent() {
    return (
      <Flex direction="column" align="start" gap="flush">
        <Text format={{fontWeight: 'bold'}}>
          Company mit Sap Debitoren Id
        </Text>
        <Text>
          <Link href={`https://app-eu1.hubspot.com/contacts/${HS_PORTAL_ID}/record/0-2/${searchResultCompanyIdForSapDebId}`} variant="dark">Link</Link> to existing company with id {searchResultCompanyIdForSapDebId}.
        </Text>
      </Flex>
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

  function associatedHsCompanyLinkComponent() {
    return (
      <Flex direction="column" align="start" gap="flush">
        <Text>
          <Link href={`https://app-eu1.hubspot.com/contacts/${HS_PORTAL_ID}/record/0-2/${associatedCompanyId}`} variant="dark">Link</Link> to associated company {associatedCompanyName} with id {associatedCompanyId}.
        </Text>
      </Flex>
    )
  }

  // entire component
  return (
    <>
      <Heading>UI extension Data Flow</Heading>
      <Accordion title="Associated Companies" defaultOpen={true}>
        <Flex direction="row" align="start" gap="flush">
          {hsAssociatedCompaniesTableComponent()}
        </Flex>
        <Divider />
      </Accordion>
      <Accordion title="Search WSW for Company Name" defaultOpen={false}>
        <Flex direction="column" align="start" gap="flush">
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
          <Button disabled={!extensionActivated} type="submit" onClick={handleClickSearchCustomersWswHub}>
            Suchen
          </Button>
          <Divider />
          { showWswHubCustomerSearchResultTable ? wswHubCustomerSearchResultTableComponent() : null }
          { searchResultCompanyIdForSapDebIdIsVisible ? searchResultCompanyIdForSapDebIdComponent() : null }
          { newlyCreatedHsCompanyIdIsVisible ? newlyCreatedHsCompanyLinkComponent() : null }
        </Flex>
        <Divider />
      </Accordion>
      <Accordion title="Create WSW Customer from associated HS Company" defaultOpen={false}>
        { wswHubCustomerCreateComponent() }
        { (associatedCompanyId && associatedCompanyId!='')  ? associatedHsCompanyLinkComponent() : null }
      </Accordion>
    </>
  );
};
