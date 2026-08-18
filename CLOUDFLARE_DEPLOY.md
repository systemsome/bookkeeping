# 🚀 Cloudflare Pages + D1 多端同步部署指南

本项目原生支持 **Cloudflare Pages + D1 数据库**，代码推送到 GitHub 后可实现全自动构建，并在多设备（手机/电脑/平板）间实现毫秒级数据云端同步。

---

## 方式一：通过 Cloudflare 控制台快速一键部署（最简单）

### 第 1 步：创建 Cloudflare D1 数据库
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在左侧菜单点击 **Workers 和 Pages** -> **D1 SQL 数据库**
3. 点击 **创建数据库**，名称填写 `finance_db`，点击创建。

### 第 2 步：初始化数据表
在刚刚创建的 `finance_db` 详情页中，点击 **控制台 (Console)** 标签，粘贴以下 SQL 执行：
```sql
CREATE TABLE IF NOT EXISTS user_sync (
  user_id TEXT PRIMARY KEY,
  user_data TEXT,
  accounts_data TEXT,
  transactions_data TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 第 3 步：绑定 GitHub 仓库创建 Pages 项目
1. 在左侧菜单点击 **Workers 和 Pages** -> **创建应用程序** -> **Pages** -> **连接到 Git**
2. 选择您的 GitHub 仓库
3. 构建设置配置如下：
   - **框架预设 (Framework preset)**: `Vite`
   - **构建命令 (Build command)**: `npm run build`
   - **构建输出目录 (Build output directory)**: `dist`
4. 点击 **保存并部署**。

### 第 4 步：绑定 D1 数据库到 Pages
1. 部署完成后，进入您的 Pages 项目设置 -> **设置 (Settings)** -> **函数 (Functions)** -> **D1 数据库绑定**
2. 点击 **添加绑定**：
   - **变量名称 (Variable name)**: 必须填写 `DB`
   - **D1 数据库 (D1 Database)**: 选择您第 1 步创建的 `finance_db`
3. 重新部署一次或触发新的 Commit，即可实现全端数据自动云同步！

---

## 方式二：使用 Wrangler CLI 命令行部署

```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 创建 D1 数据库
npx wrangler d1 create finance_db
# 复制输出的 database_id 填入 wrangler.toml 中的 database_id

# 3. 初始化 D1 表结构
npx wrangler d1 execute finance_db --file=./d1-schema.sql --remote

# 4. 构建并部署到 Cloudflare Pages
npm run build
npx wrangler pages deploy dist --project-name=finance-manager
```

---

## 🌟 多端同步与备份方案总结

| 方案 | 适用场景 | 特点 |
| :--- | :--- | :--- |
| **Cloudflare D1 / KV** | 换设备访问、多端实时同步 | 毫秒级云同步、免费额度极大、极速响应 |
| **WebDAV 私有云同步** | 坚果云 / InfiniCLOUD / Nextcloud | 私密自主可控、无需自建服务器、多端自动保存 |
| **JSON 文件离线备份** | 定期本地归档、数据迁移、防误删 | 一键下载/拖拽恢复、支持智能去重合并 |
