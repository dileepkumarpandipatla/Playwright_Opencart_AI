
# Playwright + TypeScript Automation Framework
FROM mcr.microsoft.com/playwright:v1.64.1-noble

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project source and configuration
COPY . .

# Create report directories, normalize entrypoint line endings,
# and make the script executable
RUN mkdir -p \
    /app/reports \
    /app/allure-results \
    /app/allure-report \
    /app/test-results \
    /app/playwright-report \
    && sed -i 's/\r$//' /app/docker-entrypoint.sh \
    && chmod +x /app/docker-entrypoint.sh

ENV CI=true
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Run the entrypoint explicitly through Bash
ENTRYPOINT ["/bin/bash", "/app/docker-entrypoint.sh"]

CMD ["all"]
