# 项目任务管理系统 - 云端版

基于 Next.js + Supabase 的多人任务管理系统。

## 部署步骤

### 1. 注册 Supabase（数据库）
1. 访问 https://supabase.com
2. 用 GitHub 账号登录
3. 点击 "New Project"
4. 输入项目名称，选择地区（选 Asia/Singapore）
5. 等待数据库创建完成（约 1-2 分钟）

### 2. 创建数据表
在 Supabase SQL Editor 中执行以下 SQL：

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

-- 开启 RLS（行级安全）
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略（仅用于内部团队）
CREATE POLICY "Allow all" ON roles FOR ALL USING (true);
CREATE POLICY "Allow all" ON people FOR ALL USING (true);
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true);
```

### 3. 获取连接信息
1. 在 Supabase 项目页面点击 "Settings" → "API"
2. 复制以下信息：
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - anon public (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 4. 更新环境变量
编辑 `.env.local` 文件，填入上面的值：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. 部署到 Vercel
1. 访问 https://vercel.com，用 GitHub 登录
2. 点击 "New Project"
3. 导入你的代码仓库
4. 在 Environment Variables 中添加：
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
5. 点击 Deploy

### 6. 访问网站
部署完成后，Vercel 会给你一个网址，例如：https://your-project.vercel.app
把这个网址发给团队成员即可使用！

## 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 注意事项

1. Supabase 免费额度足够 10 人使用：
   - 500MB 数据库空间
   - 2GB 带宽/月
   - 无限用户

2. 所有数据存储在云端，刷新页面不会丢失

3. 支持多人同时访问和编辑

## 技术支持

有问题随时联系我！
