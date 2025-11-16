#!/usr/bin/env python3
"""
Extract environment variables from docker-compose.yaml files.
Usage: python extract-env.py <path-to-docker-compose.yaml>
"""

import sys
import re
import yaml
from pathlib import Path


def extract_env_vars(text):
    """Extract all ${VAR_NAME} patterns from the text."""
    pattern = r'\$\{([A-Za-z_][A-Za-z0-9_]*)\}'
    return set(re.findall(pattern, str(text)))


def extract_from_any_value(value, env_vars):
    """Recursively extract env vars from any value type."""
    if isinstance(value, str):
        env_vars.update(extract_env_vars(value))
    elif isinstance(value, list):
        for item in value:
            extract_from_any_value(item, env_vars)
    elif isinstance(value, dict):
        for v in value.values():
            extract_from_any_value(v, env_vars)


def parse_docker_compose(file_path):
    """Parse docker-compose file and extract env vars grouped by service."""
    with open(file_path, 'r') as f:
        compose_data = yaml.safe_load(f)
    
    if not compose_data or 'services' not in compose_data:
        print("No services found in docker-compose file")
        return {}
    
    services_env = {}
    
    for service_name, service_config in compose_data['services'].items():
        env_vars = set()
        
        # Extract from all fields in service config
        extract_from_any_value(service_config, env_vars)
        
        if env_vars:
            services_env[service_name] = sorted(env_vars)
    
    return services_env


def parse_existing_env_file(file_path):
    """Parse existing .env.example file and return dict of var -> value."""
    env_dict = {}
    if not file_path.exists():
        return env_dict
    
    with open(file_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                if '=' in line:
                    var_name = line.split('=', 1)[0].strip()
                    var_value = line.split('=', 1)[1].strip() if len(line.split('=', 1)) > 1 else ''
                    env_dict[var_name] = var_value
    
    return env_dict


def format_output(services_env, existing_env):
    """Format the output with service headers and env vars, merging with existing."""
    output_lines = []
    all_vars_seen = set()
    
    for service_name, env_vars in services_env.items():
        service_vars = []
        
        for var in env_vars:
            if var not in all_vars_seen:
                all_vars_seen.add(var)
                # Use existing value if present, otherwise empty
                value = existing_env.get(var, '')
                service_vars.append(f"{var}={value}")
        
        # Only add service section if it has variables
        if service_vars:
            output_lines.append(f"### {service_name.upper()}")
            output_lines.extend(service_vars)
            output_lines.append("")  # Blank line between services
    
    return "\n".join(output_lines)


def main():
    if len(sys.argv) != 2:
        print("Usage: python extract-env.py <path-to-docker-compose.yaml>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not Path(file_path).exists():
        print(f"Error: File '{file_path}' not found")
        sys.exit(1)
    
    try:
        services_env = parse_docker_compose(file_path)
        
        # Parse existing .env.example file
        output_file = Path.cwd() / '.env.example'
        existing_env = parse_existing_env_file(output_file)
        
        # Format output with deduplication and merging
        output = format_output(services_env, existing_env)
        
        # Write to .env.example in current directory
        with open(output_file, 'w') as f:
            f.write(output)
        
        total_vars = sum(len(vars) for vars in services_env.values())
        unique_vars = len(set(var for vars in services_env.values() for var in vars))
        
        print(f"✓ Created {output_file}")
        print(f"  Extracted {unique_vars} unique variables from {len(services_env)} services")
        if existing_env:
            print(f"  Merged with {len(existing_env)} existing variables")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
