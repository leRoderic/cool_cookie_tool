# TMA 2023 (UPC MCYBERS) - A4: Cool Cookie Tool

## What is this

The project consists on three components:
- <u>Chrome extension:</u> Extension that categorizes cookies of the current opened and active tab and allows the user to block them. Optionally, if the webdriver is configured, it will perform GDPR compliance checks on a website's cookies banner.
- <u>Selenium WebDriver server:</u> Is used by the Chrome extension for performing the GDPR compliance check.
- <u>Web crawler:</u> Used to compute the GDPR compliance check offline and/or in bulk.


### Chrome extension
- Built with React and Next.js.
- Located in 'chrome_extension' directory.

#### How to run
- <u>Requisites:</u> Node.js.
1. Clone the repository or download the source code an extract it to a folder of your choice.

2. Install the dependencies (inside of 'chrome_extension'):
    ```bash
    npm install
    ```
##### Running the development server
> **IMPORTANT NOTE**
>
> The Chrome API used by the extension is not available when developing locally. 
> 
> To test the extension, you must build it and install it in Chrome.

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) with your browser.

##### Build and deploy the Chrome extension
1. If running, stop the development server.
2. Build the project:
    ```bash
    npm run build
    ```
3. Go to the Chrome extensions page URL (`chrome://extensions/`).
4. Enable the "Developer mode" toggle (it is located in the top-right corner of the page).
5. Click the "Load unpacked" button (it is located in the top-left corner of the page).
6. Navigate to the project directory and select the 'out' folder.
7. The extension should now be installed and ready to use.

### Selenium WebDriver server
- Built with Flask.
- Located in 'selenium_webdriver_server' directory.

#### How to run (Docker)
- <u>Requisites:</u> Docker.
1. Clone the repository or download the source code an extract it to a folder of your choice.
2. Build the Docker image (inside of 'selenium_webdriver_server')
	```bash
    docker build . -t tma2023-cool-cookie-tool
    ```
3. Run the container:
    ```bash
    docker run -d --name tma2023-cct -p 5000:5000 tma2023-cool-cookie-tool
    ```

#### How to run (Development)
- <u>Requisites:</u> Python 3.11.
1. Clone the repository or download the source code an extract it to a folder of your choice.
2. Create virtual env (inside of 'selenium_webdriver_server'):
    ```bash
    python3 -m venv env
    ```
2. Install requirements.
	```bash
    env/bin/python3 -m pip install -r requirements.txt
    ```
3. Start the server:
    ```bash
    env/bin/python3 app.py
    ```


### Web crawler
- Built in Python.
- Located in 'selenium_webdriver_server' directory, file 'gdpr_compliance_checker.py' (sample input file is 'ranked_domains.csv').

#### How to run (Docker)
- <u>Requisites:</u> Docker.
1. Clone the repository or download the source code an extract it to a folder of your choice.
2. Build the Docker image (inside of 'selenium_webdriver_server')
	```bash
    docker build . -t tma2023-cool-cookie-tool
    ```
3. Run the container:
    ```bash
    docker run -d --name tma2023-cct -p 5000:5000 tma2023-cool-cookie-tool bash
    ```
4. Execute:
    ```bash
    python gdpr_compliance_checker.py
    ```

#### How to run (Development)
- <u>Requisites:</u> Python 3.11.
1. Clone the repository or download the source code an extract it to a folder of your choice.
2. Create virtual env (inside of 'selenium_webdriver_server'):
    ```bash
    python3 -m venv env
    ```
2. Install requirements.
	```bash
    env/bin/python3 -m pip install -r requirements.txt
    ```
3. Execute:
    ```bash
    env/bin/python3 gdpr_compliance_checker.py
    ```