"""File cleanup service for managing temporary files."""

import asyncio
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class CleanupService:
    """Service for cleaning up temporary files."""

    def __init__(self, uploads_dir: Path, output_dir: Path):
        self.uploads_dir = uploads_dir
        self.output_dir = output_dir
        self._cleanup_task: Optional[asyncio.Task] = None

    async def start_cleanup_scheduler(
        self,
        cleanup_interval_minutes: int = 1440,  # 24 hours
        max_file_age_minutes: int = 2880,  # 48 hours
    ):
        """
        Start the automatic cleanup scheduler.

        Args:
            cleanup_interval_minutes: How often to run cleanup (default: 1440 min)
            max_file_age_minutes: Maximum age of files to keep (default: 2880 min)
        """
        if self._cleanup_task and not self._cleanup_task.done():
            logger.info("Cleanup scheduler already running")
            return

        self._cleanup_task = asyncio.create_task(
            self._cleanup_loop(cleanup_interval_minutes, max_file_age_minutes)
        )
        logger.info(
            f"Started cleanup scheduler: every {cleanup_interval_minutes} min, "
            f"removing files older than {max_file_age_minutes} min"
        )

    async def stop_cleanup_scheduler(self):
        """Stop the cleanup scheduler."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            logger.info("Cleanup scheduler stopped")

    async def _cleanup_loop(self, interval_minutes: int, max_age_minutes: int):
        """Main cleanup loop."""
        while True:
            try:
                await asyncio.sleep(interval_minutes * 60)  # Convert to seconds
                await self.cleanup_old_files(max_age_minutes)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")

    async def cleanup_old_files(self, max_age_minutes: int = 2880):
        """
        Remove files older than specified minutes.

        Args:
            max_age_minutes: Maximum age of files to keep (in minutes)
        """
        cutoff_time = datetime.now() - timedelta(minutes=max_age_minutes)

        # Clean uploads directory
        cleaned_uploads = await self._clean_directory(self.uploads_dir, cutoff_time)

        # Clean output directory
        cleaned_output = await self._clean_directory(self.output_dir, cutoff_time)

        total_cleaned = cleaned_uploads + cleaned_output

        if total_cleaned > 0:
            logger.info(
                f"Cleaned up {total_cleaned} files "
                f"({cleaned_uploads} uploads, {cleaned_output} outputs)"
            )

        return total_cleaned

    async def _clean_directory(self, directory: Path, cutoff_time: datetime) -> int:
        """Clean a specific directory."""
        if not directory.exists():
            return 0

        cleaned_count = 0

        try:
            for file_path in directory.iterdir():
                if file_path.is_file():
                    # Get file modification time
                    file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)

                    if file_mtime < cutoff_time:
                        try:
                            file_path.unlink()
                            cleaned_count += 1
                            logger.debug(f"Removed old file: {file_path.name}")
                        except Exception as e:
                            logger.error(f"Failed to remove {file_path}: {e}")

        except Exception as e:
            logger.error(f"Error cleaning directory {directory}: {e}")

        return cleaned_count

    async def cleanup_all_files(self):
        """Remove all files from both directories (use with caution)."""
        uploads_count = await self._clean_all_in_directory(self.uploads_dir)
        output_count = await self._clean_all_in_directory(self.output_dir)

        total = uploads_count + output_count
        logger.info(
            f"Removed all {total} files "
            f"({uploads_count} uploads, {output_count} outputs)"
        )

        return total

    async def _clean_all_in_directory(self, directory: Path) -> int:
        """Remove all files from a directory."""
        if not directory.exists():
            return 0

        count = 0
        for file_path in directory.iterdir():
            if file_path.is_file():
                try:
                    file_path.unlink()
                    count += 1
                except Exception as e:
                    logger.error(f"Failed to remove {file_path}: {e}")

        return count

    def get_directory_stats(self) -> dict:
        """Get statistics about both directories."""

        def get_dir_stats(directory: Path) -> dict:
            if not directory.exists():
                return {"file_count": 0, "total_size": 0, "oldest_file": None}

            files = list(directory.iterdir())
            files = [f for f in files if f.is_file()]

            if not files:
                return {"file_count": 0, "total_size": 0, "oldest_file": None}

            total_size = sum(f.stat().st_size for f in files)
            oldest_file = min(files, key=lambda f: f.stat().st_mtime)
            oldest_time = datetime.fromtimestamp(oldest_file.stat().st_mtime)

            return {
                "file_count": len(files),
                "total_size": total_size,
                "oldest_file": oldest_file.name,
                "oldest_file_age": (datetime.now() - oldest_time).total_seconds()
                / 60,  # minutes
            }

        return {
            "uploads": get_dir_stats(self.uploads_dir),
            "output": get_dir_stats(self.output_dir),
        }
