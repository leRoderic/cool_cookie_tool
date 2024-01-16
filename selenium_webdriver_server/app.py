import sys

from flask import Flask, request, make_response, jsonify
from flask_cors import CORS, cross_origin
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service as ChromeService
import os

from gdpr_compliance_checker import analyze_website

app = Flask(__name__)
cors = CORS(app)

WD_PATH = None

if os.name == "nt":
    WD_PATH = "webdrivers/chromedriver_win64.exe"
elif os.name == "posix":
    WD_PATH = "webdrivers/chromedriver_linux64"

if not WD_PATH:
    sys.exit("No webdriver")

options = Options()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--incognito")
options.add_argument("--lang=es")
options.binary_location = "/usr/bin/google-chrome"
service = ChromeService(executable_path=WD_PATH)


@app.route('/5D30qeNO2cu4/gdpr_check/', methods=['POST'])
def check_site_gdpr_compliance():
    data = request.get_json()
    compliant = None
    if "website" in data.keys():
        try:
            compliant = analyze_website(data["website"], options, service, server_return=True)
        except Exception as e:
            print(e)
            return make_response(jsonify({"error": "General server error"}, 500))
    return make_response(jsonify({"website_compliant": compliant}), 200)


if __name__ == "__main__":
    app.run(host="0.0.0.0")
