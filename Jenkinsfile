
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
                'all',
                'e2e',
                'master',
                'sanity',
                'regression',
                'api',
                'web',
                'datadriven'
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

                echo 'Starting Playwright Docker Pipeline'

                powershell '''
                    $ErrorActionPreference = 'Stop'

                    docker --version

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker CLI is not available"
                    }

                    docker compose version

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker Compose is not available"
                    }

                    docker info

                    if ($LASTEXITCODE -ne 0) {
                        throw "Cannot connect to Docker Engine. Check Docker Desktop."
                    }

                    Write-Host "Docker Engine is available"
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
        // 5. PREPARE ENVIRONMENT USING JENKINS SECRETS
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

                        $lines = Get-Content ".env.example"

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
        // 6. CLEAN OLD REPORTS
        // ==================================================

        stage('🧹 Clean Previous Reports') {
            steps {

                powershell '''
                    $ErrorActionPreference = 'Stop'

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
        // 7. BUILD DOCKER IMAGE
        // ==================================================

        stage('🐳 Docker Build') {
            steps {

                echo 'Building Playwright Docker image'

                powershell '''
                    $ErrorActionPreference = 'Stop'

                    docker compose build

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker image build failed"
                    }

                    Write-Host "Docker image built successfully"
                '''
            }
        }

        // ==================================================
        // 8. EXECUTE PLAYWRIGHT TESTS IN DOCKER
        // ==================================================

        stage('🧪 Execute Playwright Tests') {
            steps {

                script {

                    withEnv([
                        "PW_SUITE=${params.TEST_SUITE}",
                        "PW_BROWSER=${params.BROWSER}",
                        "PW_MODE=${params.MODE}"
                    ]) {

                        powershell '''
                            $ErrorActionPreference = 'Stop'

                            $dockerArgs = @(
                                'compose',
                                'run',
                                '--rm',
                                '-T',
                                'playwright-tests',
                                $env:PW_SUITE,
                                "--project=$env:PW_BROWSER"
                            )

                            if ($env:PW_MODE -eq 'headed') {
                                $dockerArgs += '--headed'
                            }

                            Write-Host "=================================="
                            Write-Host "Playwright Docker Execution"
                            Write-Host "Suite   : $env:PW_SUITE"
                            Write-Host "Browser : $env:PW_BROWSER"
                            Write-Host "Mode    : $env:PW_MODE"
                            Write-Host "=================================="

                            & docker @dockerArgs

                            if ($LASTEXITCODE -ne 0) {
                                throw "Playwright tests failed inside Docker"
                            }

                            Write-Host "Playwright execution completed"
                        '''
                    }
                }
            }
        }
    }

    // ==================================================
    // 9. POST BUILD ACTIONS
    // ==================================================

    post {

        always {

            script {

                echo 'Publishing execution reports'

                // ------------------------------------------
                // Docker Cleanup
                // ------------------------------------------

                powershell '''
                    docker compose down --remove-orphans

                    if ($LASTEXITCODE -ne 0) {
                        Write-Warning "Docker Compose cleanup returned an error"
                    }
                '''

                // ------------------------------------------
                // JUnit Report
                // ------------------------------------------

                junit(
                    testResults: 'reports/results.xml',
                    allowEmptyResults: true
                )

                // ------------------------------------------
                // Allure Report
                // ------------------------------------------

                if (fileExists('allure-results')) {

                    allure(
                        includeProperties: false,
                        results: [[path: 'allure-results']]
                    )
                }

                // ------------------------------------------
                // Playwright HTML Report
                // ------------------------------------------

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

                // ------------------------------------------
                // Archive Reports
                // ------------------------------------------

                archiveArtifacts(
                    artifacts: '''
                        playwright-report/**,
                        allure-results/**,
                        allure-report/**,
                        test-results/**,
                        reports/**
                    ''',
                    allowEmptyArchive: true
                )

                // ------------------------------------------
                // Remove Sensitive Environment File
                // ------------------------------------------

                powershell '''
                    if (Test-Path ".env") {
                        Remove-Item ".env" -Force
                        Write-Host ".env file removed successfully"
                    }
                '''
            }
        }

        // ==================================================
        // 10. SUCCESS NOTIFICATION
        // ==================================================

        success {

            emailext(
                subject: "SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",

                body: """
                    <h2>Playwright Docker Automation - SUCCESS</h2>

                    <table border="1" cellpadding="8">
                        <tr><td><b>Job</b></td><td>${env.JOB_NAME}</td></tr>
                        <tr><td><b>Build</b></td><td>#${env.BUILD_NUMBER}</td></tr>
                        <tr><td><b>Suite</b></td><td>${params.TEST_SUITE}</td></tr>
                        <tr><td><b>Browser</b></td><td>${params.BROWSER}</td></tr>
                        <tr><td><b>Mode</b></td><td>${params.MODE}</td></tr>
                        <tr><td><b>Status</b></td><td>SUCCESS</td></tr>
                    </table>

                    <p>
                        <a href="${env.BUILD_URL}">
                            Open Jenkins Build
                        </a>
                    </p>

                    <p>Playwright tests completed successfully inside Docker.</p>
                """,

                to: 'dileepkumarpaidi@gmail.com',
                mimeType: 'text/html'
            )
        }

        // ==================================================
        // 11. FAILURE NOTIFICATION
        // ==================================================

        failure {

            emailext(
                subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",

                body: """
                    <h2>Playwright Docker Automation - FAILED</h2>

                    <table border="1" cellpadding="8">
                        <tr><td><b>Job</b></td><td>${env.JOB_NAME}</td></tr>
                        <tr><td><b>Build</b></td><td>#${env.BUILD_NUMBER}</td></tr>
                        <tr><td><b>Suite</b></td><td>${params.TEST_SUITE}</td></tr>
                        <tr><td><b>Browser</b></td><td>${params.BROWSER}</td></tr>
                        <tr><td><b>Mode</b></td><td>${params.MODE}</td></tr>
                        <tr><td><b>Status</b></td><td>FAILED</td></tr>
                    </table>

                    <p>
                        <a href="${env.BUILD_URL}">
                            Open Jenkins Build and Console Output
                        </a>
                    </p>

                    <p>Please check the Playwright execution reports.</p>
                """,

                to: 'dileepkumarpaidi@gmail.com',
                mimeType: 'text/html'
            )
        }

        // ==================================================
        // 12. ABORTED
        // ==================================================

        aborted {
            echo 'Playwright Docker pipeline was aborted'
        }
    }
}
