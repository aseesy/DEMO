"""
Dashboard UI Tools

Utilities for dashboard user interface functionality.
"""

from typing import Dict, List, Optional
from datetime import datetime


def format_commit_stats(stats: Dict) -> str:
    """
    Format commit statistics for display in dashboard.
    
    Args:
        stats: Dictionary with commit statistics
    
    Returns:
        Formatted string for display
    """
    lines = [
        f"Total Commits: {stats.get('total_commits', 0)}",
        f"Unique Authors: {stats.get('unique_authors', 0)}",
        "",
        "Commits by Type:",
    ]
    
    commits_by_type = stats.get('commits_by_type', {})
    for commit_type, count in commits_by_type.items():
        if count > 0:
            lines.append(f"  {commit_type.capitalize()}: {count}")
    
    lines.append("")
    lines.append("Commits by Author:")
    commits_by_author = stats.get('commits_by_author', {})
    for author, count in sorted(commits_by_author.items(), key=lambda x: x[1], reverse=True):
        lines.append(f"  {author}: {count}")
    
    return "\n".join(lines)


def format_db_stats(db_analysis: Dict) -> str:
    """
    Format database analysis statistics for display.
    
    Args:
        db_analysis: Dictionary with database analysis results
    
    Returns:
        Formatted string for display
    """
    lines = [
        f"Total Migrations: {db_analysis.get('total_migrations', 0)}",
        f"Total Tables: {db_analysis.get('total_tables', 0)}",
        "",
        "Tables:",
    ]
    
    tables = db_analysis.get('unique_tables', [])
    for table in tables:
        lines.append(f"  - {table}")
    
    return "\n".join(lines)


def create_dashboard_data(
    git_stats: Optional[Dict] = None,
    db_stats: Optional[Dict] = None,
) -> Dict:
    """
    Create dashboard data structure.
    
    Args:
        git_stats: Git commit statistics
        db_stats: Database analysis statistics
    
    Returns:
        Dictionary with dashboard data
    """
    return {
        'timestamp': datetime.now().isoformat(),
        'git': git_stats or {},
        'database': db_stats or {},
    }


def generate_summary_report(dashboard_data: Dict) -> str:
    """
    Generate a summary report from dashboard data.
    
    Args:
        dashboard_data: Dashboard data dictionary
    
    Returns:
        Formatted summary report string
    """
    lines = [
        "=" * 60,
        "Dashboard Summary Report",
        "=" * 60,
        f"Generated: {dashboard_data.get('timestamp', 'Unknown')}",
        "",
    ]
    
    if dashboard_data.get('git'):
        lines.append("Git Statistics:")
        lines.append(format_commit_stats(dashboard_data['git']))
        lines.append("")
    
    if dashboard_data.get('database'):
        lines.append("Database Statistics:")
        lines.append(format_db_stats(dashboard_data['database']))
        lines.append("")
    
    lines.append("=" * 60)
    
    return "\n".join(lines)
