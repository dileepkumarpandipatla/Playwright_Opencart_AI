
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
                'e2e',
                'all',
                'master',
                'sanity',
                'regression',
                'api',
                'web',
                'datadriven'
            ],
            description: 'Select Playwright test suite'
        )

        choice(
            name: 'BROWSER',
            choices: ['chromium', 'firefox', 'webkit'],
            description: 'Select browser'
        )

        choice(
            name: 'MODE',
            choices: ['headless', 'headed'],
            description: 'Select execution mode'
        )
    }

    // ==================================================
    // 2. ENVIRONMENT
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
                    $ErrorActionPreference = 'Continue'

                    & docker --version

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker CLI is not available"
                    }

                    & docker compose version

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker Compose is not available"
                    }

                    & docker info

                    if ($LASTEXITCODE -ne 0) {
                        throw "Cannot connect to Docker Engine"
                    }

                    Write-Host "Docker Engine is available"
                '''
            }
        }

        // ==================================================
        // 4. CHECKOUT
        // ==================================================

        stage('📥 Checkout Source Code') {
            steps {

                checkout scm

                echo 'Source code checked out successfully'
            }
        }

        // ==================================================
        // 5. VALIDATE REQUIRED FILES
        // ==================================================

        stage('🔍 Validate Docker Files') {
            steps {

                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $requiredFiles = @(
                        "Dockerfile",
                        "docker-compose.yml",
                        "docker-entrypoint.sh",
                        ".dockerignore",
                        ".env.example",
                        "package.json",
                        "package-lock.json"
                    )

                    foreach ($file in $requiredFiles) {

                        if (!(Test-Path $file -PathType Leaf)) {
                            throw "Required file missing: $file"
                        }

                        Write-Host "Verified: $file"
                    }

                    Write-Host "All required files are available"
                '''
            }
        }

        // ==================================================
        // 6. VERIFY JENKINS WORKSPACE
        // ==================================================

        stage('🔎 Verify Jenkins Docker Workspace') {
            steps {

                powershell '''
                    $ErrorActionPreference = 'Stop'

                    Write-Host "=================================="
                    Write-Host "Jenkins Workspace Diagnostics"
                    Write-Host "=================================="

                    Write-Host "Workspace: $PWD"

                    Write-Host "`nLatest Git Commit:"

                    git log -1 --oneline

                    if ($LASTEXITCODE -ne 0) {
                        throw "Unable to read Git commit"
                    }

                    Write-Host "`nChecking Docker Entrypoint:"

                    if (!(Test-Path ".\\docker-entrypoint.sh")) {
                        throw "docker-entrypoint.sh missing from Jenkins workspace"
                    }

                    Get-Item ".\\docker-entrypoint.sh" |
                        Format-List FullName, Length, LastWriteTime

                    Write-Host "`nChecking Effective Docker Compose Volumes:"

                    $composeOutput = & docker compose config --format json

                    if ($LASTEXITCODE -ne 0) {
                        throw "Unable to read Docker Compose configuration"
                    }

                    $composeJson = ($composeOutput -join "`n") |
                        ConvertFrom-Json

                    $volumes = $composeJson.services.'playwright-tests'.volumes

                    foreach ($volume in $volumes) {

                        Write-Host "Mount: $($volume.target)"

                        if ($volume.target -eq '/app') {
                            throw "Project root is mounted over /app. Remove the .:/app volume."
                        }
                    }

                    Write-Host "`nWorkspace diagnostics completed successfully"
                '''
            }
        }

        // ==================================================
        // 7. PREPARE ENVIRONMENT
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
        // 8. CLEAN PREVIOUS REPORTS
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

                        New-Item -ItemType Directory `
                            -Path $folder `
                            -Force | Out-Null
                    }

                    Write-Host "Previous reports cleaned"
                '''
            }
        }

        // ==================================================
        // 9. BUILD DOCKER IMAGE
        // ==================================================

        stage('🐳 Docker Build') {
            steps {

                echo 'Building Playwright Docker image'

                powershell '''
                    $ErrorActionPreference = 'Continue'

                    & docker compose build

                    $buildExitCode = $LASTEXITCODE

                    if ($buildExitCode -ne 0) {
                        throw "Docker image build failed. Exit code: $buildExitCode"
                    }

                    Write-Host "Docker image built successfully"

                    Write-Host "`nVerifying entrypoint inside Docker image"

                    & docker run --rm `
                        --entrypoint /bin/bash `
                        playwright-opencart `
                        -lc "test -f /app/docker-entrypoint.sh && test -x /app/docker-entrypoint.sh && echo 'Entrypoint verified successfully'"

                    $verifyExitCode = $LASTEXITCODE

                    if ($verifyExitCode -ne 0) {
                        throw "Entrypoint verification failed inside Docker image"
                    }

                    Write-Host "Docker image verification successful"
                '''
            }
        }

        // ==================================================
        // 10. EXECUTE PLAYWRIGHT TESTS
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
                            $ErrorActionPreference = 'Continue'

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

                            $dockerExitCode = $LASTEXITCODE

                            if ($dockerExitCode -ne 0) {
                                throw "Playwright execution failed. Exit code: $dockerExitCode"
                            }

                            Write-Host "Playwright execution completed successfully"
                        '''
                    }
                }
            }
        }
    }

    // ==================================================
    // 11. POST BUILD ACTIONS
    // ==================================================

    post {

        always {

            script {

                echo 'Publishing execution reports'

                // ------------------------------------------
                // Docker Cleanup
                // ------------------------------------------

                powershell '''
                    $ErrorActionPreference = 'Continue'

                    & docker compose down --remove-orphans

                    if ($LASTEXITCODE -ne 0) {
                        Write-Warning "Docker cleanup returned an error"
                    }
                    else {
                        Write-Host "Docker cleanup completed"
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
                        results: [
                            [path: 'allure-results']
                        ]
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
                // Remove .env
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
        // 12. SUCCESS EMAIL
        // ==================================================

        success {

            emailext(

                subject: "SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",

                body: """
                    <h2>Playwright Docker Automation - SUCCESS</h2>

                    <table border="1" cellpadding="8">
                        <tr>
                            <td><b>Job</b></td>
                            <td>${env.JOB_NAME}</td>
                        </tr>

                        <tr>
                            <td><b>Build</b></td>
                            <td>#${env.BUILD_NUMBER}</td>
                        </tr>

                        <tr>
                            <td><b>Suite</b></td>
                            <td>${params.TEST_SUITE}</td>
                        </tr>

                        <tr>
                            <td><b>Browser</b></td>
                            <td>${params.BROWSER}</td>
                        </tr>

                        <tr>
                            <td><b>Mode</b></td>
                            <td>${params.MODE}</td>
                        </tr>

                        <tr>
                            <td><b>Status</b></td>
                            <td>SUCCESS</td>
                        </tr>
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
        // 13. FAILURE EMAIL
        // ==================================================

        failure {

            emailext(

                subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",

                body: """
                    <h2>Playwright Docker Automation - FAILED</h2>

                    <table border="1" cellpadding="8">
                        <tr>
                            <td><b>Job</b></td>
                            <td>${env.JOB_NAME}</td>
                        </tr>

                        <tr>
                            <td><b>Build</b></td>
                            <td>#${env.BUILD_NUMBER}</td>
                        </tr>

                        <tr>
                            <td><b>Suite</b></td>
                            <td>${params.TEST_SUITE}</td>
                        </tr>

                        <tr>
                            <td><b>Browser</b></td>
                            <td>${params.BROWSER}</td>
                        </tr>

                        <tr>
                            <td><b>Mode</b></td>
                            <td>${params.MODE}</td>
                        </tr>

                        <tr>
                            <td><b>Status</b></td>
                            <td>FAILED</td>
                        </tr>
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
        // 14. ABORTED
        // ==================================================

        aborted {

            echo 'Playwright Docker pipeline was aborted'
        }
    }
}
