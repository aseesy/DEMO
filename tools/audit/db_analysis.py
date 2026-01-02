"""
Database Analysis Tool

Analyzes database structure, relationships, and data patterns.
"""

import os
import json
from typing import Dict, List, Optional
from pathlib import Path


def find_sql_files(directory: str = 'chat-server/migrations') -> List[str]:
    """
    Find all SQL migration files in the directory.
    
    Args:
        directory: Directory to search for SQL files
    
    Returns:
        List of SQL file paths
    """
    sql_files = []
    path = Path(directory)
    
    if path.exists() and path.is_dir():
        sql_files = list(path.glob('*.sql'))
        sql_files.sort()
    
    return [str(f) for f in sql_files]


def parse_sql_file(filepath: str) -> Dict:
    """
    Parse a SQL file and extract table definitions and operations.
    
    Args:
        filepath: Path to SQL file
    
    Returns:
        Dictionary with parsed SQL information
    """
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Simple parsing - extract CREATE TABLE statements
        tables = []
        creates = []
        
        lines = content.split('\n')
        current_table = None
        current_create = []
        
        for line in lines:
            line_upper = line.upper().strip()
            
            if 'CREATE TABLE' in line_upper:
                # Extract table name
                parts = line.split()
                for i, part in enumerate(parts):
                    if part.upper() == 'TABLE':
                        if i + 1 < len(parts):
                            table_name = parts[i + 1].strip('`"\'();')
                            current_table = table_name
                            current_create = [line]
                            break
            elif current_table and current_create:
                current_create.append(line)
                if line.strip().endswith(';'):
                    creates.append('\n'.join(current_create))
                    tables.append(current_table)
                    current_table = None
                    current_create = []
        
        return {
            'filepath': filepath,
            'filename': os.path.basename(filepath),
            'tables_created': tables,
            'create_statements': creates,
            'total_lines': len(lines),
        }
    except Exception as e:
        return {
            'filepath': filepath,
            'error': str(e),
        }


def analyze_migrations(directory: str = 'chat-server/migrations') -> Dict:
    """
    Analyze all migration files.
    
    Args:
        directory: Directory containing migration files
    
    Returns:
        Dictionary with migration analysis
    """
    sql_files = find_sql_files(directory)
    
    all_tables = set()
    migrations = []
    
    for sql_file in sql_files:
        parsed = parse_sql_file(sql_file)
        if 'tables_created' in parsed:
            all_tables.update(parsed['tables_created'])
        migrations.append(parsed)
    
    return {
        'total_migrations': len(sql_files),
        'unique_tables': sorted(list(all_tables)),
        'total_tables': len(all_tables),
        'migrations': migrations,
    }


def get_table_dependencies(sql_content: str) -> Dict[str, List[str]]:
    """
    Extract table dependencies from SQL (foreign keys, references).
    
    Args:
        sql_content: SQL file content
    
    Returns:
        Dictionary mapping table names to their dependencies
    """
    dependencies = {}
    
    # Simple regex-like parsing for FOREIGN KEY references
    lines = sql_content.split('\n')
    current_table = None
    
    for line in lines:
        line_upper = line.upper().strip()
        
        # Find CREATE TABLE
        if 'CREATE TABLE' in line_upper:
            parts = line.split()
            for i, part in enumerate(parts):
                if part.upper() == 'TABLE':
                    if i + 1 < len(parts):
                        current_table = parts[i + 1].strip('`"\'();')
                        dependencies[current_table] = []
                        break
        
        # Find FOREIGN KEY references
        if 'FOREIGN KEY' in line_upper or 'REFERENCES' in line_upper:
            if current_table:
                # Extract referenced table name
                if 'REFERENCES' in line_upper:
                    parts = line_upper.split('REFERENCES')
                    if len(parts) > 1:
                        ref_part = parts[1].strip()
                        ref_table = ref_part.split()[0].strip('`"\'();')
                        if ref_table not in dependencies[current_table]:
                            dependencies[current_table].append(ref_table)
    
    return dependencies


if __name__ == '__main__':
    # Example usage
    print("Database Analysis Tool")
    print("=" * 50)
    
    analysis = analyze_migrations()
    print(f"\nTotal migrations: {analysis['total_migrations']}")
    print(f"Total tables: {analysis['total_tables']}")
    print(f"\nTables:")
    for table in analysis['unique_tables']:
        print(f"  - {table}")
