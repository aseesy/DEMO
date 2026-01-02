"""
Dashboard Backend Tools

Backend functionality for dashboard operations.
"""

import json
import sys
from typing import Dict, List, Optional
from pathlib import Path

# Import audit tools (adjust path based on structure)
# Since we're in tools/dashboard/, we need to go up to tools/audit/
sys.path.insert(0, str(Path(__file__).parent.parent))

from audit.git_history import get_git_log, analyze_commit_patterns
from audit.db_analysis import analyze_migrations


def collect_all_stats(
    git_limit: Optional[int] = 100,
    db_migrations_dir: str = 'chat-server/migrations',
) -> Dict:
    """
    Collect all statistics for the dashboard.
    
    Args:
        git_limit: Maximum number of git commits to analyze
        db_migrations_dir: Directory containing database migrations
    
    Returns:
        Dictionary with all collected statistics
    """
    # Collect git statistics
    commits = get_git_log(limit=git_limit)
    git_stats = analyze_commit_patterns(commits)
    
    # Collect database statistics
    db_stats = analyze_migrations(db_migrations_dir)
    
    return {
        'git': git_stats,
        'database': db_stats,
    }


def save_dashboard_data(data: Dict, output_file: str = 'dashboard_data.json') -> str:
    """
    Save dashboard data to a JSON file.
    
    Args:
        data: Dashboard data dictionary
        output_file: Output file path
    
    Returns:
        Path to saved file
    """
    output_path = Path(output_file)
    
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    return str(output_path)


def load_dashboard_data(input_file: str = 'dashboard_data.json') -> Dict:
    """
    Load dashboard data from a JSON file.
    
    Args:
        input_file: Input file path
    
    Returns:
        Dashboard data dictionary
    """
    input_path = Path(input_file)
    
    if not input_path.exists():
        return {}
    
    with open(input_path, 'r') as f:
        return json.load(f)


def generate_report(output_format: str = 'text') -> str:
    """
    Generate a complete dashboard report.
    
    Args:
        output_format: Output format ('text' or 'json')
    
    Returns:
        Report content as string
    """
    stats = collect_all_stats()
    
    if output_format == 'json':
        return json.dumps(stats, indent=2)
    else:
        # Import here to avoid circular imports
        from dashboard.ui import generate_summary_report, create_dashboard_data
        
        dashboard_data = create_dashboard_data(
            git_stats=stats.get('git'),
            db_stats=stats.get('database'),
        )
        return generate_summary_report(dashboard_data)


if __name__ == '__main__':
    # Example usage
    print("Dashboard Backend")
    print("=" * 50)
    
    stats = collect_all_stats()
    print("\nCollected statistics:")
    print(json.dumps(stats, indent=2))
    
    # Generate report
    print("\n" + "=" * 50)
    print("Summary Report:")
    print("=" * 50)
    report = generate_report()
    print(report)
