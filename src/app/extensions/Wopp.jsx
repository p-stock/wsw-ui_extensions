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
const HS_CO_PARENT_CUSTOMER_PROPERTY_INTERNAL_VALUE_DEBITOREN_NUMMER_SAP = IS_PROD ? "wsw_debitor_id_erp" : "wsw_sap_id";
const HS_CO_PARENT_CUSTOMER_OBJECT_TYPE_ID = IS_PROD ? null : "2-129833360";
const HS_CO_PARENT_CUSTOMER_FULLY_QUALIFIED_NAME = IS_PROD ? null : `p${HS_PORTAL_ID}_parent_customers`;
const HS_CO_WOPP_OBJECT_TYPE_ID = IS_PROD ? null : "2-127145904";
const HS_CO_WOPP_FULLY_QUALIFIED_NAME = IS_PROD ? null : `p${HS_PORTAL_ID}_wsw_wopps`;
const HS_CO_PARENT_CUSTOMER_TO_COMPANY_ASSOCIATION_TYPE_ID = IS_PROD ? null : 59;
const HS_COMPANY_TO_CO_PARENT_CUSTOMER_ASSOCIATION_TYPE_ID = IS_PROD ? null : 60;
const HS_COMPANY_PARENT_CUSTOMER_ID_SAP_PROPERTY_SYNC_INTERNAL_VALUE = IS_PROD ? null : "wsw_parent_customer_sap_id";
const HS_COMPANY_PARENT_CUSTOMER_ID_HS_PROPERTY_SYNC_INTERNAL_VALUE = IS_PROD ? null : "wsw_parent_customer_id_hs";


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
    const woppId = context.crm.objectId;
    const [woppNotes1, setWoppNotes1] = useState("");
    const [woppNotes2, setWoppNotes2] = useState("");
    const [woppNotes3, setWoppNotes3] = useState("");
    const [showWoppNotes, setShowWoppNotes] = useState(true);
    const [allWoppNotes, setAllWoppNotes] = useState([]);

    function getAllWappNotesArray(wn1,wn2,wn3) {
        let allWappNotes = [];
        if (wn1) {
            allWappNotes = allWappNotes.concat(JSON.parse(wn1));
        }
        if (wn2) {
            allWappNotes = allWappNotes.concat(JSON.parse(wn2));
        }
        if (wn3) {
            allWappNotes = allWappNotes.concat(JSON.parse(wn3));
        }
        return allWappNotes;
    }

    // useEffect fetch properties
    useEffect(() => {
        fetchProperties(["hs_object_id", "wsw_wopp_notes_1", "wsw_wopp_notes_2", "wsw_wopp_notes_3"])
        .then(properties => {
            setWoppNotes1(properties.wsw_wopp_notes_1);
            setWoppNotes2(properties.wsw_wopp_notes_2);
            setWoppNotes3(properties.wsw_wopp_notes_3);
            setAllWoppNotes(getAllWappNotesArray(properties.wsw_wopp_notes_1,properties.wsw_wopp_notes_2,properties.wsw_wopp_notes_3));
        })
    }, [fetchProperties]);

    // useEffect get deal's associated company
    useEffect(async () => {
        const { response } = await runServerless({ name: "getWoppNotesAs", parameters: { woppNotes1: woppNotes1, woppNotes2: woppNotes2, woppNotes3: woppNotes3 }});
        setAssociatedCompanyId(response.statusCode == 200 ? response.body.id : '');
    }, [runServerless])

    // handle clicks
    const handleClickRowButtonUpdate = async () => {
        sendAlert({ message: 'check', type: 'danger' })
    }

    const handleClickRowButtonDelete = async () => {
        sendAlert({ message: 'check', type: 'danger' })
    }

    // component functions
    function woppNotesTable() {
        if (allWoppNotes.length > 0) {
            return (
                <Flex>
                    <Table paginated="true" maxVisiblePageButtons="5" showFirstLastButtons="true">
                    <TableHead>
                        <TableRow>
                        <TableHeader>Position</TableHeader>
                        <TableHeader>Material</TableHeader>
                        <TableHeader>Kurztext</TableHeader>
                        <TableHeader>Menge</TableHeader>
                        <TableHeader>ME</TableHeader>
                        <TableHeader>Beschreibung</TableHeader>
                        <TableHeader>Ergänzt von</TableHeader>
                        <TableHeader>Geändert von</TableHeader>
                        <TableHeader>Update</TableHeader>
                        <TableHeader>Delete</TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {allWoppNotes.map((note) => (
                        <TableRow key={item['Position']}>
                            <TableCell>{item['Position']}</TableCell>
                            <TableCell>{item['Material']}</TableCell>
                            <TableCell>{item['Kurztext']}</TableCell>
                            <TableCell>{item['Menge']}</TableCell>
                            <TableCell>{item['ME']}</TableCell>
                            <TableCell>{item['Beschreibung']}</TableCell>
                            <TableCell>{item['Ergänzt von']}</TableCell>
                            <TableCell>{item['Geändert von']}</TableCell>
                            <TableCell>
                            <Button onClick={() => handleClickRowButtonUpdate(note)}>
                                UPDATE
                            </Button>
                            </TableCell>
                            <TableCell>
                            <Button onClick={() => handleClickRowButtonDelete(note)}>
                                DELETE
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
    
    function woppCreateNoteForm() {
        return (
            <Text>check</Text>
        )

    }

    // entire component
    return (
        <>
        <Heading>UI extension WOPP Notes</Heading>
            <Flex direction="column" align="start" gap="flush">
            { showWoppNotes ? woppNotesTable() : null }
            { woppCreateNoteForm() }
            </Flex>
        </>
    );
}