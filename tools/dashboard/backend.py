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
TOOLS_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(TOOLS_DIR))

from audit.git_history import get_git_log, analyze_commit_patterns
from audit.db_analysis import analyze_migrations
from audit.code_quality import analyze_code_quality


def collect_all_stats(
    git_limit: Optional[int] = 100,
    db_migrations_dir: str = 'chat-server/migrations',
    code_quality_dirs: Optional[List[str]] = None,
    exclude_test_files: bool = False,
) -> Dict:
    """
    Collect all statistics for the dashboard.
    
    Args:
        git_limit: Maximum number of git commits to analyze
        db_migrations_dir: Directory containing database migrations
        code_quality_dirs: Optional list of directories to analyze for code quality
        exclude_test_files: Whether to exclude test files from code quality analysis
    
    Returns:
        Dictionary with all collected statistics
    """
    # Collect git statistics
    commits = get_git_log(limit=git_limit)
    git_stats = analyze_commit_patterns(commits)
    
    # Collect database statistics
    db_stats = analyze_migrations(db_migrations_dir)
    
    # Collect code quality statistics
    code_quality_stats = {}
    if code_quality_dirs is None:
        # Default: analyze both client and server
        code_quality_dirs = ['chat-client-vite', 'chat-server']
    
    try:
        base_dir = Path(__file__).parent.parent.parent.resolve()
        code_quality_stats = analyze_code_quality(
            base_dir=base_dir,
            directories=code_quality_dirs,
            exclude_test_files=exclude_test_files,
        )
    except Exception as e:
        print(f"⚠️  Error analyzing code quality: {e}")
        code_quality_stats = {'error': str(e)}
    
    return {
        'git': git_stats,
        'database': db_stats,
        'code_quality': code_quality_stats,
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


def generate_report(
    output_format: str = 'text',
    code_quality_dirs: Optional[List[str]] = None,
    exclude_test_files: bool = False,
) -> str:
    """
    Generate a complete dashboard report.
    
    Args:
        output_format: Output format ('text' or 'json')
        code_quality_dirs: Optional list of directories to analyze for code quality
        exclude_test_files: Whether to exclude test files from code quality analysis
    
    Returns:
        Report content as string
    """
    stats = collect_all_stats(
        code_quality_dirs=code_quality_dirs,
        exclude_test_files=exclude_test_files,
    )
    
    if output_format == 'json':
        return json.dumps(stats, indent=2)
    else:
        # Import here to avoid circular imports
        from dashboard.ui import generate_summary_report, create_dashboard_data
        
        dashboard_data = create_dashboard_data(
            git_stats=stats.get('git'),
            db_stats=stats.get('database'),
            code_quality_stats=stats.get('code_quality'),
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
