#!/usr/bin/env python
"""
Helper script to fix PostgreSQL credentials in .env file
"""
import os
from pathlib import Path

def update_env_file():
    """Update .env file with new PostgreSQL credentials"""
    env_path = Path('.env')
    
    if not env_path.exists():
        print("❌ .env file not found!")
        return False
    
    print("Current PostgreSQL credentials in .env:")
    print("-" * 50)
    with open(env_path, 'r') as f:
        lines = f.readlines()
        for line in lines:
            if line.startswith('DB_'):
                print(line.strip())
    
    print("\n" + "=" * 50)
    print("To fix the credentials, you have two options:")
    print("=" * 50)
    print("\nOPTION 1: Update .env file manually")
    print("1. Open backend/.env in a text editor")
    print("2. Find the line: DB_PASSWORD=dbms@123")
    print("3. Replace 'dbms@123' with your actual PostgreSQL password")
    print("4. Save the file")
    print("\nOPTION 2: Reset PostgreSQL password to match .env")
    print("Run this command in psql or pgAdmin:")
    print("   ALTER USER postgres WITH PASSWORD 'dbms@123';")
    print("\n" + "=" * 50)
    print("After updating, run: python test_db_connection.py")
    print("=" * 50)
    
    # Ask if user wants to update password interactively
    try:
        new_password = input("\nEnter your PostgreSQL password (or press Enter to skip): ").strip()
        if new_password:
            # Read current .env
            with open(env_path, 'r') as f:
                content = f.read()
            
            # Replace password line
            lines = content.split('\n')
            new_lines = []
            for line in lines:
                if line.startswith('DB_PASSWORD='):
                    new_lines.append(f'DB_PASSWORD={new_password}')
                else:
                    new_lines.append(line)
            
            # Write back
            with open(env_path, 'w') as f:
                f.write('\n'.join(new_lines))
            
            print(f"\n✅ Updated DB_PASSWORD in .env file")
            print("Testing connection...")
            
            # Test the new credentials
            import psycopg2
            from decouple import config
            try:
                conn = psycopg2.connect(
                    host=config('DB_HOST'),
                    port=config('DB_PORT', cast=int),
                    user=config('DB_USER'),
                    password=config('DB_PASSWORD'),
                    database=config('DB_NAME')
                )
                conn.close()
                print("✅ Connection successful! Credentials are correct.")
                return True
            except Exception as e:
                print(f"❌ Connection still failed: {e}")
                print("Please verify your PostgreSQL password is correct.")
                return False
        else:
            print("Skipped password update. Please update .env manually.")
            return False
    except KeyboardInterrupt:
        print("\n\nCancelled.")
        return False
    except Exception as e:
        print(f"\nError: {e}")
        return False

if __name__ == '__main__':
    update_env_file()

