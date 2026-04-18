# 🚀 部署指南（15分钟搞定）

## 第一步：注册 Supabase（数据库）

1. 打开 https://supabase.com
2. 点击 "Start your project" → 用 GitHub 登录
3. 点击 "New Project"
   - Organization: 选你的 GitHub 用户名
   - Name: `task-system`
   - Database Password: 点击 "Generate a password"（复制保存好！）
   - Region: **Asia Pacific (Singapore)** ← 国内访问快
4. 点击 "Create new project"
5. 等待 1-2 分钟创建完成

---

## 第二步：创建数据表

1. 进入项目后，点击左侧 **"SQL Editor"**
2. 点击 **"New query"**
3. 复制粘贴下面的完整 SQL（全部复制）：

```sql
-- 角色表
CREATE TABLE roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#667eea',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 人员表
CREATE TABLE people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#667eea',
  department TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 任务表
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  person_ids UUID[] DEFAULT '{}',
  week TEXT DEFAULT '1',
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  start_date TEXT,
  due_date TEXT,
  blockers TEXT[] DEFAULT '{}',
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 开启访问权限
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON roles FOR ALL USING (true);
CREATE POLICY "Allow all" ON people FOR ALL USING (true);
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true);

-- 插入默认角色
INSERT INTO roles (name, color) VALUES 
  ('项目经理', '#667eea'),
  ('开发工程师', '#764ba2'),
  ('测试工程师', '#f093fb'),
  ('产品经理', '#f5576c'),
  ('UI 设计师', '#4facfe'),
  ('其他', '#00f2fe');
```

4. 点击 **"Run"** 按钮执行
5. 看到 "Success. No rows returned" 就对了

---

## 第三步：获取连接信息

1. 点击左侧 **"Project Settings"**（齿轮图标）
2. 点击 **"API"**
3. 复制这两个值（后面要用）：
   - **URL**（Project URL）
   - **anon public**（anon key）

---

## 第四步：部署到 Vercel

1. 访问 https://vercel.com
2. 点击 "Start Deploying" → 用 GitHub 登录
3. 点击 "Add New..." → "Project"
4. 这时候需要先上传代码到 GitHub：

   **在你的电脑上打开命令行，进入项目目录：**
   ```bash
   cd C:\Users\zyqqw\.openclaw\workspace-xiang-mu-jin-zhan\task-system-cloud
   git init
   git add .
   git commit -m "Initial commit"
   ```

   **然后去 GitHub 创建一个新仓库（名字随便，比如 task-system），不要初始化 README**

   **回到命令行，关联并推送：**
   ```bash
   git remote add origin https://github.com/你的用户名/task-system.git
   git branch -M main
   git push -u origin main
   ```

5. 回到 Vercel，刷新页面，应该能看到你的仓库了
6. 点击 "Import"
7. 在 Environment Variables 部分，添加两个变量：
   - `NEXT_PUBLIC_SUPABASE_URL` = 你的 Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 Supabase anon key
8. 点击 "Deploy"
9. 等待 2-3 分钟，部署完成！

---

## 第五步：访问系统

1. Vercel 会给你一个网址，比如：https://your-project.vercel.app
2. 点击打开，看到登录页面就对了！
3. 把链接发给团队成员，大家都可以使用了

---

## 🎉 完成！

你现在已经有了一个完整的云端任务管理系统：
- ✅ 10个人可以同时使用
- ✅ 数据存储在云端，不会丢失
- ✅ 刷新页面数据还在
- ✅ 支持多人协作
- ✅ 完全免费

有问题随时问我！
