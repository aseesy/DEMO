"""
Git History Audit Tool

Analyzes git commit history for patterns, issues, and insights.
"""

import subprocess
import json
from datetime import datetime
from typing import List, Dict, Optional


def get_git_log(limit: Optional[int] = None, author: Optional[str] = None) -> List[Dict]:
    """
    Get git log entries as structured data.
    
    Args:
        limit: Maximum number of commits to retrieve
        author: Filter by author email/name
    
    Returns:
        List of commit dictionaries with keys: hash, author, date, message
    """
    cmd = ['git', 'log', '--pretty=format:%H|%an|%ae|%ad|%s', '--date=iso']
    
    if author:
        cmd.extend(['--author', author])
    
    if limit:
        cmd.extend(['-n', str(limit)])
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        commits = []
        
        for line in result.stdout.strip().split('\n'):
            if not line:
                continue
            
            parts = line.split('|', 4)
            if len(parts) >= 5:
                commits.append({
                    'hash': parts[0],
                    'author_name': parts[1],
                    'author_email': parts[2],
                    'date': parts[3],
                    'message': parts[4],
                })
        
        return commits
    except subprocess.CalledProcessError as e:
        print(f"Error getting git log: {e}")
        return []


def analyze_commit_patterns(commits: List[Dict]) -> Dict:
    """
    Analyze commit patterns for insights.
    
    Args:
        commits: List of commit dictionaries
    
    Returns:
        Dictionary with analysis results
    """
    if not commits:
        return {}
    
    authors = {}
    messages_by_type = {
        'fix': [],
        'feat': [],
        'refactor': [],
        'test': [],
        'docs': [],
    }
    
    for commit in commits:
        # Count commits by author
        author = commit['author_email']
        authors[author] = authors.get(author, 0) + 1
        
        # Categorize commits by message prefix
        message_lower = commit['message'].lower()
        for prefix in messages_by_type.keys():
            if message_lower.startswith(prefix):
                messages_by_type[prefix].append(commit)
                break
    
    return {
        'total_commits': len(commits),
        'unique_authors': len(authors),
        'commits_by_author': authors,
        'commits_by_type': {k: len(v) for k, v in messages_by_type.items()},
    }


def get_file_changes(commit_hash: str) -> Dict:
    """
    Get file changes for a specific commit.
    
    Args:
        commit_hash: Git commit hash
    
    Returns:
        Dictionary with added, modified, deleted files
    """
    try:
        result = subprocess.run(
            ['git', 'show', '--name-status', '--pretty=format:', commit_hash],
            capture_output=True,
            text=True,
            check=True
        )
        
        added = []
        modified = []
        deleted = []
        
        for line in result.stdout.strip().split('\n'):
            if not line:
                continue
            
            status = line[0]
            filename = line[1:].strip()
            
            if status == 'A':
                added.append(filename)
            elif status == 'M':
                modified.append(filename)
            elif status == 'D':
                deleted.append(filename)
        
        return {
            'added': added,
            'modified': modified,
            'deleted': deleted,
        }
    except subprocess.CalledProcessError as e:
        print(f"Error getting file changes for {commit_hash}: {e}")
        return {'added': [], 'modified': [], 'deleted': []}


if __name__ == '__main__':
    # Example usage
    print("Git History Audit Tool")
    print("=" * 50)
    
    commits = get_git_log(limit=50)
    print(f"\nRetrieved {len(commits)} commits")
    
    analysis = analyze_commit_patterns(commits)
    print(f"\nAnalysis:")
    print(json.dumps(analysis, indent=2))
