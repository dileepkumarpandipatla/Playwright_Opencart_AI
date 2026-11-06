# Playwright OpenCart Automation

Playwright and TypeScript test framework for the OpenCart storefront, FakeStore
API, and MySQL-backed customer workflow. Tests use Playwright Test and are
selected with tags such as `@web`, `@api`, `@sanity`, and `@regression`.

## Requirements

- Node.js LTS and npm
- Docker Desktop with Docker Compose, if running in a container
- Access to the configured OpenCart application and (for database tests) its
  MySQL database
- Network access to `https://fakestoreapi.com` for API tests

## Setup

Install dependencies and create a local environment file:

```bash
npm ci
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Edit `.env` for your environment. Do not commit `.env` or put credentials in
source control.

| Variable | Purpose |
| --- | --- |
| `APP_ENV` | Environment label used by the project |
| `WEB_APP_URL` | OpenCart storefront URL |
| `APP_EMAIL`, `APP_PASSWORD` | Customer credentials for the valid-login test |
| `PRODUCT_NAME`, `PRODUCT_QUANTITY`, `TOTAL_PRICE` | Store product test data |
| `API_BASE_URL` | FakeStore API base URL |
| `USERNAME`, `PASSWORD` | API-related test data, if used by your environment |
| `USER_ID`, `PRODUCT_ID`, `CART_ID`, `LIMIT` | API test record IDs and result limit |
| `START_DATE`, `END_DATE` | Cart date-range test data |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | OpenCart admin portal credentials |

Install the browser used by the current Playwright configuration:

```bash
npx playwright install chromium
```

The database workflow needs a reachable MySQL database with the configured
OpenCart schema. API tests call FakeStore directly and do not require a local
API service. A remote API may reject traffic from hosted CI runners even when
the same tests work locally.

## Run tests locally

Run all tests:

```bash
npx playwright test --project=chromium
```

Run a tagged suite using the npm scripts:

```bash
npm run test:master
npm run test:sanity
npm run test:regression
npm run test:api
npm run test:web
npm run test:e2e
npm run test:datadriven
```

Run one test file:

```bash
npx playwright test tests/api/products-api.spec.ts --project=chromium
npx playwright test tests/web/valid-login-flow.spec.ts --project=chromium
```

Filter by a tag or run with a browser UI:

```bash
npx playwright test --grep "@api" --project=chromium
npx playwright test --grep "@sanity" --project=chromium --headed
npx playwright test --grep "@sanity" --project=chromium --debug
```

Pass additional Playwright options to an npm script after `--`:

```bash
npm run test:api -- --project=chromium --workers=1
npm run test:web -- --project=chromium --headed
```

`playwright.config.ts` currently enables the Chromium project. Firefox and
WebKit project definitions are commented out; enable and install those browsers
before selecting them.

## Run tests with Docker Compose

Create and edit `.env` as described above, then build and run all tests:

```bash
docker compose build
docker compose run --build --rm playwright-tests all
```

Run a specific suite or test with optional Playwright arguments:

```bash
docker compose run --build --rm playwright-tests api
docker compose run --build --rm playwright-tests web --project=chromium
docker compose run --build --rm playwright-tests all --grep "@sanity" --project=chromium
```

The container uses the Playwright image pinned in the `Dockerfile` and runs
headless in CI mode. Reports and test results are bind-mounted into the project
directory. Stop any remaining Compose resources with:

```bash
docker compose down --remove-orphans
```

The container entrypoint accepts `all`, `master`, `sanity`, `regression`,
`api`, `web`, `e2e`, and `datadriven`, followed by optional Playwright
arguments.

## CI execution

### GitHub Actions

The workflow in `.github/workflows/playwright.yml` runs on pushes and pull
requests to `master`. To start it manually, open **Actions → Playwright Tests →
Run workflow**, then select a suite, browser, and mode. The `test:api` suite is
available for API-only runs. The workflow uploads Playwright HTML, JUnit, and
Allure reports as artifacts.

Configure required credentials as GitHub Actions secrets before running
credential-dependent web or database tests. The workflow currently runs on
`windows-latest`; hosted-runner network restrictions may prevent access to an
external API.

### Jenkins

Run the `Jenkinsfile` pipeline on a Windows Jenkins agent with Docker CLI,
Docker Compose, and a working Docker Engine. Configure these Jenkins string
credentials before starting a build:

```text
APP_EMAIL
APP_PASSWORD
API_PASSWORD
DB_PASSWORD
ADMIN_USERNAME
ADMIN_PASSWORD
```

Start a build with the Jenkins parameters:

- `TEST_SUITE`: `e2e`, `all`, `master`, `sanity`, `regression`, `api`, `web`,
  or `datadriven`
- `BROWSER`: `chromium`, `firefox`, or `webkit`
- `MODE`: `headless` or `headed`

As with local runs, the selected browser must be enabled in
`playwright.config.ts` and available in the Docker image. The pipeline builds
the image, runs the selected suite, and publishes test reports and artifacts.

## Reports and debugging

Playwright writes its HTML report to `playwright-report/`, JUnit XML to
`junit-report/results.xml`, Allure raw results to `allure-results/`, and test
artifacts to `test-results/`.

Generate and open the Allure report after a test run:

```bash
npm run allure:generate
npm run allure:open
```

The HTML report can be opened locally with:

```bash
npx playwright show-report playwright-report
```
