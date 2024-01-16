import Head from 'next/head'
import {Inter} from 'next/font/google'
import {Badge, Button, Col, Container, OverlayTrigger, Row, Spinner, Table} from "react-bootstrap";
import {useEffect, useState} from "react";
import axios from "axios";
import {SELENIUM_SERVER} from "../config/settings.js";

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

const cookieCategories = {
    marketing: {
        key: "marketing",
        title: "Marketing",
        filter: "Marketing"
    },
    analytics: {
        key: "analytics",
        title: "Analytics",
        filter: "Analytics"
    },
    functional: {
        key: "functional",
        title: "Functional",
        filter: "Functional"
    },
    other: {
        key: "other",
        title: "Other",
        filter: ""
    },
    none: {
        key: "none",
        title: "None",
        filter: ""
    }
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

function countElementsArrByPurposeKey(arr, key) {
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
    const [cookiesTable, setCookiesTable] = useState([{
        name: "Test",
        purpose: "test",
        domain: "test",
        value: "test"
    }])
    const [gdprStrategy, setGdprStrategy] = useState(gdprStrategies.allowAll)
    const [performingGDPRCheck, setPerformingGDPRCheck] = useState(false);
    const [gdprCheckResult, setGdprCheckResult] = useState(gdprResults.unknown);
    const [blockedDomains, setBlockedDomains] = useState([])
    const [cookieCategoryFilter, setCookieCategoryFilter] = useState(cookieCategories.none)

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
                        arr.push(cookie)
                    }
                })
                setCookies(arr)
                setCookiesTable(arr)
            })
        });
    }
    useEffect(() => {
        fetchCsvData()
        deleteAllBlockedDomainsCookies()
    }, [gdprStrategy, blockedDomains]);

    const checkCSV = (csvData, cookie_name) => {
        for (const [key, value] of csvData) {
            if (value["Cookie / Data Key name"] === cookie_name) {
                return value["Category"];
            }
        }
        return "";
    };

    function filterByMarketingPurpose() {
        filterCookiesByPurpose(cookieCategories.marketing)
    }

    function filterByAnalyticsPurpose() {
        filterCookiesByPurpose(cookieCategories.analytics)
    }

    function filterByFunctionalPurpose() {
        filterCookiesByPurpose(cookieCategories.functional)
    }

    function filterByOtherPurpose() {
        filterCookiesByPurpose(cookieCategories.other)
    }

    function filterCookiesByPurpose(purpose) {
        if (purpose.key === cookieCategoryFilter.key) {
            setCookiesTable(cookies)
            setCookieCategoryFilter(cookieCategories.none)
        } else {
            setCookieCategoryFilter(purpose)
            setCookiesTable(cookies.filter((cookie) => cookie.purpose === purpose.filter))
        }
    }

    function blockAllCookies() {
        setGdprStrategy(gdprStrategies.blockAll)
    }

    function allowAllCookies() {
        setGdprStrategy(gdprStrategies.allowAll)
    }

    async function blockDomainCookies() {
        setGdprStrategy(gdprStrategies.blockDomain)

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            var tab = tabs[0];
            var url = new URL(tab.url)
            var domain = url.hostname
            // const domain = window.location.hostname
            // console.log(domain)

            if (!blockedDomains.includes(domain)) {
                blockedDomains.push(domain)
                setBlockedDomains(blockedDomains)
                deleteDomainCookies(domain)
            }
        })
    }

    async function deleteDomainCookies(domain) {
        console.log("DeleteDomainCookies: " + domain)
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
        console.log("DeleteAllBlockedDomainsCookies")
        if (!gdprStrategy.key !== gdprStrategies.allowAll.key) {
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
            seleniumPageCheck()
        }
    }

    async function seleniumPageCheck() {

        const _ = await chrome.tabs.query({currentWindow: true, active: true}, async (tabs) => {
            let tab = tabs[0];
            let data = {website: tab.url}
            axios.post(SELENIUM_SERVER.url, data, {
                auth: SELENIUM_SERVER.auth ? {
                    username: SELENIUM_SERVER.username,
                    password: SELENIUM_SERVER.password
                } : null
            })
                .then(res => {
                    const resp = res.data;
                    setPerformingGDPRCheck(false)
                    if (resp.website_compliant) {
                        setGdprCheckResult(gdprResults.compliant)
                    } else if (resp.website_non_compliant) {
                        setGdprCheckResult(gdprResults.nonCompliant)
                    } else {
                        setGdprCheckResult(gdprResults.unknown)
                    }
                })
        })
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
                    <Button variant={"dark"} size={"sm"}>{text.substring(0, 10) + "..."}</Button>
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
                            {cookieCategoryFilter.key !== cookieCategories.marketing.key &&
                                <Button variant={"outline-dark"} onClick={filterByMarketingPurpose}>
                                    {cookieCategories.marketing.title} <span
                                    className="badge badge-dark"
                                    style={{backgroundColor: "black"}}>
                            {countElementsArrByPurposeKey(cookies, "Marketing")}
                        </span>
                                </Button>
                            }
                            {cookieCategoryFilter.key === cookieCategories.marketing.key &&
                                <Button variant={"warning"} onClick={filterByMarketingPurpose}>
                                    {cookieCategories.marketing.title} <span
                                    className="badge badge-dark"
                                    style={{backgroundColor: "black"}}>
                            {countElementsArrByPurposeKey(cookies, "Marketing")}
                        </span>
                                </Button>
                            }
                        </Col>
                        <Col>
                            {cookieCategoryFilter.key !== cookieCategories.analytics.key &&
                                <Button variant={"outline-dark"} onClick={filterByAnalyticsPurpose}>
                                    {cookieCategories.analytics.title} <span
                                    className="badge badge-dark"
                                    style={{backgroundColor: "black"}}>
                            {countElementsArrByPurposeKey(cookies, "Analytics")}</span>
                                </Button>
                            }
                            {cookieCategoryFilter.key === cookieCategories.analytics.key &&
                                <Button variant={"warning"} onClick={filterByAnalyticsPurpose}>
                                    {cookieCategories.analytics.title} <span
                                    className="badge badge-dark"
                                    style={{backgroundColor: "black"}}>
                            {countElementsArrByPurposeKey(cookies, "Analytics")}</span>
                                </Button>
                            }
                        </Col>
                        <Col>
                            {cookieCategoryFilter.key !== cookieCategories.functional.key &&
                                <Button variant={"outline-dark"}
                                        onClick={filterByFunctionalPurpose}>{cookieCategories.functional.title} <span
                                    className="badge badge-dark"
                                    style={{backgroundColor: "black"}}>
                            {countElementsArrByPurposeKey(cookies, "Functional")}</span>
                                </Button>
                            }
                            {cookieCategoryFilter.key === cookieCategories.functional.key &&
                                <Button variant={"warning"} onClick={filterByFunctionalPurpose}>
                                    {cookieCategories.functional.title} <span
                                    className="badge badge-dark"
                                    style={{backgroundColor: "black"}}>
                            {countElementsArrByPurposeKey(cookies, "Functional")}</span>
                                </Button>
                            }
                        </Col>
                        <Col>
                            {cookieCategoryFilter.key !== cookieCategories.other.key &&
                                <Button variant={"outline-dark"} onClick={filterByOtherPurpose}>
                                    {cookieCategories.other.title} <span
                                    className="badge badge-dark"
                                    style={{backgroundColor: "black"}}>
                            {countElementsArrByPurposeKey(cookies, "")}</span>
                                </Button>
                            }
                            {cookieCategoryFilter.key === cookieCategories.other.key &&
                                <Button variant={"warning"} onClick={filterByOtherPurpose}>
                                    {cookieCategories.other.title} <span
                                    className="badge badge-dark"
                                    style={{backgroundColor: "black"}}>
                            {countElementsArrByPurposeKey(cookies, "")}</span>
                                </Button>
                            }
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
                            {cookiesTable.map((cookie, i) => <tr key={i}>
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