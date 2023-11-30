import Head from 'next/head'
import {Inter} from 'next/font/google'
import styles from '@/styles/Home.module.css'
import {Button, ButtonGroup, ButtonToolbar, Col, Container, OverlayTrigger, Row, Table} from "react-bootstrap";
import {useEffect, useState} from "react";
const psl = require('psl');
const inter = Inter({subsets: ['latin']})
const csvFileUrl = 'https://raw.githubusercontent.com/jkwakman/Open-Cookie-Database/master/open-cookie-database.csv';
function extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    } else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}
function processData(csvData) {
    var lines = csvData.split('\n');
    var result = [];
    var headers = lines[0].split(',');
    var cookieMap = new Map();
    for (var i = 1; i < lines.length; i++) {
      var obj = {};
      var currentline = lines[i].split(',');
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }
      //result.push(obj);
      cookieMap.set(obj['ID'], obj)
    }
    // console.log(cookieMap);
    return cookieMap
}


export default function Home() {
    (async () => {
        try {
          const csv_data = await fetch(csvFileUrl)
            .then(response => response.text())
            .then(res => processData(res))
            .catch(error => {
              console.error('Error fetching or processing the file:', error);
              // Handle the error
              throw error; // Rethrow the error to ensure 'done' is logged
            });
      
          console.log('Processed CSV data:', csv_data);
        } finally {
          console.log('done');
        }
      })();

    const [cookies, setCookies] = useState([{name: "test", purpose: "test", domain: "test", value: "test"}])

    const loadCookies = async () => {
        console.log("Loading cookies")
        const allTabs = await chrome.tabs.query({}, async (tabs) => {
            let tabsUrls = tabs.map((tab) => psl.get(extractHostname(tab.url)))
            await chrome.cookies.getAll({}, (cookies) => {
                let arr = []
                cookies.map((cookie) => {
                    if (tabsUrls.includes(psl.get(extractHostname(cookie.domain)))) {
                        arr.push(cookie)
                    }
                })
                setCookies(arr)
            })
        });
    }
    useEffect(() => {
        loadCookies()
    }, []);
    // if (csv_data.has("f42b671a-b7ba-4e34-a886-6fbb1705d979")){
    //     console.log("AAAAAA")
    // }else{
    //     console.log("BBBBB")
    // }
    const checkCSV = (name) => {
        console.log('In function');
        if (name == 'twitch.lohp.countryCode') {
          return true;
        } else {
          return false;
        }
    };
    return (
        <div style={{backgroundColor: "white"}}>
            <Head>
                <title>Cool Cookie Tool</title>
            </Head>
            <main>
                <Container style={{marginTop: "1em", marginLeft: "1em", marginRight: "1em"}}>
                    <Row>
                        <Col><Button variant={"danger"} onClick={loadCookies}>Block all</Button></Col>
                        <Col><Button variant={"success"}>Allow all</Button></Col>
                    </Row>
                    <Row style={{marginTop: "0.5em"}}>
                        <Col><Button variant={"outline-dark"}>Marketing</Button></Col>
                        <Col><Button variant={"outline-dark"}>Analytics</Button></Col>
                        <Col><Button variant={"outline-dark"}>Functional</Button></Col>
                        <Col><Button variant={"outline-dark"}>Tracking</Button></Col>
                    </Row>
                    <Row style={{marginTop: "0.5em"}}>
                        <Table striped bordered hover variant={"light"}>
                            <thead>
                            <tr>
                                <th style={{maxWidth: "30px", wordWrap: "break-word"}}>Name</th>
                                <th>Purpose</th>
                                <th>Domain</th>
                                <th>in CSV</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {cookies.map((cookie, i) => <tr key={i}>
                                    <td>{cookie.name}</td>
                                    <td>{cookie.purpose}</td>
                                    <td>{cookie.domain}</td>
                                    <td>{checkCSV(cookie.name) ? 'Yes' : 'No'}</td>
                                    <td>
                                        <OverlayTrigger overlay={<div style={{color: "black"}}>{cookie.value}</div>}
                                                        placement={"bottom"}>
                                            <Button variant={"light"}>View value</Button>
                                        </OverlayTrigger>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </Table>
                    </Row>
                </Container>
            </main>
        </div>
    )
}
