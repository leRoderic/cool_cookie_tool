This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## How to run

### Prerequisites
- Have a computer on hand.
- The computer must have the latest version of Google Chrome installed (without any AdBlocker preferably).
- Have [Node.js](https://nodejs.org/en/) installed, preferably the latest LTS version.


### Project setup
1. Clone the repository or download the source code an extract it to a folder of your choice.

2. Install the dependencies:
    ```bash
    npm install
    ```

### Running the development server
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

### Build and deploy the Chrome extension
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