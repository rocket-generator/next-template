#!/usr/bin/env python3
"""
Convert all .mdc files from .cursor/rules directory to a single markdown file.

This script combines all .mdc files in the specified input directory
and outputs them to a single markdown file.

Usage:
    python convert_cursor_rules_to_one_file.py
    python convert_cursor_rules_to_one_file.py --input-dir /path/to/input --output-file /path/to/output.md
"""

import argparse
import os
import sys
from pathlib import Path
from typing import List


def get_mdc_files(input_dir: Path) -> List[Path]:
    """
    Get all .mdc files from the input directory, sorted by filename.
    
    Args:
        input_dir: Path to the input directory
        
    Returns:
        List of Path objects for .mdc files, sorted by filename
        
    Raises:
        FileNotFoundError: If input directory doesn't exist
    """
    if not input_dir.exists():
        raise FileNotFoundError(f"Input directory does not exist: {input_dir}")
    
    if not input_dir.is_dir():
        raise NotADirectoryError(f"Input path is not a directory: {input_dir}")
    
    mdc_files = list(input_dir.glob("*.mdc"))
    return sorted(mdc_files)


def read_file_content(file_path: Path) -> str:
    """
    Read content from a file with UTF-8 encoding.
    
    Args:
        file_path: Path to the file to read
        
    Returns:
        Content of the file as string
        
    Raises:
        IOError: If file cannot be read
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        raise IOError(f"Failed to read file {file_path}: {e}")


def combine_mdc_files(mdc_files: List[Path]) -> str:
    """
    Combine content from multiple .mdc files into a single string.
    
    Args:
        mdc_files: List of Path objects for .mdc files
        
    Returns:
        Combined content as string
        
    Raises:
        IOError: If any file cannot be read
    """
    combined_content = []
    
    for file_path in mdc_files:
        try:
            content = read_file_content(file_path)
            
            # Add file header
            file_header = f"\n# {file_path.stem}\n\n"
            combined_content.append(file_header)
            combined_content.append(content)
            combined_content.append("\n\n---\n\n")
            
        except IOError as e:
            print(f"Warning: {e}", file=sys.stderr)
            continue
    
    return "".join(combined_content)


def write_output_file(content: str, output_file: Path) -> None:
    """
    Write content to output file, creating parent directories if needed.
    
    Args:
        content: Content to write
        output_file: Path to output file
        
    Raises:
        IOError: If file cannot be written
    """
    try:
        # Create parent directories if they don't exist
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        raise IOError(f"Failed to write output file {output_file}: {e}")


def main():
    """Main function to execute the script."""
    parser = argparse.ArgumentParser(
        description="Convert all .mdc files from input directory to a single markdown file",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python convert_cursor_rules_to_one_file.py
  python convert_cursor_rules_to_one_file.py --input-dir /path/to/input --output-file /path/to/output.md
        """
    )
    
    parser.add_argument(
        '--input-dir',
        type=Path,
        default=Path('.cursor/rules'),
        help='Input directory containing .mdc files (default: .cursor/rules)'
    )
    
    parser.add_argument(
        '--output-file',
        type=Path,
        default=Path('documents/rules.md'),
        help='Output markdown file path (default: documents/rules.md)'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose output'
    )
    
    args = parser.parse_args()
    
    try:
        if args.verbose:
            print(f"Input directory: {args.input_dir}")
            print(f"Output file: {args.output_file}")
        
        # Get all .mdc files
        mdc_files = get_mdc_files(args.input_dir)
        
        if not mdc_files:
            print(f"No .mdc files found in {args.input_dir}")
            return 1
        
        if args.verbose:
            print(f"Found {len(mdc_files)} .mdc files:")
            for file_path in mdc_files:
                print(f"  - {file_path.name}")
        
        # Combine files
        combined_content = combine_mdc_files(mdc_files)
        
        # Write output
        write_output_file(combined_content, args.output_file)
        
        print(f"Successfully combined {len(mdc_files)} files into {args.output_file}")
        return 0
        
    except (FileNotFoundError, NotADirectoryError, IOError) as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
