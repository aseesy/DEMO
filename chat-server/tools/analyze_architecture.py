#!/usr/bin/env python3
"""
Architecture Analysis Tool
==========================

Performs project-wide architecture checks:
1. Dependency graph analysis (circular dependencies, forbidden dependencies)
2. Environment variable consistency (usage vs .env.example)
3. Dead code detection (unused modules/files)

Usage:
    python tools/analyze_architecture.py
    python tools/analyze_architecture.py --check circular
    python tools/analyze_architecture.py --check env
    python tools/analyze_architecture.py --check dead-code
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Set, Optional
from dataclasses import dataclass, field, asdict
from collections import defaultdict, deque
import argparse

# Resolve paths
SCRIPT_DIR = Path(__file__).parent.resolve()
BASE_DIR = SCRIPT_DIR.parent.parent  # Workspace root
CLIENT_DIR = BASE_DIR / "chat-client-vite"
SERVER_DIR = BASE_DIR / "chat-server"

# Try to import dependencies
try:
    from tree_sitter import Language, Parser
    import tree_sitter_javascript
    HAS_TREE_SITTER = True
    JS_LANGUAGE = Language(tree_sitter_javascript.language())
    try:
        import tree_sitter_typescript
        TS_LANGUAGE = Language(tree_sitter_typescript.language_typescript())
        HAS_TS_GRAMMAR = True
    except ImportError:
        TS_LANGUAGE = None
        HAS_TS_GRAMMAR = False
except ImportError:
    HAS_TREE_SITTER = False
    JS_LANGUAGE = None
    TS_LANGUAGE = None

try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:
    HAS_NETWORKX = False


@dataclass
class DependencyIssue:
    """Represents a dependency-related issue"""
    file: str
    line: int
    issue_type: str  # 'circular', 'forbidden', 'missing'
    message: str
    severity: str  # 'error', 'warning'
    details: Dict = field(default_factory=dict)


@dataclass
class EnvVarIssue:
    """Represents an environment variable issue"""
    var_name: str
    issue_type: str  # 'used_but_not_documented', 'documented_but_unused', 'missing_in_example'
    file: str
    line: int
    severity: str  # 'error', 'warning', 'info'


@dataclass
class DeadCodeIssue:
    """Represents potentially dead code"""
    file: str
    confidence: str  # 'high', 'medium', 'low'
    reason: str
    suggested_action: str


class ArchitectureAnalyzer:
    """Analyzes project architecture for issues"""
    
    def __init__(self):
        self.dependency_issues: List[DependencyIssue] = []
        self.env_var_issues: List[EnvVarIssue] = []
        self.dead_code_issues: List[DeadCodeIssue] = []
        
        # Dependency graph
        self.import_graph: Dict[str, Set[str]] = defaultdict(set)
        self.file_to_module: Dict[str, str] = {}
        self.module_to_files: Dict[str, Set[str]] = defaultdict(set)
        
        # Environment variables
        self.env_vars_used: Dict[str, List[Tuple[str, int]]] = defaultdict(list)
        self.env_vars_documented: Set[str] = set()
        
        # File tracking
        self.all_files: Set[Path] = set()
        self.imported_files: Set[str] = set()
        
        # Parsers
        self.js_parser = None
        self.ts_parser = None
        
    def setup_parsers(self):
        """Set up tree-sitter parsers"""
        if not HAS_TREE_SITTER:
            print("⚠️  tree-sitter not available, using regex fallback")
            return False
        
        try:
            self.js_parser = Parser(JS_LANGUAGE)
            if TS_LANGUAGE:
                self.ts_parser = Parser(TS_LANGUAGE)
            return True
        except Exception as e:
            print(f"⚠️  Failed to set up parsers: {e}")
            return False
    
    def get_all_js_files(self, directory: Path) -> List[Path]:
        """Get all JavaScript/TypeScript files in directory"""
        if not directory.exists():
            return []
        
        files = []
        for pattern in ["*.js", "*.jsx", "*.ts", "*.tsx"]:
            files.extend(directory.rglob(pattern))
        
        # Filter out node_modules, dist, build, .next, coverage
        excluded = ["node_modules", "dist", "build", ".next", "coverage", ".git", ".venv"]
        files = [
            f for f in files
            if not any(excluded_dir in str(f) for excluded_dir in excluded)
        ]
        
        return files
    
    def normalize_import_path(self, import_path: str, from_file: Path) -> Optional[str]:
        """Normalize import path to module identifier"""
        # Remove quotes
        import_path = import_path.strip("'\"")
        
        # Skip node_modules imports
        if not import_path.startswith('.') and '/' not in import_path:
            return None  # External package
        
        # Resolve relative paths
        if import_path.startswith('.'):
            try:
                resolved = (from_file.parent / import_path).resolve()
                # Try with .js extension
                if not resolved.exists():
                    for ext in ['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts']:
                        candidate = resolved.with_suffix(ext) if resolved.suffix else resolved / ext.lstrip('/')
                        if candidate.exists():
                            resolved = candidate
                            break
                
                # Convert to relative path from BASE_DIR
                try:
                    rel_path = resolved.relative_to(BASE_DIR)
                    return str(rel_path).replace('\\', '/')
                except ValueError:
                    return None
            except Exception:
                return None
        
        return None
    
    def extract_imports_from_ast(self, file_path: Path, content: bytes) -> Set[str]:
        """Extract imports from AST using tree-sitter"""
        imports = set()
        
        # Choose parser
        parser = None
        if file_path.suffix in ['.ts', '.tsx'] and self.ts_parser:
            parser = self.ts_parser
        elif self.js_parser:
            parser = self.js_parser
        
        if not parser:
            return imports
        
        try:
            tree = parser.parse(content)
            root = tree.root_node
            
            # Walk AST to find import/require statements
            def walk(node):
                if node.type == 'import_statement':
                    # ES6 import: import ... from 'path'
                    source_node = None
                    for child in node.children:
                        if child.type == 'string':
                            source_node = child
                            break
                    
                    if source_node:
                        import_text = content[source_node.start_byte:source_node.end_byte].decode('utf-8')
                        import_path = import_text.strip("'\"")
                        normalized = self.normalize_import_path(import_path, file_path)
                        if normalized:
                            imports.add(normalized)
                
                elif node.type == 'call_expression':
                    # require('path') or import('path')
                    if len(node.children) >= 2:
                        func_name = content[node.children[0].start_byte:node.children[0].end_byte].decode('utf-8')
                        if func_name in ['require', 'import']:
                            arg_node = node.children[1]
                            if arg_node.type == 'string':
                                import_text = content[arg_node.start_byte:arg_node.end_byte].decode('utf-8')
                                import_path = import_text.strip("'\"")
                                normalized = self.normalize_import_path(import_path, file_path)
                                if normalized:
                                    imports.add(normalized)
                
                for child in node.children:
                    walk(child)
            
            walk(root)
        except Exception as e:
            # Fall back to regex if AST parsing fails
            pass
        
        return imports
    
    def extract_imports_regex(self, file_path: Path) -> Set[str]:
        """Extract imports using regex (fallback)"""
        imports = set()
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # ES6 imports: import ... from 'path'
            pattern = r"(?:import|from)\s+['\"]([^'\"]+)['\"]"
            for match in re.finditer(pattern, content):
                import_path = match.group(1)
                normalized = self.normalize_import_path(import_path, file_path)
                if normalized:
                    imports.add(normalized)
            
            # require('path')
            pattern = r"require\(['\"]([^'\"]+)['\"]\)"
            for match in re.finditer(pattern, content):
                import_path = match.group(1)
                normalized = self.normalize_import_path(import_path, file_path)
                if normalized:
                    imports.add(normalized)
        
        except Exception:
            pass
        
        return imports
    
    def build_dependency_graph(self):
        """Build dependency graph from all files"""
        print("📊 Building dependency graph...")
        
        use_ast = self.setup_parsers()
        
        # Get all files
        client_files = self.get_all_js_files(CLIENT_DIR) if CLIENT_DIR.exists() else []
        server_files = self.get_all_js_files(SERVER_DIR) if SERVER_DIR.exists() else []
        all_files = client_files + server_files
        
        print(f"  Found {len(all_files)} files to analyze")
        
        # Track all files
        for file_path in all_files:
            rel_path = str(file_path.relative_to(BASE_DIR)).replace('\\', '/')
            self.all_files.add(file_path)
            self.file_to_module[rel_path] = rel_path
        
        # Extract imports
        for file_path in all_files:
            rel_path = str(file_path.relative_to(BASE_DIR)).replace('\\', '/')
            
            if use_ast:
                with open(file_path, 'rb') as f:
                    content = f.read()
                imports = self.extract_imports_from_ast(file_path, content)
            else:
                imports = self.extract_imports_regex(file_path)
            
            for imported in imports:
                self.import_graph[rel_path].add(imported)
                self.imported_files.add(imported)
        
        print(f"  Built graph with {len(self.import_graph)} nodes and {sum(len(deps) for deps in self.import_graph.values())} edges")
    
    def detect_circular_dependencies(self):
        """Detect circular dependencies in the import graph"""
        print("\n🔄 Checking for circular dependencies...")
        
        if not HAS_NETWORKX:
            print("  ⚠️  networkx not available, using simple DFS")
            self._detect_circular_simple()
            return
        
        # Build NetworkX graph
        G = nx.DiGraph()
        for source, targets in self.import_graph.items():
            for target in targets:
                if target in self.file_to_module:
                    G.add_edge(source, target)
        
        # Find cycles
        try:
            cycles = list(nx.simple_cycles(G))
            if cycles:
                print(f"  ❌ Found {len(cycles)} circular dependency chain(s):")
                for i, cycle in enumerate(cycles[:10], 1):  # Limit to 10
                    print(f"\n    Cycle {i}:")
                    for j, node in enumerate(cycle):
                        arrow = " → " if j < len(cycle) - 1 else " → (back to start)"
                        print(f"      {node}{arrow}")
                    
                    # Create issue for first file in cycle
                    if cycle:
                        self.dependency_issues.append(DependencyIssue(
                            file=cycle[0],
                            line=0,
                            issue_type="circular",
                            message=f"Circular dependency detected: {' → '.join(cycle[:3])}{'...' if len(cycle) > 3 else ''}",
                            severity="error",
                            details={"cycle": cycle}
                        ))
                
                if len(cycles) > 10:
                    print(f"\n    ... and {len(cycles) - 10} more cycles")
            else:
                print("  ✅ No circular dependencies found")
        except Exception as e:
            print(f"  ⚠️  Error detecting cycles: {e}")
            self._detect_circular_simple()
    
    def _detect_circular_simple(self):
        """Simple DFS-based cycle detection"""
        visited = set()
        rec_stack = set()
        cycles = []
        
        def dfs(node, path):
            if node in rec_stack:
                # Found cycle
                cycle_start = path.index(node)
                cycle = path[cycle_start:] + [node]
                cycles.append(cycle)
                return
            
            if node in visited:
                return
            
            visited.add(node)
            rec_stack.add(node)
            
            for neighbor in self.import_graph.get(node, []):
                if neighbor in self.file_to_module:
                    dfs(neighbor, path + [node])
            
            rec_stack.remove(node)
        
        for node in self.import_graph:
            if node not in visited:
                dfs(node, [])
        
        if cycles:
            print(f"  ❌ Found {len(cycles)} circular dependency chain(s)")
            for cycle in cycles[:5]:
                self.dependency_issues.append(DependencyIssue(
                    file=cycle[0],
                    line=0,
                    issue_type="circular",
                    message=f"Circular dependency: {' → '.join(cycle[:3])}{'...' if len(cycle) > 3 else ''}",
                    severity="error",
                    details={"cycle": cycle}
                ))
        else:
            print("  ✅ No circular dependencies found")
    
    def check_forbidden_dependencies(self):
        """Check for forbidden dependencies based on architecture rules"""
        print("\n🚫 Checking forbidden dependencies...")
        
        # Architecture rules from check-boundaries.js
        forbidden_patterns = [
            {
                "name": "Domain Core → Routes",
                "source_pattern": r"src/(liaizen|core|domain)/.*",
                "forbidden_pattern": r"(routes|socketHandlers|server\.js)",
                "severity": "error"
            },
            {
                "name": "Domain Core → Express",
                "source_pattern": r"src/(liaizen|core|domain)/.*",
                "forbidden_pattern": r"express",
                "severity": "error"
            },
            {
                "name": "Client → Server",
                "source_pattern": r"chat-client-vite/.*",
                "forbidden_pattern": r"chat-server/",
                "severity": "error"
            },
            {
                "name": "Server → Client",
                "source_pattern": r"chat-server/.*",
                "forbidden_pattern": r"chat-client-vite/",
                "severity": "error"
            }
        ]
        
        violations = []
        for rule in forbidden_patterns:
            source_re = re.compile(rule["source_pattern"])
            forbidden_re = re.compile(rule["forbidden_pattern"])
            
            for source_file, targets in self.import_graph.items():
                if source_re.match(source_file):
                    for target in targets:
                        if forbidden_re.search(target) or forbidden_re.search(str(target)):
                            violations.append({
                                "source": source_file,
                                "target": target,
                                "rule": rule["name"],
                                "severity": rule["severity"]
                            })
        
        if violations:
            print(f"  ❌ Found {len(violations)} forbidden dependency violations:")
            for v in violations[:10]:
                print(f"    {v['source']} → {v['target']} ({v['rule']})")
                self.dependency_issues.append(DependencyIssue(
                    file=v['source'],
                    line=0,
                    issue_type="forbidden",
                    message=f"Forbidden dependency: {v['target']} ({v['rule']})",
                    severity=v['severity'],
                    details={"target": v['target'], "rule": v['rule']}
                ))
            
            if len(violations) > 10:
                print(f"    ... and {len(violations) - 10} more violations")
        else:
            print("  ✅ No forbidden dependencies found")
    
    def scan_env_var_usage(self):
        """Scan code for environment variable usage"""
        print("\n🔍 Scanning for environment variable usage...")
        
        patterns = [
            (r"process\.env\.([A-Z_][A-Z0-9_]*)", "process.env"),
            (r"import\.meta\.env\.([A-Z_][A-Z0-9_]*)", "import.meta.env"),
            (r"process\.env\[['\"]([A-Z_][A-Z0-9_]*)['\"]\]", "process.env[]"),
        ]
        
        all_files = list(self.all_files)
        for file_path in all_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    lines = content.splitlines()
                
                for line_num, line in enumerate(lines, 1):
                    for pattern, source in patterns:
                        for match in re.finditer(pattern, line):
                            var_name = match.group(1)
                            rel_path = str(file_path.relative_to(BASE_DIR)).replace('\\', '/')
                            self.env_vars_used[var_name].append((rel_path, line_num))
            except Exception:
                continue
        
        print(f"  Found {len(self.env_vars_used)} unique environment variables used")
    
    def load_env_examples(self):
        """Load environment variables from .env.example files"""
        env_files = [
            SERVER_DIR / ".env.example",
            CLIENT_DIR / ".env.example",
            BASE_DIR / ".env.example"
        ]
        
        for env_file in env_files:
            if env_file.exists():
                try:
                    with open(env_file, 'r') as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith('#') and '=' in line:
                                var_name = line.split('=')[0].strip()
                                self.env_vars_documented.add(var_name)
                except Exception:
                    continue
        
        print(f"  Found {len(self.env_vars_documented)} documented environment variables")
    
    def check_env_var_consistency(self):
        """Check environment variable consistency"""
        print("\n📋 Checking environment variable consistency...")
        
        self.scan_env_var_usage()
        self.load_env_examples()
        
        # Check: used but not documented
        for var_name, usages in self.env_vars_used.items():
            if var_name not in self.env_vars_documented:
                for file_path, line_num in usages:
                    self.env_var_issues.append(EnvVarIssue(
                        var_name=var_name,
                        issue_type="used_but_not_documented",
                        file=file_path,
                        line=line_num,
                        severity="warning"
                    ))
        
        # Check: documented but unused
        for var_name in self.env_vars_documented:
            if var_name not in self.env_vars_used:
                self.env_var_issues.append(EnvVarIssue(
                    var_name=var_name,
                    issue_type="documented_but_unused",
                    file=".env.example",
                    line=0,
                    severity="info"
                ))
        
        # Report
        used_not_doc = [i for i in self.env_var_issues if i.issue_type == "used_but_not_documented"]
        doc_not_used = [i for i in self.env_var_issues if i.issue_type == "documented_but_unused"]
        
        if used_not_doc:
            print(f"  ⚠️  {len(used_not_doc)} variables used but not in .env.example:")
            for issue in used_not_doc[:10]:
                print(f"    {issue.var_name} (used in {issue.file}:{issue.line})")
        
        if doc_not_used:
            print(f"  ℹ️  {len(doc_not_used)} variables in .env.example but not used in code")
        
        if not used_not_doc and not doc_not_used:
            print("  ✅ All environment variables are consistent")
        elif not used_not_doc:
            print("  ✅ All used variables are documented")
    
    def detect_dead_code(self):
        """Detect potentially unused files/modules"""
        print("\n💀 Detecting dead code...")
        
        # Entry points (should not be flagged as dead)
        entry_points = {
            "server.js",
            "main.jsx",
            "index.js",
            "index.jsx",
            "App.jsx",
            "App.js"
        }
        
        # Test files (should not be flagged)
        test_patterns = [r"\.test\.", r"\.spec\.", r"__tests__", r"__mocks__"]
        
        # Find files that are never imported
        all_file_paths = {str(f.relative_to(BASE_DIR)).replace('\\', '/') for f in self.all_files}
        
        dead_files = []
        for file_path in all_file_paths:
            # Skip entry points
            if any(file_path.endswith(ep) for ep in entry_points):
                continue
            
            # Skip test files
            if any(re.search(pattern, file_path) for pattern in test_patterns):
                continue
            
            # Skip if file is imported
            if file_path in self.imported_files:
                continue
            
            # Check if it's a barrel file (index.js that re-exports)
            if file_path.endswith('/index.js') or file_path.endswith('/index.ts'):
                # Barrel files might not be directly imported but are used
                parent_dir = '/'.join(file_path.split('/')[:-1])
                if any(imp.startswith(parent_dir + '/') for imp in self.imported_files):
                    continue
            
            # Determine confidence
            confidence = "medium"
            if file_path.endswith('.test.') or file_path.endswith('.spec.'):
                confidence = "low"  # Test files might be run directly
            
            dead_files.append({
                "file": file_path,
                "confidence": confidence,
                "reason": "File is never imported by any other file"
            })
        
        if dead_files:
            print(f"  ⚠️  Found {len(dead_files)} potentially unused files:")
            for item in dead_files[:20]:
                print(f"    [{item['confidence'].upper()}] {item['file']}")
                self.dead_code_issues.append(DeadCodeIssue(
                    file=item['file'],
                    confidence=item['confidence'],
                    reason=item['reason'],
                    suggested_action="Review and remove if truly unused"
                ))
            
            if len(dead_files) > 20:
                print(f"    ... and {len(dead_files) - 20} more files")
        else:
            print("  ✅ No dead code detected")
    
    def generate_report(self, output_file: Optional[Path] = None):
        """Generate JSON report"""
        report = {
            "dependency_issues": [asdict(issue) for issue in self.dependency_issues],
            "env_var_issues": [asdict(issue) for issue in self.env_var_issues],
            "dead_code_issues": [asdict(issue) for issue in self.dead_code_issues],
            "summary": {
                "total_dependency_issues": len(self.dependency_issues),
                "total_env_var_issues": len(self.env_var_issues),
                "total_dead_code_issues": len(self.dead_code_issues),
                "circular_dependencies": len([i for i in self.dependency_issues if i.issue_type == "circular"]),
                "forbidden_dependencies": len([i for i in self.dependency_issues if i.issue_type == "forbidden"]),
            }
        }
        
        if output_file:
            with open(output_file, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"\n📄 Report saved to {output_file}")
        
        return report
    
    def analyze_all(self, checks: List[str] = None):
        """Run all analyses"""
        if checks is None:
            checks = ["dependencies", "env", "dead-code"]
        
        print("🏗️  Architecture Analysis")
        print("=" * 80)
        
        # Always build graph first (needed for multiple checks)
        if "dependencies" in checks or "dead-code" in checks:
            self.build_dependency_graph()
        
        if "dependencies" in checks:
            self.detect_circular_dependencies()
            self.check_forbidden_dependencies()
        
        if "env" in checks:
            self.check_env_var_consistency()
        
        if "dead-code" in checks:
            self.detect_dead_code()
        
        # Generate report
        reports_dir = BASE_DIR / "reports"
        reports_dir.mkdir(exist_ok=True)
        report_file = reports_dir / "architecture_analysis.json"
        report = self.generate_report(report_file)
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 Summary")
        print("=" * 80)
        print(f"  Dependency Issues: {report['summary']['total_dependency_issues']}")
        print(f"    - Circular: {report['summary']['circular_dependencies']}")
        print(f"    - Forbidden: {report['summary']['forbidden_dependencies']}")
        print(f"  Environment Variable Issues: {report['summary']['total_env_var_issues']}")
        print(f"  Dead Code Issues: {report['summary']['total_dead_code_issues']}")
        
        # Return success status
        has_errors = any(
            issue.severity == "error"
            for issue in self.dependency_issues
        )
        
        return not has_errors


def main():
    parser = argparse.ArgumentParser(description="Analyze project architecture")
    parser.add_argument(
        "--check",
        nargs="+",
        choices=["dependencies", "env", "dead-code"],
        default=["dependencies", "env", "dead-code"],
        help="Which checks to run"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress output (only show errors)"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output JSON only"
    )
    
    args = parser.parse_args()
    
    analyzer = ArchitectureAnalyzer()
    success = analyzer.analyze_all(args.check)
    
    if args.json:
        report_file = BASE_DIR / "reports" / "architecture_analysis.json"
        if report_file.exists():
            with open(report_file) as f:
                print(json.dumps(json.load(f), indent=2))
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
