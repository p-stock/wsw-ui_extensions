import React, { useState, useEffect } from "react";
import {
  Divider,
  Link,
  Button,
  EmptyState,
  Text,
  Input,
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Flex,
  hubspot,
} from "@hubspot/ui-extensions";

const HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP = "wsw_debitor_id_erp";

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
  const [wswHubCustomers, setWswHubCustomers] = useState([]);
  const [showWswHubCustomerSearchResultTable, setWswHubCustomerSearchResultTable] = useState(false);
  const contextInfo = context;
  const companyId = context.crm.objectId;

  // useEffect fetch properties
  useEffect(() => {
    fetchProperties(["hs_object_id", "name", HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP])
      .then(properties => {
        setCompanyName(properties.name);
        setDebitorenIdSap(properties[HS_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP])
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
    const { response } = await runServerless(
      { 
        name: "searchCustomerWswHub", 
        parameters: { 
          companyName: companyName
        } 
      }
    );
    if (response.statusCode == 200) {
      sendAlert({ message: response.message });
      setWswHubCustomers(response.body);
      setWswHubCustomerSearchResultTable(true);
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
              <TableHeader>Name</TableHeader>
            
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
                  <Button onClick={() => handleRowButtonClick(item)}>
                    Action
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

  // entire component
  return (
    <>
      <Text>
        <Text format={{ fontWeight: "bold" }}>
          UI extension Data Flow
        </Text>
      </Text>
      <Text>Debitorennummer {debitorenIdSap}</Text>
      <Flex direction="row" align="end" gap="small">
        <Button type="submit" onClick={handleClickSearchCustomersWswHub}>
          Prüfe auf Debitorennummer
        </Button>
      </Flex>
      <Divider />
      { showWswHubCustomerSearchResultTable == true ? wswHubCustomerSearchResultTableComponent() : null }
      <Text>
      </Text>
    </>
  );
};
