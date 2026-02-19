import pymongo

MONGO_URI = "mongodb+srv://swiiftlyfs:yVOGAFZtnxRISLMk@cluster0.lzdn6.mongodb.net/swiftly_prod?retryWrites=true&w=majority"

def admin_sweep():
    client = pymongo.MongoClient(MONGO_URI)
    db = client["swiftly_prod"]
    # 目标锁定：admins 表
    collection = db["admins"]
    
    all_docs = list(collection.find({}))
    
    if not all_docs:
        print("❌ 'admins' 表里也没有数据，这太奇怪了！")
        return

    print(f"\n📋 在 'admins' 表中发现 {len(all_docs)} 条记录：")
    print("="*60)
    for idx, doc in enumerate(all_docs):
        name = doc.get('name') or doc.get('companyName') or doc.get('email') or "Unknown"
        print(f"[{idx}] ID: {doc['_id']} | Info: {name}")
    print("="*60)

    print("\n👉 输入你要【保留】的序号 (例如: 0):")
    try:
        keep_input = input("👉 输入序号: ")
        keep_indices = [int(i.strip()) for i in keep_input.split(',')]
        keep_ids = [all_docs[i]['_id'] for i in keep_indices]
    except:
        return

    ids_to_delete = [d['_id'] for d in all_docs if d['_id'] not in keep_ids]
    
    if not ids_to_delete:
        print("🎉 这里已经很干净了。")
        return

    confirm = input(f"💥 确定要删除这 {len(ids_to_delete)} 个公司记录吗？(yes): ")
    if confirm.lower() == "yes":
        collection.delete_many({"_id": {"$in": ids_to_delete}})
        print("✅ 终于删掉了！现在去网页刷新看看，它们应该消失了。")

if __name__ == "__main__":
    admin_sweep()