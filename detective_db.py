import pymongo
import sys

# ==========================================
# 你的云端集群地址 (去掉了具体的数据库名，这样能扫描全部)
MONGO_URI = "mongodb+srv://swiiftlyfs:yVOGAFZtnxRISLMk@cluster0.lzdn6.mongodb.net/?retryWrites=true&w=majority"
# ==========================================

def detective():
    print("🕵️‍♂️ 正在连接云端集群 (Atlas)...")
    
    try:
        client = pymongo.MongoClient(MONGO_URI)
        # 测试连接
        client.admin.command('ping')
        print("✅ 连接成功！正在扫描所有数据库...")
    except Exception as e:
        print(f"❌ 连接失败: {e}")
        return

    # 1. 列出集群里所有的数据库
    all_dbs = client.list_database_names()
    
    print("\n📦 发现以下数据库：")
    print("="*40)
    target_db_name = ""
    
    for i, db_name in enumerate(all_dbs):
        # 排除系统自带的
        if db_name in ['admin', 'config', 'local']:
            continue
            
        # 获取这个数据库里的表
        db = client[db_name]
        cols = db.list_collection_names()
        count = 0
        if 'companies' in cols:
            count = db['companies'].count_documents({})
        elif 'users' in cols: # 如果没有 companies 表，看看 users 表
             count = db['users'].count_documents({})
             
        print(f"[{i}] 数据库名: {db_name} \t (包含 companies/users 数据: {count} 条)")

    print("="*40)
    print("💡 提示：通常数据最多的那个就是你的目标！(可能是 'test')")

    # 2. 选择数据库
    try:
        db_index = int(input("\n👉 请输入藏有数据的数据库【序号】: "))
        target_db_name = all_dbs[db_index]
        print(f"📂 已选中目标数据库: {target_db_name}")
    except:
        print("❌ 选择无效。")
        return

    # 3. 开始清理逻辑
    db = client[target_db_name]
    collection = db['companies'] # 或者是 'Company'
    
    # 二次确认表名
    if 'companies' not in db.list_collection_names():
        print(f"⚠️ 在 {target_db_name} 里没找到 'companies' 表。")
        # 尝试找找别的
        print(f"现有的表: {db.list_collection_names()}")
        col_name = input("👉 请手动输入表名 (比如 users): ")
        collection = db[col_name]
    
    all_docs = list(collection.find({}))
    
    if not all_docs:
        print("❌ 这个表是空的！请重新运行脚本选另一个数据库。")
        return

    print(f"\n📋 在 {target_db_name} 库里发现 {len(all_docs)} 条数据：")
    for idx, doc in enumerate(all_docs):
        name = doc.get('name') or doc.get('title') or doc.get('email') or 'No Name'
        print(f"[{idx}] ID: {doc.get('_id')} | Name: {name}")

    # 4. 删除逻辑
    print("\n👑 请输入 Franklin (你要保留的那个) 的【序号】")
    try:
        keep_index = int(input("👉 输入序号: "))
        target_id = all_docs[keep_index]['_id']
        target_name = all_docs[keep_index].get('name', 'Target')
    except:
        return

    ids_to_delete = [d['_id'] for d in all_docs if d['_id'] != target_id]
    
    if not ids_to_delete:
        print("🎉 没有多余数据需要清理。")
        return

    confirm = input(f"💥 即将删除其他 {len(ids_to_delete)} 条数据，确定吗？(yes): ")
    if confirm.lower() == "yes":
        collection.delete_many({"_id": {"$in": ids_to_delete}})
        print(f"✅ 清理完成！只留下了: {target_name}")

if __name__ == "__main__":
    detective()