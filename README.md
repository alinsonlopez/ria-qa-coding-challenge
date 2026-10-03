# Ria QA Challenge

Six independent E2E tests using **TypeScript, Selenium WebDriver and Mocha**.

## Run

Requires Node.js 24 and Google Chrome.

```bash
npm ci
npm test
```

Headless:

```bash
npm run test:headless
```

Open the HTML report after running the tests:

```bash
npm run report:open
```

## Postman

The `postman/` folder contains the API challenge collection and screenshots. Import [the collection](postman/Ria_API_Collection.postman_collection.json) into Postman and run it.

## Findings

- **CALC-02:** Letters are removed from the amount field, but the required `Please enter a valid amount` message is not displayed.
- **REG-02:** Registration is blocked by location, preventing validation of the country selection page if you change the page to https://riamoneytransfer.com/registration the countries selector is displayed
