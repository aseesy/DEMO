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
    code_quality_stats: Optional[Dict] = None,
) -> Dict:
    """
    Create dashboard data structure.
    
    Args:
        git_stats: Git commit statistics
        db_stats: Database analysis statistics
        code_quality_stats: Code quality metrics
    
    Returns:
        Dictionary with dashboard data
    """
    return {
        'timestamp': datetime.now().isoformat(),
        'git': git_stats or {},
        'database': db_stats or {},
        'code_quality': code_quality_stats or {},
    }


def format_code_quality_stats(stats: Dict) -> str:
    """
    Format code quality statistics for display in dashboard.
    
    Args:
        stats: Dictionary with code quality statistics
    
    Returns:
        Formatted string for display
    """
    if not stats or 'error' in stats:
        error_msg = stats.get('error', 'Unknown error') if stats else 'No data'
        return f"⚠️  Error analyzing code quality: {error_msg}"
    
    lines = [
        f"Files Analyzed: {stats.get('total_files', 0)}",
        f"Total Lines of Code: {stats.get('total_lines', 0):,}",
        f"Average File Size: {stats.get('avg_file_size_kb', 0):.1f} KB",
        "",
        "Console.log Analysis:",
        f"  Total occurrences: {stats.get('total_console_logs', 0)}",
        f"  Files with console.log: {stats.get('files_with_console_logs', 0)}",
        f"  ⚠️  Production files with logs: {stats.get('production_files_with_logs', 0)}",
        "",
        "Function Complexity:",
        f"  Average function length: {stats.get('avg_function_length', 0):.1f} lines",
        f"  Max function length: {stats.get('max_function_length', 0)} lines",
        f"  ⚠️  Functions over 50 lines: {stats.get('functions_over_threshold', 0)}",
        "",
        "Nesting Complexity:",
        f"  Average nesting depth: {stats.get('avg_nesting_depth', 0):.1f}",
        f"  Max nesting depth: {stats.get('max_nesting_depth', 0)}",
        f"  ⚠️  Files with deep nesting (>5): {stats.get('files_with_deep_nesting', 0)}",
        "",
        "Modern Pattern Adoption:",
        f"  Async/await adoption: {stats.get('async_await_adoption', 0):.1f}%",
        f"  Callback usage: {stats.get('callback_usage', 0):.1f}%",
        f"  ⚠️  Promise depth issues (>3): {stats.get('promise_depth_issues', 0)}",
        "",
        "Module System:",
        f"  ES Modules (ESM): {stats.get('esm_files', 0)}",
        f"  CommonJS: {stats.get('commonjs_files', 0)}",
        f"  Mixed: {stats.get('mixed_modules', 0)}",
        "",
        "File Size:",
        f"  ⚠️  Large files (>500 lines): {stats.get('large_files', 0)}",
        "",
        "Refactoring Hotspots:",
    ]
    
    hotspots = stats.get('refactoring_hotspots', [])
    if hotspots:
        lines.append(f"  Found {len(hotspots)} files needing attention:")
        for hotspot in hotspots[:10]:  # Top 10
            lines.append(f"    - {hotspot}")
        if len(hotspots) > 10:
            lines.append(f"    ... and {len(hotspots) - 10} more")
    else:
        lines.append("  ✅ No hotspots found!")
    
    return "\n".join(lines)


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
    
    if dashboard_data.get('code_quality'):
        lines.append("Code Quality Metrics:")
        lines.append(format_code_quality_stats(dashboard_data['code_quality']))
        lines.append("")
    
    lines.append("=" * 60)
    
    return "\n".join(lines)
