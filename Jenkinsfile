
pipeline {

    agent any

    options {
        timestamps()
        skipDefaultCheckout(true)
        timeout(time: 60, unit: 'MINUTES')
    }

    // ==================================================
    // 1. PARAMETERS
    // ==================================================

    parameters {

        choice(
            name: 'TEST_SUITE',
            choices: [
                'test:e2e',
                'test:master',
                'test:sanity',
                'test:regression',
                'test:api',
                'test:web',
                'test:datadriven'
            ],
            description: 'Select the test suite'
        )

        choice(
            name: 'BROWSER',
            choices: ['chromium', 'firefox', 'webkit'],
            description: 'Select the browser'
        )

        choice(
            name: 'MODE',
            choices: ['headless', 'headed'],
            description: 'Select browser execution mode'
        )
    }

    // ==================================================
    // 2. ENVIRONMENT VARIABLES
    // ==================================================

    environment {
        NODE_ENV = 'test'
        CI = '1'

        ALLURE_RESULTS = 'allure-results'
        PLAYWRIGHT_REPORT = 'playwright-report'
        TEST_RESULTS = 'test-results'
        JUNIT_REPORT = 'reports/results.xml'
    }

    stages {

        // ==================================================
        // 3. INITIALIZE
        // ==================================================

        stage('🔄 Initialize') {
            steps {
                echo 'Starting Playwright Automation Pipeline'

                powershell '''
                    node --version
                    npm --version

                    if ($LASTEXITCODE -ne 0) {
                        throw "Node.js or npm is not available"
                    }
                '''
            }
        }

        // ==================================================
        // 4. CHECKOUT SOURCE CODE
        // ==================================================

        stage('📥 Checkout Source Code') {
            steps {
                checkout scm

                echo 'Source code checked out successfully'
            }
        }

        // ==================================================
        // 5. INSTALL DEPENDENCIES
        // ==================================================

        stage('📦 Install Dependencies') {
            steps {
                powershell '''
                    npm ci

                    if ($LASTEXITCODE -ne 0) {
                        throw "npm dependency installation failed"
                    }
                '''
            }
        }

        // ==================================================
        // 6. INSTALL PLAYWRIGHT BROWSERS
        // ==================================================

        stage('🎭 Install Playwright Browsers') {
            steps {
                powershell '''
                    npx playwright install

                    if ($LASTEXITCODE -ne 0) {
                        throw "Playwright browser installation failed"
                    }
                '''
            }
        }

        // ==================================================
        // 7. CREATE .ENV FILE USING JENKINS SECRETS
        // ==================================================

        stage('🔐 Prepare Environment') {
            steps {

                withCredentials([

                    string(
                        credentialsId: 'APP_EMAIL',
                        variable: 'APP_EMAIL'
                    ),

                    string(
                        credentialsId: 'APP_PASSWORD',
                        variable: 'APP_PASSWORD'
                    ),

                    string(
                        credentialsId: 'API_PASSWORD',
                        variable: 'API_PASSWORD'
                    ),

                    string(
                        credentialsId: 'DB_PASSWORD',
                        variable: 'DB_PASSWORD'
                    ),

                    string(
                        credentialsId: 'ADMIN_USERNAME',
                        variable: 'ADMIN_USERNAME'
                    ),

                    string(
                        credentialsId: 'ADMIN_PASSWORD',
                        variable: 'ADMIN_PASSWORD'
                    )

                ]) {

                    powershell '''
                        $ErrorActionPreference = 'Stop'

                        if (!(Test-Path ".env.example")) {
                            throw ".env.example file not found"
                        }

                        # Read the template file
                        $lines = Get-Content ".env.example"

                        # Replace sensitive values
                        $updatedLines = foreach ($line in $lines) {

                            switch -Regex ($line) {

                                '^APP_EMAIL=' {
                                    "APP_EMAIL=$env:APP_EMAIL"
                                    break
                                }

                                '^APP_PASSWORD=' {
                                    "APP_PASSWORD=$env:APP_PASSWORD"
                                    break
                                }

                                '^PASSWORD=' {
                                    "PASSWORD=$env:API_PASSWORD"
                                    break
                                }

                                '^DB_PASSWORD=' {
                                    "DB_PASSWORD=$env:DB_PASSWORD"
                                    break
                                }

                                '^ADMIN_USERNAME=' {
                                    "ADMIN_USERNAME=$env:ADMIN_USERNAME"
                                    break
                                }

                                '^ADMIN_PASSWORD=' {
                                    "ADMIN_PASSWORD=$env:ADMIN_PASSWORD"
                                    break
                                }

                                default {
                                    $line
                                }
                            }
                        }

                        # Create .env without printing secrets
                        $envContent = ($updatedLines -join "`r`n") + "`r`n"

                        $utf8NoBom = New-Object System.Text.UTF8Encoding $false

                        [System.IO.File]::WriteAllText(
                            (Join-Path $PWD ".env"),
                            $envContent,
                            $utf8NoBom
                        )

                        Write-Host ".env file created successfully"
                    '''
                }
            }
        }

        // ==================================================
        // 8. CLEAN OLD REPORTS
        // ==================================================

        stage('🧹 Clean Previous Reports') {
            steps {
                powershell '''
                    $folders = @(
                        "allure-results",
                        "allure-report",
                        "playwright-report",
                        "test-results",
                        "reports"
                    )

                    foreach ($folder in $folders) {

                        if (Test-Path $folder) {
                            Remove-Item $folder -Recurse -Force
                        }

                        New-Item -ItemType Directory -Path $folder -Force |
                            Out-Null
                    }

                    Write-Host "Previous reports cleaned"
                '''
            }
        }

        // ==================================================
        // 9. RUN PLAYWRIGHT TESTS
        // ==================================================

        stage('🧪 Execute Playwright Tests') {
            steps {

                script {

                    def browserFlag = "--project=${params.BROWSER}"

                    def modeFlag = params.MODE == 'headed'
                        ? '--headed'
                        : ''

                    withEnv([
                        "PW_SUITE=${params.TEST_SUITE}",
                        "PW_BROWSER_FLAG=${browserFlag}",
                        "PW_MODE_FLAG=${modeFlag}"
                    ]) {

                        powershell '''
                            $ErrorActionPreference = 'Stop'

                            $testArgs = @(
                                $env:PW_BROWSER_FLAG
                            )

                            if ($env:PW_MODE_FLAG) {
                                $testArgs += $env:PW_MODE_FLAG
                            }

                            Write-Host "Test Suite : $env:PW_SUITE"
                            Write-Host "Browser    : $env:PW_BROWSER_FLAG"
                            Write-Host "Mode       : $env:PW_MODE_FLAG"

                            npm run $env:PW_SUITE -- @testArgs

                            if ($LASTEXITCODE -ne 0) {
                                throw "Playwright test execution failed"
                            }
                        '''
                    }
                }
            }
        }
    }

    // ==================================================
    // 10. POST BUILD ACTIONS
    // ==================================================

    post {

        always {

            script {

                echo 'Publishing test execution reports'

                // JUnit Report
                junit(
                    testResults: 'reports/results.xml',
                    allowEmptyResults: true
                )

                // Allure Report
                if (fileExists('allure-results')) {

                    allure(
                        includeProperties: false,
                        results: [[path: 'allure-results']]
                    )
                }

                // Playwright HTML Report
                if (fileExists('playwright-report/index.html')) {

                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'Playwright HTML Report'
                    ])
                }

                // Archive Reports
                archiveArtifacts(
                    artifacts: '''
                        playwright-report/**,
                        allure-results/**,
                        test-results/**,
                        reports/**
                    ''',
                    allowEmptyArchive: true
                )

                // Remove sensitive environment file
                powershell '''
                    if (Test-Path ".env") {
                        Remove-Item ".env" -Force
                        Write-Host ".env file removed"
                    }
                '''
            }
        }

        // ==================================================
        // 11. SUCCESS NOTIFICATION
        // ==================================================

        success {

            emailext(
                subject: "SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <h2>Playwright Automation - SUCCESS</h2>

                    <table border="1" cellpadding="8">
                        <tr><td><b>Job</b></td><td>${env.JOB_NAME}</td></tr>
                        <tr><td><b>Build</b></td><td>#${env.BUILD_NUMBER}</td></tr>
                        <tr><td><b>Test Suite</b></td><td>${params.TEST_SUITE}</td></tr>
                        <tr><td><b>Browser</b></td><td>${params.BROWSER}</td></tr>
                        <tr><td><b>Mode</b></td><td>${params.MODE}</td></tr>
                        <tr><td><b>Status</b></td><td>SUCCESS</td></tr>
                    </table>

                      <p>
                        <a href="${env.BUILD_URL}">
                            Open Jenkins Build and Console Output
                        </a> |
						<a href="${env.BUILD_URL}">Open Jenkins Build</a> |
						<a href="${env.BUILD_URL}Playwright_20HTML_20Report">Open Playwright HTML Report</a>
                    </p>

                    <p>Playwright test execution completed successfully.</p>
                """,
                to: 'dileepkumarpaidi@gmail.com',
                mimeType: 'text/html'
            )
        }

        // ==================================================
        // 12. FAILURE NOTIFICATION
        // ==================================================

        failure {

            emailext(
                subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <h2>Playwright Automation - FAILED</h2>

                    <table border="1" cellpadding="8">
                        <tr><td><b>Job</b></td><td>${env.JOB_NAME}</td></tr>
                        <tr><td><b>Build</b></td><td>#${env.BUILD_NUMBER}</td></tr>
                        <tr><td><b>Test Suite</b></td><td>${params.TEST_SUITE}</td></tr>
                        <tr><td><b>Browser</b></td><td>${params.BROWSER}</td></tr>
                        <tr><td><b>Mode</b></td><td>${params.MODE}</td></tr>
                        <tr><td><b>Status</b></td><td>FAILED</td></tr>
                    </table>

                    <p>
                        <a href="${env.BUILD_URL}">
                            Open Jenkins Build and Console Output
                        </a> |
						<a href="${env.BUILD_URL}">Open Jenkins Build</a> |
						<a href="${env.BUILD_URL}Playwright_20HTML_20Report">Open Playwright HTML Report</a>
                    </p>

                    <p>Please check the test execution reports.</p>
                """,
                to: 'dileepkumarpaidi@gmail.com',
                mimeType: 'text/html'
            )
        }

        // ==================================================
        // 13. ABORTED NOTIFICATION
        // ==================================================

        aborted {
            echo 'Playwright pipeline was aborted'
        }
    }
}
 