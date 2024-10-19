import os
from pathlib import Path
from typing import Optional

from chainlit.logger import logger

from ._utils import is_path_inside

# Default chainlit.md file created if none exists
DEFAULT_MARKDOWN_STR = """# Welcome to Chainlit! 🚀🤖

Hi there, Developer! 👋 We're excited to have you on board. Chainlit is a powerful tool designed to help you prototype, debug and share applications built on top of LLMs.

## Useful Links 🔗

- **Documentation:** Get started with our comprehensive [Chainlit Documentation](https://docs.chainlit.io) 📚
- **Discord Community:** Join our friendly [Chainlit Discord](https://discord.gg/k73SQ3FyUh) to ask questions, share your projects, and connect with other developers! 💬

We can't wait to see what you create with Chainlit! Happy coding! 💻😊

## Welcome screen

To modify the welcome screen, edit the `chainlit.md` file at the root of your project. If you do not want a welcome screen, just leave this file empty.
"""


def init_markdown(root: str):
    """Initialize the chainlit.md file if it doesn't exist."""
    chainlit_md_file = os.path.join(root, "chainlit.md")

    if not os.path.exists(chainlit_md_file):
        with open(chainlit_md_file, "w", encoding="utf-8") as f:
            f.write(DEFAULT_MARKDOWN_STR)
            logger.info(f"Created default chainlit markdown file at {chainlit_md_file}")


def get_markdown_str(root: str, language: str) -> Optional[str]:
    """Get the chainlit.md file as a string."""
    root_path = Path(root)
    default_chainlit_md_path = root_path / "chainlit.md"

    # Split the language code to get the general language
    general_language = language.split('-')[0]

    # Define paths for specific and general language files
    specific_chainlit_md_path = root_path / f"chainlit_{language}.md"
    general_chainlit_md_path = root_path / f"chainlit_{general_language}.md"

    # Check for specific language file
    if is_path_inside(specific_chainlit_md_path, root_path) and specific_chainlit_md_path.is_file():
        chainlit_md_path = specific_chainlit_md_path
    # Check for general language file
    elif is_path_inside(general_chainlit_md_path, root_path) and general_chainlit_md_path.is_file():
        chainlit_md_path = general_chainlit_md_path
        logger.info(f"Specific language file for {language} not found. Using {general_language} version.")
    # Fall back to default
    else:
        chainlit_md_path = default_chainlit_md_path
        logger.warning(f"Language-specific markdown file for {language} or {general_language} not found. Defaulting to chainlit.md.")

    if chainlit_md_path.is_file():
        return chainlit_md_path.read_text(encoding="utf-8")
    else:
        return None
