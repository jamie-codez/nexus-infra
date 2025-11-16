#!/usr/bin/env ts-node
/**
 * Extract environment variables from docker-compose.yaml files.
 * Usage: ts-node extract-env.ts <path-to-docker-compose.yaml>
 * Or compile and run: tsc extract-env.ts && node extract-env.js <path-to-docker-compose.yaml>
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface DockerComposeService {
  environment?: Record<string, string | number> | string[];
  ports?: string[];
  volumes?: string[];
  command?: string | string[];
  healthcheck?: Record<string, any>;
  [key: string]: any;
}

interface DockerCompose {
  services?: Record<string, DockerComposeService>;
  [key: string]: any;
}

/**
 * Extract all ${VAR_NAME} patterns from text
 */
function extractEnvVars(text: string): Set<string> {
  const pattern = /\$\{([A-Za-z_][A-Za-z0-9_]*)}/g;
  const vars = new Set<string>();
  let match: RegExpExecArray | null;
  
  while ((match = pattern.exec(text)) !== null) {
    vars.add(match[1]);
  }
  
  return vars;
}

/**
 * Recursively extract env vars from any value
 */
function extractFromValue(value: any, envVars: Set<string>): void {
  if (typeof value === 'string') {
    extractEnvVars(value).forEach(v => envVars.add(v));
  } else if (Array.isArray(value)) {
    value.forEach(item => extractFromValue(item, envVars));
  } else if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(v => extractFromValue(v, envVars));
  }
}

/**
 * Parse docker-compose the file and extract env vars grouped by service
 */
function parseDockerCompose(filePath: string): Record<string, string[]> {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const composeData = yaml.load(fileContent) as DockerCompose;
  
  if (!composeData || !composeData.services) {
    console.error('No services found in docker-compose file');
    return {};
  }
  
  const servicesEnv: Record<string, string[]> = {};
  
  for (const [serviceName, serviceConfig] of Object.entries(composeData.services)) {
    const envVars = new Set<string>();
    
    // Extract from all fields in service config
    extractFromValue(serviceConfig, envVars);
    
    if (envVars.size > 0) {
      servicesEnv[serviceName] = Array.from(envVars).sort();
    }
  }
  
  return servicesEnv;
}

/**
 * Parse existing .env.example file and return an object of var -> value
 */
function parseExistingEnvFile(filePath: string): Record<string, string> {
  const envDict: Record<string, string> = {};
  
  if (!fs.existsSync(filePath)) {
    return envDict;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      if (trimmed.includes('=')) {
        const parts = trimmed.split('=');
        const varName = parts[0].trim();
        envDict[varName] = parts.slice(1).join('=').trim();
      }
    }
  }
  
  return envDict;
}

/**
 * Format the output with service headers and env vars, merging with existing
 */
function formatOutput(servicesEnv: Record<string, string[]>, existingEnv: Record<string, string>): string {
  const outputLines: string[] = [];
  const allVarsSeen = new Set<string>();
  
  for (const [serviceName, envVars] of Object.entries(servicesEnv)) {
    const serviceVars: string[] = [];
    
    for (const varName of envVars) {
      if (!allVarsSeen.has(varName)) {
        allVarsSeen.add(varName);
        // Use existing value if present, otherwise empty
        const value = existingEnv[varName] || '';
        serviceVars.push(`${varName}=${value}`);
      }
    }
    
    // Only add a service section if it has variables
    if (serviceVars.length > 0) {
      outputLines.push(`### ${serviceName.toUpperCase()}`);
      outputLines.push(...serviceVars);
      outputLines.push(''); // Blank line between services
    }
  }
  
  return outputLines.join('\n');
}

/**
 * Main function
 */
function main(): void {
  if (process.argv.length !== 3) {
    console.error('Usage: ts-node extract-env.ts <path-to-docker-compose.yaml>');
    process.exit(1);
  }
  
  const filePath = process.argv[2];
  
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File '${filePath}' not found`);
    process.exit(1);
  }
  
  try {
    const servicesEnv = parseDockerCompose(filePath);
    
    // Parse existing .env.example file
    const outputFile = path.join(process.cwd(), '.env.example');
    const existingEnv = parseExistingEnvFile(outputFile);
    
    // Format output with deduplication and merging
    const output = formatOutput(servicesEnv, existingEnv);
    
    // Write to .env.example in the current directory
    fs.writeFileSync(outputFile, output, 'utf8');
    
    const allVars = new Set<string>();
    Object.values(servicesEnv).forEach(vars => vars.forEach(v => allVars.add(v)));
    const uniqueVars = allVars.size;
    
    console.log(`✓ Created ${outputFile}`);
    console.log(`  Extracted ${uniqueVars} unique variables from ${Object.keys(servicesEnv).length} services`);
    if (Object.keys(existingEnv).length > 0) {
      console.log(`  Merged with ${Object.keys(existingEnv).length} existing variables`);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
