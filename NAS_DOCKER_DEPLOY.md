# 🏠 本地 NAS Docker 部署与多端实时数据同步全指南

本项目已完全支持 **Docker 容器化部署**，可直接运行在各类主流 NAS（群晖 Synology、威联通 QNAP、极空间、绿联 UGREEN、unRAID、TrueNAS 等）或本地 Linux 服务器上。

---

## ⚡ 为什么之前可能会启动失败？（排查速查）

1. **没有上传源码就直接在 NAS 粘贴了带有 `build: .` 的 compose 配置**：
   - ❌ 现象：报错 `failed to read dockerfile: open Dockerfile: no such file or directory` 或 `path "." not found`。
   - ✅ 解决：如果只想在 NAS 图形界面粘贴配置，请使用下面的 **【方式 1：免编译直接拉取镜像】**。
2. **NAS 本地 3000 端口已被其他服务占用**（如 Grafana/AdGuard/其他Web服务）：
   - ❌ 现象：报错 `Bind for 0.0.0.0:3000 failed: port is already allocated`。
   - ✅ 解决：将 compose 里的端口映射改为 `"8088:3000"` 或 `"3001:3000"`。
3. **健康检查格式兼容性问题**：
   - ✅ 解决：已优化为内置轻量健康检测，去除易引发 YAML 报错的转义字符。

---

## 🚀 部署方案选择

### 方式 1：免编译直接拉取预构建镜像（最推荐，适合群晖 Container Manager / 极空间 / 绿联）

不需要在 NAS 上安装 Node.js 或上传源码，只需一个 `docker-compose.yml` 即可极速拉取运行！

#### 1. 准备文件夹
在 NAS 的 `docker` 目录下新建 `finance-manager` 文件夹，并在里面新建 `data` 文件夹。

#### 2. 创建 `docker-compose.yml`
在 `docker/finance-manager` 下创建 `docker-compose.yml`，内容如下（将 `<用户名>` 替换为您的 GitHub 用户名）：

```yaml
version: '3.8'

services:
  finance-manager:
    # 替换为您的 GitHub 用户名（全小写）和仓库名
    image: ghcr.io/<您的GitHub用户名>/<仓库名>:latest
    container_name: finance-manager
    restart: unless-stopped
    ports:
      # 本地端口:容器端口（如 3000 冲突可改为 "8088:3000"）
      - "3000:3000"
    volumes:
      # 持久化数据挂载目录，升级容器数据永不丢失
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATA_DIR=/app/data
```

#### 3. 启动容器
在终端运行：
```bash
docker compose up -d
```
或在群晖 **Container Manager -> 项目** 中直接点击构建启动！

---

### 方式 2：在 NAS 本地源码一键构建

如果您将整个 Git 仓库完整克隆或上传到了 NAS 的文件夹中：

```bash
# 1. 进入包含 Dockerfile 和 package.json 的项目目录
cd /volume1/docker/finance-manager

# 2. 一键构建并启动
docker compose up -d --build
```

---

## 📱 如何实现换设备 / 跨网络多端实时同步？

当项目运行在 NAS 容器中时，服务端的 `/api/sync` 接口已自动将数据持久化保存在 NAS 挂载的 `/app/data/sync_store.json` 中。

### 1. 同一局域网内访问（家庭/办公室）
- **电脑/手机/平板**：浏览器直接打开 `http://<NAS的局域网IP>:3000`。
- **注册/登录同一账号**：所有设备打开右上角的 **「云同步与备份」**，系统会自动连接 NAS 后端进行双向同步。在手机上记账，电脑刷新或点击同步即可秒级看到最新数据！

### 2. 外网出门在外远程访问与同步（常见4种方式）
| 方式 | 适用场景 | 说明 |
| :--- | :--- | :--- |
| **Tailscale / ZeroTier 虚拟组网** | 手机/电脑随时异地同步（最推荐） | 无需公网 IP，在手机和电脑安装 Tailscale 客户端，直接使用 NAS 的 100.x.x.x IP 即可随时随地访问记账！ |
| **Cloudflare Tunnel（内网穿透）** | 绑定自定义域名、全平台免安装客户端 | 免费、安全、自带 HTTPS 证书，手机浏览器直接打开域名即可访问。 |
| **DDNS + 路由器端口转发** | 家里有公网 IPv4 / IPv6 | 在路由器将外网端口映射到 NAS 的 3000 端口，配合域名解析访问。 |
| **Nginx Proxy Manager / 极空间远程访问** | 自带远程反向代理 | 支持安全 HTTPS 访问并支持 Webhook。 |

---

## 🔒 双保险：联动 NAS 自带 WebDAV 定时备份

如果您的 NAS 开启了 WebDAV 服务（例如群晖套件 **WebDAV Server**、极空间 WebDAV 或 Nextcloud）：

1. 在应用界面右上角点击 **「云同步与备份」** -> 切换至 **「WebDAV 云盘同步」** 标签；
2. 填写 NAS 的 WebDAV 信息：
   - **服务器地址**：`http://192.168.x.x:5005/`（群晖 WebDAV 默认端口为 5005）
   - **用户名与密码**：您的 NAS 登录账号与密码（或应用专用密码）
   - **存储路径**：`/finance_backup.json`
3. 点击 **「立即同步上传」**，即可将资产与流水加密备份一份到 NAS 的指定文件夹中，达成 **「Docker 数据库持久化」+「WebDAV 离线备份文件」** 双重安全保障！
