"""
Socket Connection Diagnostic Tool

Analyzes socket connection issues by parsing logs and identifying failure patterns.
Specifically detects: "connect() called but io() never initialized" issue.
"""

import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


class SocketConnectionDiagnostic:
    """Analyzes socket connection diagnostics and generates reports."""

    def __init__(self):
        """Initialize diagnostic tool."""
        self.events: List[Dict] = []
        self.patterns = {
            'connect_called': re.compile(r'\[SocketService\].*CONNECT CALLED', re.IGNORECASE),
            'io_initialized': re.compile(r'socket\.io|io\(\)', re.IGNORECASE),
            'connection_state': re.compile(r'Connection state changed to: (\w+)', re.IGNORECASE),
            'transport_error': re.compile(r'Transport error|connect_error', re.IGNORECASE),
            'token_missing': re.compile(r'token.*MISSING|no token', re.IGNORECASE),
        }

    def parse_log_line(self, line: str) -> Optional[Dict]:
        """Parse a single log line and extract relevant information."""
        timestamp_match = re.search(r'(\d{4}-\d{2}-\d{2}T[\d:\.]+Z?)', line)
        timestamp = timestamp_match.group(1) if timestamp_match else datetime.now().isoformat()

        event = {'timestamp': timestamp, 'raw': line, 'type': 'unknown', 'details': {}}

        if self.patterns['connect_called'].search(line):
            event['type'] = 'connect_called'
            event['details'] = {'message': 'socketService.connect() was called'}
        elif self.patterns['io_initialized'].search(line):
            event['type'] = 'io_initialized'
            event['details'] = {'message': 'socket.io() was initialized'}
        elif self.patterns['connection_state'].search(line):
            match = self.patterns['connection_state'].search(line)
            event['type'] = 'connection_state_change'
            event['details'] = {'state': match.group(1) if match else 'unknown'}
        elif self.patterns['transport_error'].search(line):
            event['type'] = 'transport_error'
            event['details'] = {'message': 'Transport or connection error detected'}
        elif self.patterns['token_missing'].search(line):
            event['type'] = 'token_missing'
            event['details'] = {'message': 'Authentication token is missing'}
        else:
            return None

        return event

    def analyze_events(self) -> Dict:
        """Analyze parsed events and identify issues."""
        analysis = {
            'total_events': len(self.events),
            'issues': [],
            'timeline': sorted(self.events, key=lambda x: x['timestamp']),
            'state_sequence': [],
        }

        connect_events = [e for e in self.events if e['type'] == 'connect_called']
        io_events = [e for e in self.events if e['type'] == 'io_initialized']
        state_events = [e for e in self.events if e['type'] == 'connection_state_change']

        # Key issue: connect() called but io() never initialized
        if connect_events and not io_events:
            analysis['issues'].append({
                'severity': 'high',
                'type': 'io_not_initialized',
                'message': 'socketService.connect() was called but socket.io() was never initialized',
                'recommendation': 'Check if socket.io() runs after connect() call. This indicates connect() is failing silently before io() runs.',
            })

        if any(e['type'] == 'token_missing' for e in self.events):
            analysis['issues'].append({
                'severity': 'high',
                'type': 'token_missing',
                'message': 'Authentication token is missing',
                'recommendation': 'Ensure token is available before calling connect().',
            })

        analysis['state_sequence'] = [e['details'].get('state', 'unknown') for e in state_events]

        return analysis

    def generate_report(self, analysis: Dict) -> str:
        """Generate a human-readable diagnostic report."""
        report_lines = [
            '=' * 70,
            'Socket Connection Diagnostic Report',
            '=' * 70,
            f'Generated: {datetime.now().isoformat()}',
            f'Total Events: {analysis["total_events"]}',
            '',
        ]

        if analysis['issues']:
            report_lines.extend(['ISSUES DETECTED:', '-' * 70])
            for issue in analysis['issues']:
                report_lines.extend([
                    f'[{issue["severity"].upper()}] {issue["type"]}',
                    f'  {issue["message"]}',
                    f'  Recommendation: {issue["recommendation"]}',
                    '',
                ])
        else:
            report_lines.extend(['✅ No issues detected', ''])

        if analysis['state_sequence']:
            report_lines.extend([
                'STATE SEQUENCE:',
                '-' * 70,
                ' -> '.join(analysis['state_sequence']),
                '',
            ])

        report_lines.append('=' * 70)
        return '\n'.join(report_lines)

    def analyze_text(self, text: str) -> Dict:
        """Analyze log text directly."""
        for line in text.split('\n'):
            event = self.parse_log_line(line)
            if event:
                self.events.append(event)
        return self.analyze_events()


def main():
    """Main entry point for command-line usage."""
    import argparse

    parser = argparse.ArgumentParser(description='Diagnose socket connection issues from logs')
    parser.add_argument('--file', type=Path, help='Path to log file')
    parser.add_argument('--stdin', action='store_true', help='Read from stdin')

    args = parser.parse_args()

    diagnostic = SocketConnectionDiagnostic()

    if args.file:
        text = args.file.read_text()
    elif args.stdin:
        text = sys.stdin.read()
    else:
        parser.print_help()
        return 1

    analysis = diagnostic.analyze_text(text)
    report = diagnostic.generate_report(analysis)
    print(report)

    high_severity = [i for i in analysis.get('issues', []) if i.get('severity') == 'high']
    return 1 if high_severity else 0


if __name__ == '__main__':
    sys.exit(main())
