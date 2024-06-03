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
  TextArea,
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
    const [newNoteAmount, setNewNoteAmount] = useState(null);
    const [newNoteDescription, setNewNoteDescription] = useState(null);
    const [newNoteMaterial, setNewNoteMaterial] = useState(null);
    const [newNoteKurztext, setNewNoteKurztext] = useState(null);
    const [newNoteErgaenztVon, setNewNoteErgaenztVon] = useState(null);
    const [woppUpdateNoteFormVisible,setWoppUpdateNoteFormVisible] = useState(false);
    const [woppUpdateNotePosition, setWoppUpdateNotePosition] = useState(null);
    const [woppUpdateNoteDescription, setWoppUpdateNoteDescription] = useState(null);
    const [woppUpdateNoteAmount, setWoppUpdateNoteAmount] = useState(null);
    const [woppUpdateNoteKurztext, setWoppUpdateNoteKurztext] = useState(null);
    const [woppUpdateNoteMaterial, setWoppUpdateNoteMaterial] = useState(null);
    const [woppUpdateNoteErgaenztVon, setWoppUpdateNoteErgaenztVon] = useState(null);

    function getAllWoppNotesArray(wn1,wn2,wn3) {
        let allWoppNotes = [];
        if (wn1) {
            allWoppNotes = allWoppNotes.concat(JSON.parse(wn1));
        }
        if (wn2) {
            allWoppNotes = allWoppNotes.concat(JSON.parse(wn2));
        }
        if (wn3) {
            allWoppNotes = allWoppNotes.concat(JSON.parse(wn3));
        }
        return allWoppNotes;
    }

    // useEffect fetch properties
    useEffect(() => {
        fetchProperties(["hs_object_id", "wsw_wopp_notes_1", "wsw_wopp_notes_2", "wsw_wopp_notes_3"])
        .then(properties => {
            setWoppNotes1(properties.wsw_wopp_notes_1);
            setWoppNotes2(properties.wsw_wopp_notes_2);
            setWoppNotes3(properties.wsw_wopp_notes_3);
            setAllWoppNotes(getAllWoppNotesArray(properties.wsw_wopp_notes_1,properties.wsw_wopp_notes_2,properties.wsw_wopp_notes_3));
        })
    }, [fetchProperties]);

    /*
    // useEffect get deal's associated company
    useEffect(async () => {
        const { response } = await runServerless({ name: "getWoppNotesAsArray", parameters: { woppNotes1: woppNotes1, woppNotes2: woppNotes2, woppNotes3: woppNotes3 }});
        setAssociatedCompanyId(response.statusCode == 200 ? response.body.id : '');
    }, [runServerless])
    */

    // handle clicks
    const handleClickRowButtonUpdate = async (note) => {
        setWoppUpdateNotePosition(note.position);
        setWoppUpdateNoteAmount(note.amount ? note.amount : '');
        setWoppUpdateNoteDescription(note.description ?  note.description : '');
        setWoppUpdateNoteKurztext(note.kurztext ? note.kurztext : '');
        setWoppUpdateNoteMaterial(note.material ? note.material : '');
        setWoppUpdateNoteErgaenztVon(note.ergaenzt_von ? note.ergaenzt_von : '');
        setWoppUpdateNoteFormVisible(true);
    }

    const handleClickRowButtonDelete = async (note) => {
        const { response } = await runServerless(
            {
                name: "deleteWoppNoteFromHubSpot",
                parameters: {
                    woppId: woppId,
                    woppNotes1: woppNotes1, 
                    woppNotes2: woppNotes2, 
                    woppNotes3: woppNotes3, 
                    contextInfo: contextInfo, 
                    notePosition: note['position']  
                }
            }
        )
        
        if (response.statusCode == 200) {
            sendAlert({ message: 'check pos', type: 'danger' })
        } else {
            sendAlert({ message: 'check neg', type: 'danger' })
        }
    }

    const handleClickButtonCreate = async () => {
        const { response } = await runServerless(
            { 
                name: "createWoppNoteInHubSpot", 
                parameters: { 
                    woppId: woppId,
                    newNoteMaterial: newNoteMaterial,
                    newNoteAmount: newNoteAmount,
                    newNoteDescription: newNoteDescription,
                    newNoteErgaenztVon: newNoteErgaenztVon,
                    newNoteKurztext: newNoteKurztext,
                    woppNotes1: woppNotes1,
                    woppNotes2: woppNotes2,
                    woppNotes3: woppNotes3,
                    contextInfo: contextInfo 
                } 
            }
        );

        if (response.statusCode == 200) {
            sendAlert({ message: 'check create pos', type: 'danger' })
        } else {
            sendAlert({ message: 'check create neg', type: 'danger' })
        }
    }

    const handleClickButtonUpdate = async () => {
        const { response } = await runServerless(
            { 
                name: "updateWoppNoteInHubSpot", 
                parameters: { 
                    woppId: woppId,
                    notePosition: woppUpdateNotePosition,
                    woppNotes1: woppNotes1,
                    woppNotes2: woppNotes2,
                    woppNotes3: woppNotes3,
                    updateAmount: woppUpdateNoteAmount,
                    updateMaterial: woppUpdateNoteMaterial, 
                    updateDescription: woppUpdateNoteDescription,
                    updateKurztext: woppUpdateNoteKurztext,
                    updateErgaenztVon: woppUpdateNoteErgaenztVon,
                    updateTime: new Date().toISOString(),
                    userEmail: contextInfo.user.email 
                } 
            }
        );        
        
        if (response.statusCode == 200) {
            sendAlert({ message: 'check update pos', type: 'danger' })
        } else {
            sendAlert({ message: 'check update neg', type: 'danger' })
        }
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
                            <TableRow key={note['position']}>
                                <TableCell>{note['position']}</TableCell>
                                <TableCell>{note['material']}</TableCell>
                                <TableCell>{note['kurztext']}</TableCell>
                                <TableCell>{note['amount']}</TableCell>
                                <TableCell>{note['me']}</TableCell>
                                <TableCell>{note['description']}</TableCell>
                                <TableCell>{note['ergaenzt_von']}</TableCell>
                                <TableCell>{note['updated_by']}</TableCell>
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
                <Text>There are no notes for the wopp available.</Text>
                </EmptyState>
            )
        }
    }
    
    function woppCreateNoteForm() {
        return (
            <Accordion title="Create New Note" defaultOpen={false}>
            <Form
            onSubmit={() => {
              console.log('Form submitted!');
            }}
            preventDefault={true}
          >
            <Input
              label="Material"
              name="material"
              tooltip="Please enter material"
              description="Please enter material"
              placeholder="Material"
              onChange={(value) => {
                setNewNoteMaterial(value)
              }}
            />
            <TextArea
              label="Kurztext"
              name="kurztext"
              tooltip="Please enter kurztext"
              description="Please enter kurztext"
              placeholder="Kurztext"
              onChange={(value) => {
                setNewNoteKurztext(value)
              }}
            />
            <Input
              label="Menge"
              name="menge"
              tooltip="Please enter amount"
              description="Please enter amount"
              placeholder="Menge"
              onChange={(value) => {
                setNewNoteAmount(value)
              }}
            />
            <TextArea
              label="Beschreibung"
              name="beschreibung"
              tooltip="Please enter description"
              description="Please enter description"
              placeholder="Description"
              onChange={(value) => {
                setNewNoteDescription(value)
              }}
            />
            <Input
              label="Ergänzt von"
              name="ergaenzt_von"
              tooltip="Please enter ergänzt von"
              description="Please enter ergänzt von"
              placeholder="Ergänzt von"
              onChange={(value) => {
                setNewNoteErgaenztVon(value)
              }}
            />
            <Button
              onClick={() => {
                handleClickButtonCreate()
              }}
              variant="primary"
              type="submit"
            >
              Create Note
            </Button>
          </Form>
          </Accordion>
        );
    }

    function woppUpdateNoteForm() {
        return (
            <Flex direction="column" align="start" gap="flush">
            <Divider distance='medium'></Divider>
            <Text format={{ fontWeight: 'bold' }}>
                Update Wopp Note at Position {woppUpdateNotePosition}
            </Text>
            <Form
            onSubmit={() => {
              console.log('Form submitted!');
            }}
            preventDefault={true}
          >
            <Input
              label="Material"
              name="material"
              tooltip="Please enter material"
              description="Please enter material"
              placeholder="Material"
              value={woppUpdateNoteMaterial}
              onChange={(value) => {
                setNewNoteMaterial(value)
              }}
            />
            <TextArea
              label="Kurztext"
              name="kurztext"
              tooltip="Please enter kurztext"
              description="Please enter kurztext"
              placeholder="Kurztext"
              value={woppUpdateNoteKurztext}
              onChange={(value) => {
                setNewNoteKurztext(value)
              }}
            />
            <Input
              label="Menge"
              name="menge"
              tooltip="Please enter quantity"
              description="Please enter quantity"
              placeholder="Menge"
              value={woppUpdateNoteAmount}
              onChange={(value) => {
                setNewNoteAmount(value)
              }}
            />
            <TextArea
              label="Beschreibung"
              name="beschreibung"
              tooltip="Please enter description"
              description="Please enter description"
              placeholder="Description"
              value={woppUpdateNoteDescription}
              onChange={(value) => {
                setNewNoteDescription(value)
              }}
            />
            <Input
              label="Ergänzt von"
              name="ergaenzt_von"
              tooltip="Please enter ergänzt von"
              description="Please enter ergänzt von"
              placeholder="Ergänzt von"
              value={woppUpdateNoteErgaenztVon}
              onChange={(value) => {
                setNewNoteErgaenztVon(value)
              }}
            />
            <Button
              onClick={() => {
                handleClickButtonUpdate()
              }}
              variant="primary"
              type="submit"
            >
              Update Note
            </Button>
          </Form>
          </Flex>
        );
    }

    // entire component
    return (
        <>
        <Heading>UI extension WOPP Notes</Heading>
            <Flex direction="column" align="start" gap="flush">
            { woppNotesTable() }
            { woppUpdateNoteFormVisible ? woppUpdateNoteForm(woppUpdateNotePosition) : null }
            { woppCreateNoteForm() }
            </Flex>
        </>
    );
}