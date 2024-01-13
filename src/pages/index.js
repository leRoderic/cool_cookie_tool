import Head from 'next/head'
import {Inter} from 'next/font/google'
import {Badge, Button, Col, Container, OverlayTrigger, Row, Spinner, Table} from "react-bootstrap";
import {useEffect, useState} from "react";

const psl = require('psl');
const inter = Inter({subsets: ['latin']})
const csvFileUrl = 'https://raw.githubusercontent.com/jkwakman/Open-Cookie-Database/master/open-cookie-database.csv';

const gdprStrategies = {
    allowAll: {
        key: "allowAll",
        title: "Allow all cookies",
    },
    blockAll: {
        key: "blockAll",
        title: "Block all cookies",
    },
    blockDomain: {
        key: "blockDomain",
        title: "Block domain cookies",
    },
}

const gdprResults = {
    unknown: {
        key: "unknown",
        title: "Unknown",
        variant: "secondary"
    },
    compliant: {
        key: "compliant",
        title: "Compliant",
        variant: "success"
    },
    nonCompliant: {
        key: "nonCompliant",
        title: "Non-compliant",
        variant: "danger"
    }
}


let blockedDomains = []
let blockAll = false
let allowAll = false

function extractHostname(url) {
    var hostname;
    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    } else {
        hostname = url.split('/')[0];
    }
    hostname = hostname.split(':')[0];
    hostname = hostname.split('?')[0];

    return hostname;
}

function countElementsArrByKey(arr, key) {
    var res = 0;
    arr.forEach(function (i) {
        i.purpose === key ? res++ : res;
    });
    return res;
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
        cookieMap.set(obj['ID'], obj)
    }
    return cookieMap
}

