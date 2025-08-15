import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function CategoriesManager() {
  // form states (create)
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("");
  const [typeName, setTypeName] = useState("");
  const [typeCat, setTypeCat] = useState("");

  // edit states (update)
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("");

  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editTypeName, setEditTypeName] = useState("");
  const [editTypeCat, setEditTypeCat] = useState("");

  // data
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const showMsg = (text, variant = "success") => {
    setMsg({ text, variant });
    setTimeout(() => setMsg(null), 2000);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        api.get("/categories/all"), // แอดมินเห็นทั้งหมด
        api.get("/types"),
      ]);
      setCategories(c.data || []);
      setTypes(t.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ------ CREATE ------
  const createCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await api.post("/categories", { name: catName, icon: catIcon });
      setCatName("");
      setCatIcon("");
      await loadAll();
      showMsg("สร้างหมวดหมู่แล้ว");
    } catch (e) {
      const status = e.response?.status;
      const msg =
        e.response?.data?.message ||
        (status === 401
          ? "ต้องเข้าสู่ระบบ"
          : status === 403
          ? "ต้องเป็นผู้ดูแลระบบ (admin)"
          : status === 409
          ? "มีชื่อซ้ำอยู่แล้ว"
          : "เกิดข้อผิดพลาด");
      showMsg(msg, "error");
    }
  };

  const createType = async (e) => {
    e.preventDefault();
    if (!typeName.trim() || !typeCat) return;
    try {
      await api.post("/types", { name: typeName, category: typeCat });
      setTypeName("");
      await loadAll();
      showMsg("สร้างประเภทแล้ว");
    } catch (e) {
      const status = e.response?.status;
      const msg =
        e.response?.data?.message ||
        (status === 401
          ? "ต้องเข้าสู่ระบบ"
          : status === 403
          ? "ต้องเป็นผู้ดูแลระบบ (admin)"
          : status === 409
          ? "มีชื่อซ้ำอยู่แล้ว"
          : "เกิดข้อผิดพลาด");
      showMsg(msg, "error");
    }
  };

  // ------ UPDATE (Category) ------
  const startEditCategory = (c) => {
    setEditingCatId(c._id);
    setEditCatName(c.name || "");
    setEditCatIcon(c.icon || "");
  };

  const cancelEditCategory = () => {
    setEditingCatId(null);
    setEditCatName("");
    setEditCatIcon("");
  };

  const saveCategory = async () => {
    if (!editingCatId || !editCatName.trim()) return;
    try {
      await api.patch(`/categories/${editingCatId}`, {
        name: editCatName,
        icon: editCatIcon,
      });
      await loadAll();
      cancelEditCategory();
      showMsg("อัปเดตหมวดหมู่แล้ว");
    } catch (e) {
      showMsg(e?.response?.data?.message || "เกิดข้อผิดพลาด", "error");
    }
  };

  // toggle active (Category)
  const toggleCategoryActive = async (id, current) => {
    try {
      await api.patch(`/categories/${id}`, { isActive: !current });
      await loadAll();
      showMsg(!current ? "ตั้งค่าเป็น: แสดง" : "ตั้งค่าเป็น: ซ่อน");
    } catch (e) {
      showMsg(e?.response?.data?.message || "เกิดข้อผิดพลาด", "error");
    }
  };

  // ------ DELETE (Category) ------
  const deleteCategory = async (id) => {
    if (!confirm("ลบหมวดนี้ (ลบประเภทใต้หมวดด้วย)?")) return;
    try {
      await api.delete(`/categories/${id}`);
      await loadAll();
      showMsg("ลบหมวดหมู่แล้ว");
    } catch (e) {
      showMsg(e?.response?.data?.message || "เกิดข้อผิดพลาด", "error");
    }
  };

  // ------ UPDATE (Type) ------
  const startEditType = (t) => {
    setEditingTypeId(t._id);
    setEditTypeName(t.name || "");
    setEditTypeCat(t.category?._id || "");
  };

  const cancelEditType = () => {
    setEditingTypeId(null);
    setEditTypeName("");
    setEditTypeCat("");
  };

  const saveType = async () => {
    if (!editingTypeId || !editTypeName.trim() || !editTypeCat) return;
    try {
      await api.patch(`/types/${editingTypeId}`, {
        name: editTypeName,
        category: editTypeCat,
      });
      await loadAll();
      cancelEditType();
      showMsg("อัปเดตประเภทแล้ว");
    } catch (e) {
      showMsg(e?.response?.data?.message || "เกิดข้อผิดพลาด", "error");
    }
  };

  // ------ DELETE (Type) ------
  const deleteType = async (id) => {
    if (!confirm("ลบประเภทนี้?")) return;
    try {
      await api.delete(`/types/${id}`);
      await loadAll();
      showMsg("ลบประเภทแล้ว");
    } catch (e) {
      showMsg(e?.response?.data?.message || "เกิดข้อผิดพลาด", "error");
    }
  };

  // ----------------- UI -----------------
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* flash message */}
      {msg && (
        <div
          className={`lg:col-span-2 p-3 rounded-xl ${
            msg.variant === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
              : "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Categories */}
      <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          หมวดหมู่
        </h3>

        {/* Create form */}
        <form
          onSubmit={createCategory}
          className="flex flex-col sm:flex-row gap-2 mb-4"
        >
          <input
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 outline-none dark:placeholder:text-gray-400 text-gray-800 dark:text-gray-100"
            placeholder="ชื่อหมวดหมู่ เช่น บ้านเช่า"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />
          <input
            className="sm:w-56 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 outline-none dark:placeholder:text-gray-400 text-gray-800 dark:text-gray-100"
            placeholder="Icon URL (ไม่บังคับ)"
            value={catIcon}
            onChange={(e) => setCatIcon(e.target.value)}
          />
          <button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto">
            เพิ่ม
          </button>
        </form>

        {/* Desktop table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10">
                <th className="py-2 pr-4">ชื่อ</th>
                <th className="py-2 pr-4">Slug</th>
                <th className="py-2 pr-4">ไอคอน</th>
                <th className="py-2 pr-4">สถานะ</th>
                <th className="py-2 pr-0 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-3 text-gray-500 dark:text-gray-400">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td className="py-3 text-gray-500 dark:text-gray-400">
                    ยังไม่มีหมวดหมู่
                  </td>
                </tr>
              ) : (
                categories.map((c) => {
                  const isEditing = editingCatId === c._id;
                  return (
                    <tr
                      key={c._id}
                      className="border-b last:border-0 border-gray-100 dark:border-white/5"
                    >
                      <td className="py-2 pr-4 text-gray-800 dark:text-gray-100">
                        {isEditing ? (
                          <input
                            className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                          />
                        ) : (
                          c.name
                        )}
                      </td>

                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">
                        {isEditing ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            (Slug จะอัปเดตอัตโนมัติ)
                          </span>
                        ) : (
                          c.slug
                        )}
                      </td>

                      <td className="py-2 pr-4">
                        {isEditing ? (
                          <input
                            className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                            value={editCatIcon}
                            onChange={(e) => setEditCatIcon(e.target.value)}
                            placeholder="Icon URL"
                          />
                        ) : c.icon ? (
                          <img
                            src={c.icon}
                            alt=""
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              c.isActive
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                                : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                            }`}
                          >
                            {c.isActive ? "แสดง" : "ซ่อน"}
                          </span>
                          {!isEditing && (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={c.isActive}
                              onClick={() =>
                                toggleCategoryActive(c._id, c.isActive)
                              }
                              className={`inline-flex h-6 w-11 items-center rounded-full transition focus:outline-none ${
                                c.isActive
                                  ? "bg-emerald-500"
                                  : "bg-gray-300 dark:bg-white/10"
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                  c.isActive ? "translate-x-5" : "translate-x-1"
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-2 pr-0 text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={saveCategory}
                              disabled={!editCatName.trim()}
                              className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              บันทึก
                            </button>
                            <button
                              onClick={cancelEditCategory}
                              className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => startEditCategory(c)}
                              className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => deleteCategory(c._id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs bg-rose-600 text-white hover:bg-rose-700"
                            >
                              ลบ
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {loading ? (
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse h-20" />
          ) : categories.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ยังไม่มีหมวดหมู่
            </div>
          ) : (
            categories.map((c) => {
              const isEditing = editingCatId === c._id;
              return (
                <div
                  key={c._id}
                  className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                      {c.icon ? (
                        <img
                          src={c.icon}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">no icon</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <>
                          <input
                            className="w-full mb-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                            placeholder="ชื่อหมวด"
                          />
                          <input
                            className="w-full mb-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                            value={editCatIcon}
                            onChange={(e) => setEditCatIcon(e.target.value)}
                            placeholder="Icon URL"
                          />
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            (Slug จะอัปเดตอัตโนมัติ)
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {c.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {c.slug}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                c.isActive
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                                  : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                              }`}
                            >
                              {c.isActive ? "แสดง" : "ซ่อน"}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={c.isActive}
                              onClick={() =>
                                toggleCategoryActive(c._id, c.isActive)
                              }
                              className={`inline-flex h-6 w-11 items-center rounded-full transition focus:outline-none ${
                                c.isActive
                                  ? "bg-emerald-500"
                                  : "bg-gray-300 dark:bg-white/10"
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                  c.isActive ? "translate-x-5" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        </>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveCategory}
                              disabled={!editCatName.trim()}
                              className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              บันทึก
                            </button>
                            <button
                              onClick={cancelEditCategory}
                              className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200"
                            >
                              ยกเลิก
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditCategory(c)}
                              className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => deleteCategory(c._id)}
                              className="ml-auto px-2.5 py-1.5 rounded-lg text-xs bg-rose-600 text-white hover:bg-rose-700"
                            >
                              ลบ
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Property Types */}
      <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          ประเภท (ผูกกับหมวด)
        </h3>

        {/* Create form */}
        <form
          onSubmit={createType}
          className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4"
        >
          <input
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 outline-none dark:placeholder:text-gray-400 text-gray-800 dark:text-gray-100"
            placeholder="ชื่อประเภท เช่น บ้านเดี่ยว"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
          />
          <select
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 outline-none text-gray-800 dark:text-gray-100"
            value={typeCat}
            onChange={(e) => setTypeCat(e.target.value)}
          >
            <option value="">เลือกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto">
            เพิ่ม
          </button>
        </form>

        {/* Desktop table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10">
                <th className="py-2 pr-4">ชื่อ</th>
                <th className="py-2 pr-4">Slug</th>
                <th className="py-2 pr-4">หมวดหมู่</th>
                <th className="py-2 pr-0 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-3 text-gray-500 dark:text-gray-400">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : types.length === 0 ? (
                <tr>
                  <td className="py-3 text-gray-500 dark:text-gray-400">
                    ยังไม่มีประเภท
                  </td>
                </tr>
              ) : (
                types.map((t) => {
                  const isEditing = editingTypeId === t._id;
                  return (
                    <tr
                      key={t._id}
                      className="border-b last:border-0 border-gray-100 dark:border-white/5"
                    >
                      <td className="py-2 pr-4 text-gray-800 dark:text-gray-100">
                        {isEditing ? (
                          <input
                            className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                            value={editTypeName}
                            onChange={(e) => setEditTypeName(e.target.value)}
                          />
                        ) : (
                          t.name
                        )}
                      </td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">
                        {isEditing ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            (Slug จะอัปเดตอัตโนมัติ)
                          </span>
                        ) : (
                          t.slug
                        )}
                      </td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">
                        {isEditing ? (
                          <select
                            className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                            value={editTypeCat}
                            onChange={(e) => setEditTypeCat(e.target.value)}
                          >
                            <option value="">เลือกหมวดหมู่</option>
                            {categories.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          t.category?.name
                        )}
                      </td>
                      <td className="py-2 pr-0 text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={saveType}
                              disabled={!editTypeName.trim() || !editTypeCat}
                              className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              บันทึก
                            </button>
                            <button
                              onClick={cancelEditType}
                              className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => startEditType(t)}
                              className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => deleteType(t._id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs bg-rose-600 text-white hover:bg-rose-700"
                            >
                              ลบ
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {loading ? (
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse h-20" />
          ) : types.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ยังไม่มีประเภท
            </div>
          ) : (
            types.map((t) => {
              const isEditing = editingTypeId === t._id;
              return (
                <div
                  key={t._id}
                  className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <>
                          <input
                            className="w-full mb-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                            value={editTypeName}
                            onChange={(e) => setEditTypeName(e.target.value)}
                            placeholder="ชื่อประเภท"
                          />
                          <select
                            className="w-full mb-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                            value={editTypeCat}
                            onChange={(e) => setEditTypeCat(e.target.value)}
                          >
                            <option value="">เลือกหมวดหมู่</option>
                            {categories.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            (Slug จะอัปเดตอัตโนมัติ)
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {t.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {t.slug}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 truncate mt-1">
                            หมวด: {t.category?.name || "-"}
                          </div>
                        </>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveType}
                              disabled={!editTypeName.trim() || !editTypeCat}
                              className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              บันทึก
                            </button>
                            <button
                              onClick={cancelEditType}
                              className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                              ยกเลิก
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditType(t)}
                              className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => deleteType(t._id)}
                              className="ml-auto px-2.5 py-1.5 rounded-lg text-xs bg-rose-600 text-white hover:bg-rose-700"
                            >
                              ลบ
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
