import csv
import os
import sys

from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time


def click_button(driver, xpath, action, timeout=10):
    try:
        WebDriverWait(driver, timeout).until(EC.element_to_be_clickable((By.XPATH, xpath))).click()
        print(f"{action} on button found with XPath: {xpath}")
        return True
    except TimeoutException:
        print(f"No '{action}' button found within timeout on {driver.current_url}")
        return False
    except Exception as e:
        print(f"Error {action} the button with XPath {xpath}: {e}")
        return False


def analyze_cookies(driver, action):
    xpath_map = {
        "accept": (
            "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ', 'abcdefghijklmnopqrstuvwxyzáéíóúüñ'), 'accept') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ', 'abcdefghijklmnopqrstuvwxyzáéíóúüñ'), 'allow') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ', 'abcdefghijklmnopqrstuvwxyzáéíóúüñ'), 'agree') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ', 'abcdefghijklmnopqrstuvwxyzáéíóúüñ'), 'aceptar') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ', 'abcdefghijklmnopqrstuvwxyzáéíóúüñ'), 'permitir')] | "
            "//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ', 'abcdefghijklmnopqrstuvwxyzáéíóúüñ'), 'accept') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ', 'abcdefghijklmnopqrstuvwxyzáéíóúüñ'), 'allow') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ', 'abcdefghijklmnopqrstuvwxyzáéíóúüñ'), 'agree') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ', 'abcdefghijklmnopqrstuvwxyzáéíóúüñ'), 'aceptar') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ', 'abcdefghijklmnopqrstuvwxyzáéíóúüñ'), 'permitir')]"
        ),
        "decline": (
            "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'decline') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ', 'abcdefghijklmnopqrstuvwxyzáéíóúüñ'), 'disagree') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'reject') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'rechazar')] | "
            "//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'decline') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÜÑ', 'abcdefghijklmnopqrstuvwxyzáéíóúüñ'), 'disagree') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'reject') or "
            "contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'rechazar')]"
        )
    }
    clicked = click_button(driver, xpath_map[action], action.capitalize())
    time.sleep(5)
    return len(driver.get_cookies()), clicked


def check_trackers(driver):
    tracker_names = ["_ga", "_gid", "_gat", "fbp", "fr"]
    cookies = driver.get_cookies()
    return [cookie for cookie in cookies if cookie['name'] in tracker_names]


def analyze_website(url, options, service, server_return=False):
    gdpr_compliant = None
    try:
        driver = webdriver.Chrome(service=service, options=options)
        driver.get(url)
        cookies_after_accept, banner_detected_accept = analyze_cookies(driver, "accept")
        if not banner_detected_accept:
            print(f"No cookie banner detected on {url}. Skipping...")
            driver.quit()
            if server_return:
                return None
            return

        driver.delete_all_cookies()
        driver.get(url)
        cookies_after_decline, banner_detected_decline = analyze_cookies(driver, "decline")

        gdpr_compliant = cookies_after_decline < cookies_after_accept
        if cookies_after_accept == cookies_after_decline:
            tracking_cookies = check_trackers(driver)
            gdpr_compliant = len(tracking_cookies) == 0
            if not gdpr_compliant:
                print(f"Non-GDPR compliant cookies found after declining on {url}: {tracking_cookies}")
            else:
                print(f"No change in cookies, but no tracking cookies found on {url}. GDPR compliant: {gdpr_compliant}")
        else:
            print(f"Cookies reduced after declining on {url}. GDPR compliant: {gdpr_compliant}")

    except Exception as e:
        print(f"Error accessing {url}: {e}")
    finally:
        driver.quit()
        if gdpr_compliant is not None:
            return gdpr_compliant
        return None


def read_csv_and_analyze(file_path):
    options = Options()

    if os.name == "nt":
        WD_PATH = "webdrivers/chromedriver_win64.exe"
    elif os.name == "posix":
        WD_PATH = "webdrivers/chromedriver_linux64"

    if not WD_PATH:
        sys.exit("No webdriver")

    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--incognito")
    options.add_argument("--lang=es")
    options.binary_location = "/usr/bin/google-chrome"
    service = ChromeService(executable_path=WD_PATH)

    with open(file_path, mode='r', newline='', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            url = "https://" + row["Domain"]
            print(f"\nAnalyzing: {url}")
            analyze_website(url, options, service)


if __name__ == "__main__":
    csv_file_path = "ranked_domains.csv"
    read_csv_and_analyze(csv_file_path)
