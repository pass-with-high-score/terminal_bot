#!/usr/bin/env python3
"""
SSH Terminal Bot - Entry Point
Telegram bot hoạt động như một SSH client
"""

import sys

from bot import main


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Bot đã dừng.")
        sys.exit(0)
    except ValueError as e:
        print(f"❌ Lỗi cấu hình: {e}")
        print("Hãy kiểm tra file .env của bạn.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        sys.exit(1)
