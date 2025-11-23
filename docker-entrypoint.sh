#!/bin/sh
set -e

# 获取环境变量
PUID=${PUID:-1000}
PGID=${PGID:-1000}

echo "Starting with PUID: $PUID, PGID: $PGID"

# --- 1. 处理组 (Group) ---
# 使用 getent 检测组是否存在
if getent group "$PGID" >/dev/null; then
    GROUP_NAME=$(getent group "$PGID" | cut -d: -f1)
    echo "GID $PGID exists as group '$GROUP_NAME', using it."
else
    addgroup -g "$PGID" inventory
    GROUP_NAME="inventory"
    echo "Created group '$GROUP_NAME' with GID $PGID."
fi

# --- 2. 处理用户 (User) ---
# 使用 getent 检测用户是否存在 (更稳健)
if getent passwd "$PUID" >/dev/null; then
    USER_NAME=$(getent passwd "$PUID" | cut -d: -f1)
    echo "UID $PUID exists as user '$USER_NAME', using it."
    
    # 将现有的用户加入到目标组中 (处理权限关键)
    # Alpine 语法: addgroup user group
    addgroup "$USER_NAME" "$GROUP_NAME"
else
    # 创建新用户
    adduser -D -u "$PUID" -G "$GROUP_NAME" inventory
    USER_NAME="inventory"
    echo "Created user '$USER_NAME' with UID $PUID."
fi

# --- 3. 修复权限 ---
echo "Fixing permissions for /data..."
chown -R "$PUID":"$PGID" /data

# --- 4. 启动应用 ---
echo "Starting application as $USER_NAME..."
exec su-exec "$USER_NAME" "$@"