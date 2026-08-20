# 🏠 本地 NAS Docker 部署与多端实时数据同步全指南

本项目已完全支持 **Docker 容器化部署**，可直接运行在各类主流 NAS（群晖 Synology、威联通 QNAP、极空间、绿联 UGREEN、unRAID、TrueNAS 等）或本地 Linux 服务器上。

通过容器的 **数据卷挂载（Volume）** 与 **内置持久化同步服务**，您可以实现数据 100% 私有化存储在 NAS 硬盘中，并在手机、平板、电脑等任意设备之间实现无缝数据同步！

---

## 目录
1. [方案一：Docker Compose 一键部署（推荐）](#方案一docker-compose-一键部署推荐)
2. [方案二：群晖 Synology Container Manager 图形化部署](#方案二群晖-synology-container-manager-图形化部署)
3. [方案三：极空间 / 绿联 / 威联通 图形化部署](#方案三极空间--绿联--威联通-图形化部署)
4. [如何实现换设备 / 跨网络多端实时同步？](#如何实现换设备--跨网络多端实时同步)
5. [双保险：联动 NAS 自带 WebDAV 定时备份](#双保险联动-nas-自带-webdav-定时备份)
6. [容器日常维护与数据迁移](#容器日常维护与数据迁移)

---

## 方案一：Docker Compose 一键部署（推荐）

### 1. 准备项目文件
在 NAS 的 Docker 共享文件夹（例如 `/volume1/docker/finance-manager`）下拉取或上传本项目代码。

### 2. 目录结构预览
```text
/volume1/docker/finance-manager/
├── Dockerfile
├── docker-compose.yml
├── server.ts
├── package.json
├── dist/ (构建后自动生成)
└── data/ (持久化存储目录，自动生成)
    └── sync_store.json (您的全部资产与记账数据)
```

### 3. 一键构建并启动
在项目根目录运行：
```bash
docker compose up -d --build
```
启动成功后，在浏览器访问 `http://<NAS的局域网IP>:3000` 即可使用！

---

## 方案二：群晖 Synology Container Manager 图形化部署

### 第 1 步：创建 NAS 本地存储文件夹
1. 打开群晖 **File Station**；
2. 在 `docker` 目录下新建文件夹 `finance-manager`，并在其内部新建子文件夹 `data`（最终路径为 `docker/finance-manager/data`）。

### 第 2 步：通过 Container Manager 创建项目
1. 打开群晖 **Container Manager** 套件；
2. 点击左侧 **项目 (Project)** -> 点击 **新增 (Create)**；
3. **项目名称**：输入 `finance-manager`；
4. **路径**：选择刚刚创建的 `docker/finance-manager` 文件夹；
5. **来源**：选择「创建 docker-compose.yml」，将项目根目录的 `docker-compose.yml` 内容粘贴进去：
   ```yaml
   version: '3.8'
   services:
     finance-manager:
       build:
         context: .
         dockerfile: Dockerfile
       image: finance-manager:latest
       container_name: finance-manager
       restart: unless-stopped
       ports:
         - "3000:3000"
       volumes:
         - ./data:/app/data
       environment:
         - NODE_ENV=production
         - PORT=3000
         - DATA_DIR=/app/data
   ```
6. 点击下一步并完成构建启动。

---

## 方案三：极空间 / 绿联 / 威联通 图形化部署

1. **镜像构建/拉取**：在终端或 NAS Docker 管理界面中选择通过 Dockerfile 构建镜像 `finance-manager:latest`。
2. **创建容器配置**：
   - **容器名称**：`finance-manager`
   - **重启策略**：开启「开机自启 / 除非停止」
   - **端口映射**：本地端口 `3000`（或未占用的自定义端口如 `8088`） ➡️ 容器内部端口 `3000`
   - **存储空间/文件夹挂载（核心重点）**：
     - 本地 NAS 目录：选择任意 NAS 文件夹（如 `/极空间/Docker/finance/data`）
     - 容器内部路径：必须填写 `/app/data`
     - 读写权限：**读写 (Read & Write)**
3. 点击创建并运行容器。

---

## 如何实现换设备 / 跨网络多端实时同步？

当项目运行在 NAS 容器中时，服务端的 `/api/sync` 接口已自动将数据持久化保存在 NAS 挂载的 `/app/data/sync_store.json` 中。

### 1. 同一局域网内访问（家庭/办公室）
- **电脑/手机/平板**：浏览器直接打开 `http://192.168.x.x:3000`（替换为您 NAS 的真实内网 IP）。
- **注册/登录同一账号**：所有设备打开右上角的 **「云同步与备份」**，系统会自动连接 NAS 后端进行双向同步。在手机上记账，电脑刷新或点击同步即可秒级看到最新数据！

### 2. 外网出门在外远程访问与同步（常见4种方式）
| 方式 | 适用场景 | 说明 |
| :--- | :--- | :--- |
| **Tailscale / ZeroTier 虚拟组网** | 手机/电脑随时异地同步（最推荐） | 无需公网 IP，在手机和电脑安装 Tailscale 客户端，直接使用 NAS 的 100.x.x.x IP 即可随时随地访问记账！ |
| **Cloudflare Tunnel（内网穿透）** | 绑定自定义域名、全平台免安装客户端 | 免费、安全、自带 HTTPS 证书，手机浏览器直接打开域名即可访问。 |
| **DDNS + 路由器端口转发** | 家里有公网 IPv4 / IPv6 | 在路由器将外网端口映射到 NAS 的 3000 端口，配合域名解析访问。 |
| **Nginx Proxy Manager / 极空间远程访问** | 自带远程反向代理 | 支持安全 HTTPS 访问并支持 Webhook。 |

---

## 双保险：联动 NAS 自带 WebDAV 定时备份

如果您的 NAS 开启了 WebDAV 服务（例如群晖套件 **WebDAV Server**、极空间 WebDAV 或 Nextcloud）：

1. 在应用界面右上角点击 **「云同步与备份」** -> 切换至 **「WebDAV 云盘同步」** 标签；
2. 填写 NAS 的 WebDAV 信息：
   - **服务器地址**：`http://192.168.x.x:5005/`（群晖 WebDAV 默认端口为 5005）
   - **用户名与密码**：您的 NAS 登录账号与密码（或应用专用密码）
   - **存储路径**：`/finance_backup.json`
3. 点击 **「立即同步上传」**，即可将资产与流水加密备份一份到 NAS 的指定文件夹中，达成 **「Docker 数据库持久化」+「WebDAV 离线备份文件」** 双重安全保障！

---

## 容器日常维护与数据迁移

- **更新容器**：因为数据均存放在宿主机的 `./data` 挂载目录中，直接执行 `docker compose pull` 或重新构建 `docker compose up -d --build`，数据**完全不会丢失**。
- **备份与迁移**：只需备份 NAS 上的 `data/sync_store.json` 文件或直接拷贝 `data` 文件夹，即可在任何新设备上完整恢复所有用户的资产和记账历史。