export default function Home() {

    const [cookies, setCookies] = useState([{
        name: "Test",
        purpose: "test",
        domain: "test",
        value: "test"
    }])
    const [gdprStrategy, setGdprStrategy] = useState(gdprStrategies.allowAll)
    const [performingGDPRCheck, setPerformingGDPRCheck] = useState(false);
    const [gdprCheckResult, setGdprCheckResult] = useState(gdprResults.unknown);

    const fetchCsvData = async () => {
        try {
            const response = await fetch(csvFileUrl);
            const csvData = await response.text();
            const processedData = processData(csvData);
            if (process.env.NODE_ENV !== "development") {
                loadCookies(processedData);
            }
        } catch (error) {
            throw error;
        }
    };

    const loadCookies = async (csvData) => {
        const allTabs = await chrome.tabs.query({currentWindow: true, active: true}, async (tabs) => {
            let tabsUrls = tabs.map((tab) => psl.get(extractHostname(tab.url)))
            await chrome.cookies.getAll({}, (cookies) => {
                let arr = []
                cookies.map((cookie) => {
                    if (tabsUrls.includes(psl.get(extractHostname(cookie.domain)))) {
                        cookie.purpose = checkCSV(csvData, cookie.name)
                        console.log(cookie)
                        arr.push(cookie)
                    }
                })
                setCookies(arr)
            })
        });
    }
    useEffect(() => {
        fetchCsvData()
        deleteAllBlockedDomainsCookies()
    }, [gdprStrategy]);

    const checkCSV = (csvData, cookie_name) => {
        for (const [key, value] of csvData) {
            if (value["Cookie / Data Key name"] === cookie_name) {
                return value["Category"];
            }
        }
        return "";
    };

    function blockAllCookies() {
        setGdprStrategy(gdprStrategies.blockAll)

        if (!blockAll) {
            blockAll = true
            allowAll = false
        } else {
            blockAll = false
        }
    }

    function allowAllCookies() {
        setGdprStrategy(gdprStrategies.allowAll)

        if (!allowAll) {
            allowAll = true
            blockAll = false
        } else {
            allowAll = false
        }
    }

    function blockDomainCookies() {
        setGdprStrategy(gdprStrategies.blockDomain)

        const domain = window.location.hostname

        if (!blockedDomains.includes(domain)) {
            blockedDomains.push(domain)
            deleteDomainCookies(domain)
        }
    }

    async function deleteDomainCookies(domain) {
        console.log("DeleteDomainCookies")
        let cookiesDeleted = 0;
        try {
            const cookies = await chrome.cookies.getAll({domain});

            if (cookies.length === 0) {
                return 'No cookies found';
            }

            let pending = cookies.map(deleteCookie);
            await Promise.all(pending);

            cookiesDeleted = pending.length;
        } catch (error) {
            return `Unexpected error: ${error.message}`;
        }

        return `Deleted ${cookiesDeleted} cookie(s).`;
    }

    async function deleteAllBlockedDomainsCookies() {
        if (!allowAll) {
            blockedDomains.forEach((domain) => deleteDomainCookies(domain))
        }
    }

    function deleteCookie(cookie) {
        const protocol = cookie.secure ? 'https:' : 'http:';
        const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;

        return chrome.cookies.remove({
            url: cookieUrl,
            name: cookie.name,
            storeId: cookie.storeId
        });
    }

    function doGDPRCheck() {
        if (!performingGDPRCheck) {
            setPerformingGDPRCheck(true)
            // Timeout of 5 seconds
            setTimeout(() => {
                setPerformingGDPRCheck(false)
                setGdprCheckResult(gdprResults.nonCompliant)
            }, 5000)
        }
    }

    function shortTextIfTooLong(text) {
        if (text.length > 30) {
            return (
                <OverlayTrigger overlay={
                    <div style={{
                        position: 'absolute',
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        padding: '2px 10px',
                        borderRadius: 3,
                        color: "white"
                    }}>
                        {text}</div>}
                                placement={"bottom"}>
                    <Button variant={"dark"} size={"sm"}>{text.substring(0, 30) + "..."}</Button>
                </OverlayTrigger>
            )
        }
        return text
    }

    return (
        <div style={{backgroundColor: "white"}}>
            <Head>
                <title>Cool Cookie Tool</title>
            </Head>
            <main>
                <Container style={{marginTop: "1em", marginLeft: "1em", marginRight: "1em"}}>
                    <Row>
                        <Col>
                            <Button variant={"outline-dark"} onClick={doGDPRCheck}>Check GDPR &nbsp;
                                {performingGDPRCheck && <Spinner animation="grow" size={"sm"} variant="dark"/>
                                }
                                {!performingGDPRCheck &&
                                    <Badge bg={gdprCheckResult.variant}>{gdprCheckResult.title}</Badge>}
                            </Button>
                        </Col>
                        <Col>
                            {gdprStrategy.key === gdprStrategies.blockAll.key &&
                                <Button variant={"danger"} key={gdprStrategies.blockAll.key}
                                        style={{border: "2px solid black"}}
                                        onClick={blockAllCookies}>
                                    {gdprStrategies.blockAll.title}
                                </Button>
                            }
                            {gdprStrategy.key !== gdprStrategies.blockAll.key &&
                                <Button variant={"danger"} key={gdprStrategies.blockAll.key}
                                        onClick={blockAllCookies}>
                                    {gdprStrategies.blockAll.title}
                                </Button>}
                        </Col>
                        <Col>
                            {gdprStrategy.key === gdprStrategies.allowAll.key &&
                                <Button variant={"success"} onClick={allowAllCookies}
                                        style={{border: "2px solid black"}}>
                                    {gdprStrategies.allowAll.title}
                                </Button>
                            }
                            {gdprStrategy.key !== gdprStrategies.allowAll.key &&
                                <Button variant={"success"} onClick={allowAllCookies}>
                                    {gdprStrategies.allowAll.title}
                                </Button>
                            }
                        </Col>
                        <Col>
                            {gdprStrategy.key === gdprStrategies.blockDomain.key &&
                                <Button onClick={blockDomainCookies}
                                        style={{border: "2px solid black"}}>
                                    {gdprStrategies.blockDomain.title}
                                </Button>
                            }
                            {gdprStrategy.key !== gdprStrategies.blockDomain.key &&
                                <Button onClick={blockDomainCookies}>
                                    {gdprStrategies.blockDomain.title}
                                </Button>
                            }
                        </Col>
                    </Row>
                    <Row style={{marginTop: "0.5em"}}>
                        <Col>
                            <Button variant={"outline-dark"}>Marketing <span className="badge badge-dark"
                                                                             style={{backgroundColor: "black"}}>
                            {countElementsArrByKey(cookies, "Marketing")}
                        </span>
                            </Button>
                        </Col>
                        <Col>
                            <Button variant={"outline-dark"}>Analytics <span className="badge badge-dark"
                                                                             style={{backgroundColor: "black"}}>
                            {countElementsArrByKey(cookies, "Analytics")}</span>
                            </Button>
                        </Col>
                        <Col>
                            <Button variant={"outline-dark"}>Functional <span className="badge badge-dark"
                                                                              style={{backgroundColor: "black"}}>
                            {countElementsArrByKey(cookies, "Functional")}</span>
                            </Button>
                        </Col>
                    </Row>
                    <Row style={{marginTop: "0.5em"}}>
                        <Table striped bordered hover variant={"light"}>
                            <thead>
                            <tr>
                                <th style={{maxWidth: "30px", wordWrap: "break-word"}}>Name</th>
                                <th>Domain</th>
                                <th>Purpose</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {cookies.map((cookie, i) => <tr key={i}>
                                    <td style={{
                                        maxWidth: "140px",
                                        wordWrap: "break-word"
                                    }}>{shortTextIfTooLong(cookie.name)}</td>
                                    <td>{shortTextIfTooLong(cookie.domain)}</td>
                                    <td>{cookie.purpose}</td>
                                    <td>
                                        <OverlayTrigger overlay={
                                            <div style={{
                                                position: 'absolute',
                                                backgroundColor: 'rgba(0,0,0,0.85)',
                                                padding: '2px 10px',
                                                borderRadius: 3,
                                                color: "white"
                                            }}>
                                                {cookie.value}</div>}
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