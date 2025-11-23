# --- 阶段 1: 构建阶段 ---
FROM node:18-alpine AS builder

# 安装构建工具
# python3-dev 和 py3-setuptools 是为了修复 Python 3.12 缺失 distutils 的问题
RUN apk add --no-cache python3 make g++ python3-dev py3-setuptools vips-dev

WORKDIR /app

# 1. 复制所有 package.json 以安装依赖
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# 2. 安装依赖
RUN npm install

# 3. 复制源代码
COPY client ./client
COPY server ./server

# 4. 构建前端
RUN cd client && npm run build

# 5. 构建后端
RUN cd server && npm run build

# --- 阶段 2: 运行阶段 ---
FROM node:18-alpine

# 安装运行时依赖
# 同样需要 py3-setuptools 来支持 node-gyp 重编译 sqlite3/sharp
RUN apk add --no-cache su-exec python3 make g++ vips-dev python3-dev py3-setuptools

WORKDIR /app

# 1. 复制后端构建产物
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./

# 2. 复制前端构建产物
COPY --from=builder /app/client/dist ./public

# 3. 复制入口脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 4. 设置环境变量
ENV NODE_ENV=production
ENV DB_FILE_PATH=/data/inventory.db
ENV UPLOADS_DIR_PATH=/data/uploads

# 5. 仅安装生产环境依赖
# 这里的 npm install 会触发 node-gyp 编译，现在有了 setuptools 就不会报错了
RUN npm install --production

# 6. 创建数据目录
RUN mkdir -p /data/uploads

# 7. 暴露端口
EXPOSE 3001

# 8. 定义入口
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]