import React from 'react';
import logo from './logo.svg';
import './App.css';
import {SimpleGrid, MantineProvider, Container, Grid, Group, Button, Table, Slider} from "@mantine/core";
import '@mantine/core/styles.css';

function App() {
    const elements = [
        { id: 6, value: 12.011, domain: 'C.es', purpose: 'marketing' },
        { id: 7, value: 14.007, domain: 'N.com', purpose: 'analytics' },
        { id: 39, value: 88.906, domain: 'Y.lel', purpose: 'functional' },
        { id: 56, value: 137.33, domain: 'Ba.ar', purpose: 'functional' },
        { id: 58, value: 140.12, domain: 'Ce.co.uk', purpose: 'fbi_tracking' },
    ];
    const rows = elements.map((element) => (
        <Table.Tr key={element.purpose}>
            <Table.Td>{element.id}</Table.Td>
            <Table.Td>{element.purpose}</Table.Td>
            <Table.Td>{element.domain}</Table.Td>
            <Table.Td>{element.value}</Table.Td>
        </Table.Tr>
    ));
    return (
        <div className="App">
            <MantineProvider>
                <Container>
                    <Grid>
                        <Grid.Col>
                            <Group>
                                <Button variant="default">Block all</Button>
                                <Button variant="default">Allow all</Button>
                                <Button variant="default">Third</Button>
                            </Group>
                        </Grid.Col>
                    </Grid>
                    <h3>Current cookies</h3>
                    <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Purpose</Table.Th>
                            <Table.Th>Domain</Table.Th>
                            <Table.Th>Value</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
                    <h3>Privacy configuration</h3>
                    <Slider
                        color="blue"
                        marks={[
                            { value: 20, label: 'sell data' },
                            { value: 50, label: 'a bit more private' },
                            { value: 80, label: 'not so public' },
                            { value: 100, label: 'ultra ninja' }
                        ]}
                    />
                </Container>
            </MantineProvider>
        </div>
    );
}

export default App;
