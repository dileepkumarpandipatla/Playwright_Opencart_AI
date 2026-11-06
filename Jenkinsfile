
/*
 * Jenkinsfile.windows
 *
 * Playwright + TypeScript + Docker Compose + Allure
 *
 * Pipeline Stages:
 * 1. Checkout
 * 2. Prepare Environment and Inject Secrets
 * 3. Docker Build
 * 4. Run Playwright Tests
 * 5. Publish JUnit, Allure and HTML Reports
 * 6. Email Notification
 * 7. Docker Cleanup
 *
 * Jenkins Prerequisites:
 * - Windows Jenkins Agent
 * - Docker Desktop / Docker Engine (Linux containers)
 * - Docker Compose
 * - Allure Jenkins Plugin
 * - Allure Commandline configured in Jenkins Tools
 * - HTML Publisher Plugin
 * - Email Extension Plugin
 * - JUnit Plugin
 * - Jenkins Secret File credential: playwright-env
 */

pipeline {

    agent any

    options {
        timestamps()
    }

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
            description: 'Select the test suite to execute'
        )

        choice(
            name: 'BROWSER',
            choices: [
                'chromium',
                'firefox',
                'webkit'
            ],
            description: 'Select browser'
        )

        choice(
            name: 'MODE',
            choices: [
                'headless',
                'headed'
            ],
            description: 'Select execution mode'
        )
    }

    environment {
        NODE_ENV = 'test'
        CI = '1'
    }

    stages {

        // ==========================================
        // 1. CHECKOUT
        // ==========================================

        stage('🔄 Checkout') {

            steps {

                checkout scm

            }
        }

        // ==========================================
        // 2. PREPARE ENVIRONMENT
        // ==========================================

        stage('⚙️ Prepare Environment') {

            steps {

                script {

                    // Inject .env securely from Jenkins Credentials
                    withCredentials([
                        file(
                            credentialsId: 'playwright-env',
                            variable: 'ENV_FILE'
                        )
                    ]) {

                        powershell '''
                            Copy-Item $env:ENV_FILE .env -Force
                        '''
                    }

                    // Clean previous execution results
                    powershell '''

                        $directories = @(
                            "allure-results",
                            "playwright-report",
                            "test-results",
                            "reports"
                        )

                        foreach ($directory in $directories) {

                            Remove-Item $directory `
                                -Recurse -Force `
                                -ErrorAction SilentlyContinue

                            New-Item -ItemType Directory `
                                -Path $directory -Force | Out-Null
                        }

                    '''
                }
            }
        }

        // ==========================================
        // 3. DOCKER BUILD
        // ==========================================

        stage('🐳 Docker Build') {

            steps {

                powershell '''

                    Write-Host "Checking Docker..."

                    docker --version

                    docker compose version

                    Write-Host "Building Playwright Docker Image..."

                    docker compose build

                    if ($LASTEXITCODE -ne 0) {
                        exit $LASTEXITCODE
                    }

                '''
            }
        }

        // ==========================================
        // 4. RUN PLAYWRIGHT TESTS
        // ==========================================

        stage('▶️ Run Playwright Tests') {

            steps {

                script {

                    // Convert test:e2e into e2e
                    def suite = params.TEST_SUITE.replace(
                        'test:',
                        ''
                    )

                    // Browser selection
                    def browserFlag =
                        "--project=${params.BROWSER}"

                    // Headless / Headed selection
                    def modeFlag =
                        params.MODE == 'headed' ? '--headed' : ''

                    echo "Selected Test Suite: ${suite}"

                    echo "Selected Browser: ${params.BROWSER}"

                    echo "Execution Mode: ${params.MODE}"

                    // Execute tests inside Docker
                    powershell """

                        docker compose run --rm -T playwright-tests `
                            ${suite} `
                            ${browserFlag} `
                            ${modeFlag}

                        if (`$LASTEXITCODE -ne 0) {
                            exit `$LASTEXITCODE
                        }

                    """
                }
            }
        }
    }

    // ==========================================
    // 5. POST EXECUTION ACTIONS
    // ==========================================

    post {

        always {

            echo 'Publishing execution reports...'

            // Archive all execution artifacts
            archiveArtifacts(
                artifacts: '''
                    allure-results/**,
                    playwright-report/**,
                    test-results/**,
                    reports/**
                ''',
                allowEmptyArchive: true
            )

            // Publish JUnit report
            junit(
                testResults: 'reports/results.xml',
                allowEmptyResults: true
            )

            // Generate and publish Allure HTML report
            allure(
                includeProperties: false,
                results: [
                    [path: 'allure-results']
                ]
            )

            // Publish Playwright HTML report
            publishHTML([

                allowMissing: true,

                alwaysLinkToLastBuild: true,

                keepAll: true,

                reportDir: 'playwright-report',

                reportFiles: 'index.html',

                reportName: 'Playwright HTML Report'

            ])

            // Send email notification
            emailext(

                subject: "Jenkins Build: ${env.JOB_NAME} #${env.BUILD_NUMBER} - ${currentBuild.currentResult}",

                body: """

                    <h2>Playwright Test Execution Report</h2>

                    <p><b>Job:</b> ${env.JOB_NAME}</p>

                    <p><b>Build:</b> #${env.BUILD_NUMBER}</p>

                    <p><b>Status:</b> ${currentBuild.currentResult}</p>

                    <p><b>Test Suite:</b> ${params.TEST_SUITE}</p>

                    <p><b>Browser:</b> ${params.BROWSER}</p>

                    <p><b>Execution Mode:</b> ${params.MODE}</p>

                    <hr/>

                    <h3>Execution Reports</h3>

                    <p>
                        <a href="${env.BUILD_URL}">
                            Open Jenkins Build
                        </a>
                    </p>

                    <p>
                        <a href="${env.BUILD_URL}Playwright_20HTML_20Report">
                            Open Playwright HTML Report
                        </a>
                    </p>

                    <p>
                        <a href="${env.BUILD_URL}allure/">
                            Open Allure Report
                        </a>
                    </p>

                """,

                to: 'dileepkumarpaidi@gmail.com',

                from: 'dileepkumarbennavara@gmail.com',

                replyTo: 'dileepkumarpaidi@gmail.com',

                mimeType: 'text/html'

            )
        }

        // ==========================================
        // 6. SUCCESS
        // ==========================================

        success {

            echo 'Playwright execution completed successfully.'

        }

        // ==========================================
        // 7. CLEANUP
        // ==========================================

        cleanup {

            echo 'Cleaning up Docker resources...'

            powershell '''

                docker compose down --remove-orphans

                if ($LASTEXITCODE -ne 0) {
                    Write-Warning "Docker cleanup failed. Check Docker Engine."
                }

            '''
        }
    }
}
