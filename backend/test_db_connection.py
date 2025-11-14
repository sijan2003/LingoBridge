#!/usr/bin/env python
"""
Test PostgreSQL connection and help identify the correct credentials
"""
import psycopg2
from decouple import config
import sys

def test_connection(host, port, user, password, database):
    """Test PostgreSQL connection with given credentials"""
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        )
        conn.close()
        return True, "Connection successful!"
    except psycopg2.OperationalError as e:
        return False, str(e)
    except Exception as e:
        return False, str(e)

def main():
    print("Testing PostgreSQL connection...")
    print("=" * 50)
    
    host = config('DB_HOST', default='localhost')
    port = config('DB_PORT', cast=int, default=5432)
    user = config('DB_USER', default='postgres')
    password = config('DB_PASSWORD', default='')
    database = config('DB_NAME', default='lingobridge')
    
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"User: {user}")
    print(f"Database: {database}")
    print(f"Password: {'*' * len(password) if password else '(empty)'}")
    print("-" * 50)
    
    # Test connection
    success, message = test_connection(host, port, user, password, database)
    
    if success:
        print(f"✅ {message}")
        print("\n✅ PostgreSQL credentials are correct!")
        return 0
    else:
        print(f"❌ Connection failed: {message}")
        print("\n" + "=" * 50)
        print("TROUBLESHOOTING:")
        print("=" * 50)
        print("1. Verify PostgreSQL is running:")
        print("   Get-Service postgresql-x64-*")
        print()
        print("2. Check if the database exists:")
        print("   psql -U postgres -l")
        print()
        print("3. If database doesn't exist, create it:")
        print("   psql -U postgres -c 'CREATE DATABASE lingobridge;'")
        print()
        print("4. Update the password in .env file:")
        print("   - Open backend/.env")
        print("   - Update DB_PASSWORD with your actual PostgreSQL password")
        print()
        print("5. Common ways to find/reset PostgreSQL password:")
        print("   - Check pg_hba.conf for authentication method")
        print("   - Reset password: ALTER USER postgres WITH PASSWORD 'newpassword';")
        print("   - Or use pgAdmin to view/reset user passwords")
        return 1

if __name__ == '__main__':
    sys.exit(main())

