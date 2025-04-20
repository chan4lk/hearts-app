import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

// Configurable variables
const config = new pulumi.Config();
const location = config.get("location") || "southeastasia";
const appName = config.get("appName") || "hearts-nextjs-app";

// Resource Group
const resourceGroup = new azure.resources.ResourceGroup("resourceGroup", {
    resourceGroupName: "rg-hearts-app",
    location,
});

// App Service Plan (Linux, Node)
const plan = new azure.web.AppServicePlan("appServicePlan", {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    kind: "Linux",
    reserved: true,
    sku: {
        tier: "Basic",
        name: "B1",
    },
});

// Web App (Node.js)
const webApp = new azure.web.WebApp("webApp", {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    serverFarmId: plan.id,
    siteConfig: {
        linuxFxVersion: "NODE|18-lts",
        appSettings: [
            { name: "WEBSITES_ENABLE_APP_SERVICE_STORAGE", value: "false" },
            { name: "NEXT_PUBLIC_NODE_ENV", value: "production" },
        ],
    },
    httpsOnly: true,
});

// PostgreSQL Database
const dbAdmin = config.get("dbAdmin") || "pgadmin";
const dbPassword = config.requireSecret("dbPassword"); // Use pulumi config set --secret dbPassword <password>
const dbName = config.get("dbName") || "heartsdb";

const postgres = new azure.dbforpostgresql.Server("postgres", {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    version: "11",
    sku: {
        name: "Standard_B1ms",
        tier: "Burstable",
    },
    administratorLogin: dbAdmin,
    administratorLoginPassword: dbPassword,
    storage: {
        storageSizeGB: 32,
    },
    backup: {
        backupRetentionDays: 7,
        geoRedundantBackup: "Disabled",
    },
});

// Allow access from Azure services (including App Service)
const allowAzure = new azure.dbforpostgresql.FirewallRule("allowAzure", {
    resourceGroupName: resourceGroup.name,
    serverName: postgres.name,
    startIpAddress: "0.0.0.0",
    endIpAddress: "0.0.0.0",
});

// Output endpoints
export const endpoint = pulumi.interpolate`https://${webApp.defaultHostName}`;
export const dbConnectionString = pulumi.interpolate`postgresql://${dbAdmin}:${dbPassword}@${postgres.fullyQualifiedDomainName}:5432/postgres`;
