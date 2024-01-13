import Head from 'next/head'
import {Inter} from 'next/font/google'
import styles from '@/styles/Home.module.css'
import {Button, ButtonGroup, ButtonToolbar, Col, Container, OverlayTrigger, Row, Table} from "react-bootstrap";
import {useEffect, useState} from "react";

const psl = require('psl');
const inter = Inter({subsets: ['latin']})

const gdprStrategies = {
    allowAll: "Allow all",
    functionalOnly: "Functional only",
}

let blockedDomains = []
let blockAll = false
let allowAll = false

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

function countElementsArrByKey(arr, key) {
    var res = 0;
    arr.forEach(function (i) {
        i.purpose === key ? res++ : res;
    });
    return res;
}

export default function Home() {

    const [cookies, setCookies] = useState([{name: "test", purpose: "test", domain: "test", value: "test"}])
    const [gdprStrategy, setGdprStrategy] = useState("allowAll") // allowAll, functionalOnly,
    const loadCookies = async () => {
        console.log("Loading cookies")
        const allTabs = await chrome.tabs.query({currentWindow: true, active: true}, async (tabs) => {
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
        //loadCookies()
        DeleteAllBlockedDomainsCookies()
    }, []);
    return (
        <div style={{backgroundColor: "white"}}>
            <Head>
                <title>Cool Cookie Tool</title>
            </Head>
            <main>
                <Container style={{marginTop: "1em", marginLeft: "1em", marginRight: "1em"}}>
                    <Row>
                        <Col>
                            <div className="dropdown">
                                <button className="btn btn-primary dropdown-toggle" type="button"
                                        id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true"
                                        aria-expanded="false">
                                    {gdprStrategies[gdprStrategy]}
                                </button>
                                <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                    <a className="dropdown-item" href="#">{gdprStrategies.allowAll}</a>
                                    <a className="dropdown-item" href="#">{gdprStrategies.functionalOnly}</a>
                                </div>
                            </div>
                        </Col>
                        <Col><Button variant={"danger"} onClick={BlockAllCookies}>Block all</Button></Col>
                        <Col><Button variant={"success"} onClick={AllowAllCookies}>Allow all</Button></Col>
                        <Col><Button onClick={BlockDomainCookies}>Block this domain</Button></Col>
                    </Row>
                    <Row style={{marginTop: "0.5em"}}>
                        <Col><Button variant={"outline-dark"}>Marketing <span className="badge badge-dark"
                                                                              style={{backgroundColor: "black"}}>
                            {countElementsArrByKey(cookies, "marketing")}
                        </span></Button></Col>
                        <Col><Button variant={"outline-dark"}>Analytics <span className="badge badge-dark"
                                                                              style={{backgroundColor: "black"}}>
                            {countElementsArrByKey(cookies, "analytics")}</span></Button></Col>
                        <Col><Button variant={"outline-dark"}>Tracking <span className="badge badge-dark"
                                                                             style={{backgroundColor: "black"}}>
                            {countElementsArrByKey(cookies, "tracking")}</span></Button></Col>
                        <Col><Button variant={"outline-dark"}>Functional <span className="badge badge-dark"
                                                                               style={{backgroundColor: "black"}}>
                            {countElementsArrByKey(cookies, "functional")}</span></Button></Col>
                    </Row>
                    <Row style={{marginTop: "0.5em"}}>
                        <Table striped bordered hover variant={"light"}>
                            <thead>
                            <tr>
                                <th style={{maxWidth: "30px", wordWrap: "break-word"}}>Name</th>
                                <th>Purpose</th>
                                <th>Domain</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {cookies.map((cookie, i) => <tr key={i}>
                                    <td>{cookie.name}</td>
                                    <td>{cookie.purpose}</td>
                                    <td>{cookie.domain}</td>
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

function AllowAllCookies()
{
    console.log("AllowAllCookies")
    if (!allowAll)
    {
        allowAll = true
        blockAll = false
    }
    else
    {
        allowAll = false
    }
}

function BlockAllCookies()
{
    console.log("BlockAllCookies")
    if (!blockAll)
    {
        blockAll = true
        allowAll = false
    }
    else
    {
        blockAll = false
    }
}

function BlockDomainCookies()
{
    const domain = window.location.hostname
    console.log("BlockDomainCookies")
    if (!blockedDomains.includes(domain))
    {
        blockedDomains.push(domain)
        DeleteDomainCookies(domain)
    }
    console.log(blockedDomains)
}

async function DeleteDomainCookies(domain)
{
    console.log("DeleteDomainCookies")
    let cookiesDeleted = 0;
    try {
        const cookies = await chrome.cookies.getAll({ domain });

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

async function DeleteAllBlockedDomainsCookies()
{
    blockedDomains.forEach((domain) => DeleteDomainCookies(domain))
}

function deleteCookie(cookie) {
    // Cookie deletion is largely modeled off of how deleting cookies works when using HTTP headers.
    // Specific flags on the cookie object like `secure` or `hostOnly` are not exposed for deletion
    // purposes. Instead, cookies are deleted by URL, name, and storeId. Unlike HTTP headers, though,
    // we don't have to delete cookies by setting Max-Age=0; we have a method for that ;)
    //
    // To remove cookies set with a Secure attribute, we must provide the correct protocol in the
    // details object's `url` property.
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#Secure
    const protocol = cookie.secure ? 'https:' : 'http:';
  
    // Note that the final URL may not be valid. The domain value for a standard cookie is prefixed
    // with a period (invalid) while cookies that are set to `cookie.hostOnly == true` do not have
    // this prefix (valid).
    // https://developer.chrome.com/docs/extensions/reference/cookies/#type-Cookie
    const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;
  
    return chrome.cookies.remove({
      url: cookieUrl,
      name: cookie.name,
      storeId: cookie.storeId
    });
  }