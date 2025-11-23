# Personal Inventory Management System | 个人库存管理系统

![License](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)
![Docker](https://img.shields.io/badge/Docker-Supported-blue)
![AI Generated](https://img.shields.io/badge/AI-Gemini%203.0%20Pro-orange)

[English](#english) | [中文](#中文)

---

<a name="english"></a>
## 🇬🇧 English

### 🤖 AI-Generated Code Declaration
This project was architected and the core code was generated with the assistance of **Google Gemini 3.0 Pro**.

### 📖 Introduction
A modern, responsive, and locally-hosted inventory management system designed for personal use, home labs, or small businesses. It allows you to track items, manage locations hierarchically, print labels, and visualize your assets.

### ✨ Features

*   **Item Management**: Create, edit, delete, and archive inventory items with details like quantity, price, purchase date, and notes.
*   **Hierarchical Locations**: Manage storage locations with infinite depth (e.g., Warehouse -> Aisle -> Shelf -> Bin). Supports moving items and sub-locations.
*   **Smart Tagging**: Organize items with tags. Includes a "Recent Tags" suggestion feature for quick entry.
*   **Image Optimization**:
    *   Automatic image compression (WebP format) and resizing (max 1600px) to save space.
    *   **MD5 Deduplication**: Identical images uploaded multiple times are stored only once.
    *   **Auto-Cleanup**: System automatically removes unreferenced images every 48 hours.
*   **QR Code Labels**:
    *   Generate QR code labels for locations containing a direct link to view contents.
    *   **Batch Export**: Download labels as a high-resolution (300PPI) ZIP file for printing.
    *   Compatible with 5x7cm thermal printers.
*   **Responsive UI**: Fully adapted for Desktop and Mobile devices.
*   **Bilingual Support**: One-click toggle between English and Chinese.
*   **Performance**: Server-side pagination, optimized SQL queries, and frontend debouncing for handling tens of thousands of items smoothly.

### 🛠️ Tech Stack
*   **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
*   **Backend**: Node.js, Express, SQLite, Sharp (Image processing)
*   **Deployment**: Docker (Alpine based)

### 🚀 Deployment

#### Option 1: Docker (Recommended)
You can download the pre-built Docker image (`.tar`) from the **[Releases](../../releases)** page of this repository.

1.  **Upload** the `.tar` file to your server/NAS.
2.  **Load the image**:
    ```bash
    docker load -i inventory-app.tar
    ```
3.  **Run the container**:
    *Replace `192.168.1.100` with your NAS/Server IP address.*
    *Replace `/path/to/data` with the actual path on your server where you want to store the database and images.*

    ```bash
    docker run -d \
      --name inventory-app \
      --restart unless-stopped \
      -p 3001:3001 \
      -v /path/to/data:/data \
      -e PUID=1000 \
      -e PGID=100 \
      -e QR_BASE_URL=http://192.168.1.100:3001 \
      inventory-app:latest
    ```

    *   **PUID/PGID**: Set these to your user ID to avoid permission issues on the mounted volume.
    *   **QR_BASE_URL**: The base URL encoded into the QR codes.

#### Option 2: Local Development
Requirements: Node.js v18+, npm.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/your-repo.git
    cd your-repo
    ```
2.  **Install dependencies**:
    ```bash
    npm run install:all
    ```
3.  **Start the server**:
    ```bash
    npm run dev
    ```
    Access the app at `http://127.0.0.1:3000`.

### 📄 License
This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** license.

*   ✅ **Share**: Copy and redistribute the material in any medium or format.
*   ✅ **Adapt**: Remix, transform, and build upon the material.
*   ⚠️ **Attribution**: You must give appropriate credit, provide a link to the license, and indicate if changes were made.
*   🚫 **Non-Commercial**: You may not use the material for commercial purposes.

---

<a name="中文"></a>
## 🇨🇳 中文

### 🤖 AI 构建声明
本项目的所有核心代码均由 **Google Gemini 3.0 Pro** 模型辅助构建。

### 📖 简介
这是一个现代化的、响应式的、可本地托管的个人库存管理系统。非常适合个人、家庭实验室（Home Lab）或小型工作室使用。它允许您追踪物品、管理层级化的位置、打印标签以及可视化您的资产。

### ✨ 功能特性

*   **物品管理**：增删改查库存物品，支持记录数量、单位、单价、采购日期和备注。
*   **层级位置**：支持无限层级的位置管理（例如：仓库 -> 走廊 -> 货架 -> 储物盒）。支持移动位置及其子级。
*   **智能标签**：通过标签组织物品，支持“最近使用的标签”快速录入。
*   **图片优化**：
    *   自动压缩上传图片为 WebP 格式，并调整尺寸（最大 1600px）以节省空间。
    *   **哈希去重**：相同内容的图片即便多次上传，在服务器上也只存储一份。
    *   **自动清理**：系统每48小时自动清理未被引用的孤儿图片文件。
*   **二维码标签**：
    *   为每个位置生成包含访问链接的二维码。
    *   **批量导出**：支持将标签打包为高清（300PPI）ZIP 文件下载，适配 5x7cm 热敏打印机。
*   **响应式 UI**：完美适配桌面端和移动端操作。
*   **双语支持**：内置中英文一键切换。
*   **高性能**：后端分页、SQL 查询优化以及前端防抖处理，轻松支撑数万级数据量。

### 🛠️ 技术栈
*   **前端**: React 18, TypeScript, Tailwind CSS, Vite
*   **后端**: Node.js, Express, SQLite, Sharp (图像处理)
*   **部署**: Docker (基于 Alpine Linux)

### 🚀 部署说明

#### 方案一：Docker 部署（推荐）
您可以直接从本仓库的 **[Releases](../../releases)** 页面下载编译好的 Docker 镜像包 (`.tar`)。

1.  **上传** `.tar` 文件到您的服务器或 NAS。
2.  **加载镜像**:
    ```bash
    docker load -i inventory-app.tar
    ```
3.  **运行容器**:
    *请将 `192.168.1.100` 替换为您 NAS/服务器的实际 IP。*
    *请将 `/path/to/data` 替换为您希望存储数据库和图片的实际路径。*

    ```bash
    docker run -d \
      --name inventory-app \
      --restart unless-stopped \
      -p 3001:3001 \
      -v /path/to/data:/data \
      -e PUID=1000 \
      -e PGID=100 \
      -e QR_BASE_URL=http://192.168.1.100:3001 \
      inventory-app:latest
    ```

    *   **PUID/PGID**: 设置为您当前用户的 ID，防止挂载卷出现权限问题（在终端输入 `id` 查看）。
    *   **QR_BASE_URL**: 生成二维码时写入的基础链接地址，用于扫码直达位置详情。

#### 方案二：本地源码运行
环境要求: Node.js v18+, npm.

1.  **克隆仓库**:
    ```bash
    git clone https://github.com/yourusername/your-repo.git
    cd your-repo
    ```
2.  **安装依赖**:
    ```bash
    npm run install:all
    ```
3.  **启动开发服务器**:
    ```bash
    npm run dev
    ```
    访问地址：`http://127.0.0.1:3000`

### 📄 开源协议
本项目采用 **知识共享署名-非商业性使用 4.0 国际许可协议 (CC BY-NC 4.0)** 进行许可。

*   ✅ **允许**：复制、分发、展览、表演、放映、广播或通过信息网络传播本作品；创作演绎作品。
*   ⚠️ **署名**：您必须给出适当的署名，提供指向本许可协议的链接，同时标明是否（对原始作品）作了修改。
*   🚫 **非商业性使用**：您不得将本作品用于商业目的。
