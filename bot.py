"""
Telegram Bot with Mini App integration
Provides /terminal command to open SSH Terminal Mini App
"""

import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Configuration
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
MINI_APP_URL = os.getenv('MINI_APP_URL', 'http://localhost:5173')


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handler for /start command"""
    welcome_text = """
👋 Welcome to **SSH Terminal Bot**!

This bot allows you to connect to SSH servers through a beautiful terminal interface.

**Commands:**
• /terminal - Open SSH Terminal Mini App
• /help - Show help message

Tap the button below to open the terminal:
"""
    
    keyboard = [[
        InlineKeyboardButton(
            text="🖥️ Open Terminal",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        welcome_text,
        parse_mode='Markdown',
        reply_markup=reply_markup
    )


async def terminal_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handler for /terminal command - opens Mini App"""
    keyboard = [[
        InlineKeyboardButton(
            text="🖥️ Open SSH Terminal",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Tap the button to open SSH Terminal:",
        reply_markup=reply_markup
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handler for /help command"""
    help_text = """
📚 **SSH Terminal Bot Help**

**How to use:**
1. Tap /terminal or the button to open Mini App
2. Enter your SSH server details (host, port, username)
3. Choose authentication method (password or private key)
4. Connect and use the terminal!

**Features:**
• Real terminal emulator with full PTY support
• Password and private key authentication
• Interactive commands (vim, nano, htop, etc.)
• Responsive design for mobile

**Security:**
• Credentials are not stored
• Direct WebSocket connection to your server
• All traffic goes through your backend

For issues, contact the bot administrator.
"""
    
    await update.message.reply_text(help_text, parse_mode='Markdown')


def main() -> None:
    """Main function to start the bot"""
    if not BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN not set!")
    
    logger.info("Starting SSH Terminal Bot...")
    
    # Create application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("terminal", terminal_command))
    application.add_handler(CommandHandler("help", help_command))
    
    # Start polling
    application.run_polling(drop_pending_updates=True)
    
    logger.info("Bot stopped.")


if __name__ == '__main__':
    main()
