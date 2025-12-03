"""
Transfer mock.json data to environment variable.
This script loads the JSON and sets it as an environment variable.
"""

import json
import os


def json_to_env_variable(json_file='mock.json', env_var_name='MOCK_CHATBOT_DATA'):
    """Load JSON file and convert to environment variable format"""
    
    print("=" * 70)
    print(" JSON TO ENVIRONMENT VARIABLE ".center(70))
    print("=" * 70)
    
    # Load JSON file
    print(f"\n📂 Loading {json_file}...")
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print("✅ JSON loaded successfully")
    except Exception as e:
        print(f"❌ Error loading JSON: {e}")
        return None
    
    # Convert to compact JSON string (no whitespace)
    json_string = json.dumps(data, separators=(',', ':'), ensure_ascii=False)
    
    print(f"\n📊 JSON Stats:")
    print(f"   - Original file size: {os.path.getsize(json_file)} bytes")
    print(f"   - Compact string length: {len(json_string)} characters")
    print(f"   - Environment variable name: {env_var_name}")
    
    return json_string, env_var_name


def update_dotenv_file(json_string, env_var_name, env_file='.env'):
    """Update .env file with the JSON string"""
    
    print(f"\n📝 Updating {env_file}...")
    
    # Read existing .env content
    env_lines = []
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            env_lines = f.readlines()
    
    # Remove existing variable if it exists
    env_lines = [line for line in env_lines if not line.startswith(f"{env_var_name}=")]
    
    # Add new variable (escape quotes for .env format)
    escaped_json = json_string.replace('"', '\\"')
    env_lines.append(f'{env_var_name}="{escaped_json}"\n')
    
    # Write back to .env
    with open(env_file, 'w', encoding='utf-8') as f:
        f.writelines(env_lines)
    
    print(f"✅ Added/Updated {env_var_name} in {env_file}")
    return True


def create_powershell_script(json_string, env_var_name):
    """Create a PowerShell script to set environment variable"""
    
    script_file = 'set_env_variable.ps1'
    
    print(f"\n🔧 Creating PowerShell script: {script_file}")
    
    # Escape quotes for PowerShell
    escaped_json = json_string.replace('"', '`"')
    
    script_content = f'''# Set environment variable with JSON data
# Run this script: .\\{script_file}

$jsonData = @"
{json_string}
"@

# Set for current session
$env:{env_var_name} = $jsonData
Write-Host "✅ Environment variable '{env_var_name}' set for current session" -ForegroundColor Green

# Set permanently for current user (optional - uncomment to use)
# [System.Environment]::SetEnvironmentVariable("{env_var_name}", $jsonData, "User")
# Write-Host "✅ Environment variable saved permanently for user" -ForegroundColor Green

# Verify
Write-Host "`n📊 Variable length: $($env:{env_var_name}.Length) characters" -ForegroundColor Cyan

# Test parsing
try {{
    $parsed = $env:{env_var_name} | ConvertFrom-Json
    Write-Host "✅ JSON is valid and parseable" -ForegroundColor Green
    Write-Host "   - Chatbot ID: $($parsed.chatbot_id)" -ForegroundColor Cyan
    Write-Host "   - Users count: $($parsed.users_count)" -ForegroundColor Cyan
    Write-Host "   - Users in data: $($parsed.users.Count)" -ForegroundColor Cyan
}} catch {{
    Write-Host "❌ Error parsing JSON: $_" -ForegroundColor Red
}}
'''
    
    with open(script_file, 'w', encoding='utf-8') as f:
        f.write(script_content)
    
    print(f"✅ Created {script_file}")
    print(f"\n💡 To use:")
    print(f"   PowerShell> .\\{script_file}")
    return script_file


def create_python_loader():
    """Create a Python script to load from environment variable"""
    
    loader_file = 'load_from_env.py'
    
    print(f"\n🐍 Creating Python loader: {loader_file}")
    
    loader_content = '''"""
Load mock chatbot data from environment variable.
"""

import os
import json


def load_chatbot_data_from_env(env_var_name='MOCK_CHATBOT_DATA'):
    """Load and parse chatbot data from environment variable"""
    
    # Get from environment
    json_string = os.environ.get(env_var_name)
    
    if not json_string:
        print(f"❌ Environment variable '{env_var_name}' not found")
        print("\\n💡 Options:")
        print("   1. Run: .\\\\set_env_variable.ps1 (PowerShell)")
        print("   2. Add to .env file and load with python-dotenv")
        return None
    
    try:
        # Parse JSON
        data = json.loads(json_string)
        print(f"✅ Loaded chatbot data from {env_var_name}")
        print(f"   - Chatbot ID: {data.get('chatbot_id')}")
        print(f"   - Users: {data.get('users_count')}")
        return data
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing JSON from environment variable: {e}")
        return None


def load_from_dotenv(env_var_name='MOCK_CHATBOT_DATA'):
    """Load from .env file using python-dotenv"""
    from dotenv import load_dotenv
    
    load_dotenv()
    return load_chatbot_data_from_env(env_var_name)


if __name__ == "__main__":
    print("=" * 70)
    print(" LOAD FROM ENVIRONMENT VARIABLE ".center(70))
    print("=" * 70)
    
    # Try loading from .env first
    print("\\n1️⃣ Trying to load from .env file...")
    data = load_from_dotenv()
    
    if not data:
        print("\\n2️⃣ Trying to load from system environment...")
        data = load_chatbot_data_from_env()
    
    if data:
        print("\\n📊 Data Summary:")
        print(f"   - Total users: {len(data.get('users', []))}")
        print(f"   - First user ID: {data['users'][0]['user_id']}")
        print(f"   - First conversation: {data['users'][0]['conversations'][0]['title'][:50]}...")
        
        print("\\n✅ Data loaded successfully!")
    else:
        print("\\n❌ Could not load data from environment")
'''
    
    with open(loader_file, 'w', encoding='utf-8') as f:
        f.write(loader_content)
    
    print(f"✅ Created {loader_file}")
    print(f"\n💡 To use:")
    print(f"   Python> python {loader_file}")
    return loader_file


if __name__ == "__main__":
    # Convert JSON to string
    result = json_to_env_variable()
    
    if result:
        json_string, env_var_name = result
        
        print("\n" + "=" * 70)
        print(" CHOOSE OUTPUT METHOD ".center(70))
        print("=" * 70)
        print("\n1. Add to .env file (recommended for Python apps)")
        print("2. Create PowerShell script (for Windows session)")
        print("3. Both")
        
        choice = input("\nChoice (1/2/3): ").strip()
        
        if choice in ['1', '3']:
            update_dotenv_file(json_string, env_var_name)
        
        if choice in ['2', '3']:
            create_powershell_script(json_string, env_var_name)
        
        # Always create Python loader
        create_python_loader()
        
        print("\n" + "=" * 70)
        print(" NEXT STEPS ".center(70))
        print("=" * 70)
        
        if choice in ['1', '3']:
            print("\n📝 .env file updated!")
            print("   Use in Python:")
            print("   ```python")
            print("   from dotenv import load_dotenv")
            print("   import os, json")
            print("   load_dotenv()")
            print(f"   data = json.loads(os.environ['{env_var_name}'])")
            print("   ```")
        
        if choice in ['2', '3']:
            print("\n🔧 PowerShell script created!")
            print("   Run: .\\set_env_variable.ps1")
        
        print("\n🐍 Python loader created!")
        print("   Run: python load_from_env.py")
        
        print("\n✅ All files created successfully!")
