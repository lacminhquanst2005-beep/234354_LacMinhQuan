
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const emptyFood = {
  foodId: "",
  name: "",
  category: "",
  cuisine: "",
  ingredients: "",
  price: "",
  quantity: "",
  description: "",
  imageUrl: "",
};

function getId(food) {
  return food._id || food.id;
}

function App() {
  const [foods, setFoods] = useState([]);
  const [form, setForm] = useState(emptyFood);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function request(url, options = {}) {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || `Lỗi HTTP ${response.status}`);
    }

    return data;
  }

  async function loadFoods(keyword = search) {
    setLoading(true);
    setError("");

    try {
      const query = keyword.trim()
        ? `?search=${encodeURIComponent(keyword.trim())}`
        : "";

      const data = await request(`/api/foods${query}`);
      const list = Array.isArray(data)
        ? data
        : data.foods || data.data || [];

      setFoods(list);
    } catch (err) {
      setError(`Không tải được danh sách món ăn: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFoods(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function resetForm() {
    setForm(emptyFood);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (
      !form.foodId.trim() ||
      !form.name.trim() ||
      !form.category.trim() ||
      form.price === "" ||
      form.quantity === ""
    ) {
      setError("Vui lòng nhập mã món, tên, loại món, giá và số lượng.");
      return;
    }

    if (
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0 ||
      !Number.isInteger(Number(form.quantity)) ||
      Number(form.quantity) < 0
    ) {
      setError("Giá phải là số không âm; số lượng phải là số nguyên không âm.");
      return;
    }

    const payload = {
      ...form,
      foodId: form.foodId.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      cuisine: form.cuisine.trim(),
      ingredients: Array.isArray(form.ingredients)
        ? form.ingredients
        : form.ingredients.split(",").map((item) => item.trim()).filter(Boolean),
      price: Number(form.price),
      quantity: Number(form.quantity),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
    };

    setSaving(true);

    try {
      if (editingId) {
        await request(`/api/foods/${encodeURIComponent(editingId)}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("Cập nhật món ăn thành công!");
      } else {
        await request("/api/foods", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Thêm món ăn thành công!");
      }

      resetForm();
      setSelectedFood(null);
      await loadFoods(search);
    } catch (err) {
      setError(`Không lưu được món ăn: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(food) {
    setForm({
      foodId: food.foodId || "",
      name: food.name || "",
      category: food.category || "",
      cuisine: food.cuisine || "",
      ingredients: Array.isArray(food.ingredients)
        ? food.ingredients.join(", ")
        : food.ingredients || "",
      price: food.price ?? "",
      quantity: food.quantity ?? "",
      description: food.description || "",
      imageUrl: food.imageUrl || "",
    });

    setEditingId(getId(food));
    setSelectedFood(null);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(food) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa món "${food.name}" không?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await request(`/api/foods/${encodeURIComponent(getId(food))}`, {
        method: "DELETE",
      });

      setMessage("Xóa món ăn thành công!");
      setSelectedFood(null);
      await loadFoods(search);
    } catch (err) {
      setError(`Không xóa được món ăn: ${err.message}`);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <a className="brand" href="#" onClick={(e) => {
            e.preventDefault();
            resetForm();
            setSelectedFood(null);
          }}>
            <span className="brand-icon">🍜</span>
            <span>Food<span className="brand-highlight">Manager</span></span>
          </a>

          <span className="header-label">HỆ THỐNG QUẢN LÝ MÓN ĂN</span>
        </div>
      </header>

      <main className="container">
        <section className="welcome">
          <div>
            <p className="eyebrow">QUẢN LÝ NHÀ HÀNG</p>
            <h1>Danh sách món ăn</h1>
            <p className="subtitle">
              Quản lý thực đơn và thông tin món ăn của bạn.
            </p>
          </div>
          <div className="welcome-icon">🍽️</div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <span className="stat-icon">🍱</span>
            <div>
              <p>Tổng số món</p>
              <strong>{foods.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">📦</span>
            <div>
              <p>Tổng số lượng</p>
              <strong>
                {foods.reduce((sum, food) => sum + (Number(food.quantity) || 0), 0)}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">🔎</span>
            <div>
              <p>Kết quả tìm kiếm</p>
              <strong>{foods.length}</strong>
            </div>
          </div>
        </section>

        {error && (
          <div className="notice error" role="alert">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {message && (
          <div className="notice success" role="status">
            <span>✓ {message}</span>
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        <section className="content-grid">
          <div className="panel form-panel">
            <div className="panel-heading">
              <div>
                <h2>{editingId ? "✏️ Cập nhật món ăn" : "＋ Thêm món ăn"}</h2>
                <p>Nhập thông tin món ăn bên dưới.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  Mã món ăn *
                  <input
                    name="foodId"
                    value={form.foodId}
                    onChange={handleChange}
                    placeholder="VD: MA001"
                    required
                  />
                </label>

                <label>
                  Tên món ăn *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="VD: Phở bò"
                    required
                  />
                </label>

                <label>
                  Loại món ăn *
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="VD: Món nước"
                    required
                  />
                </label>

                <label>
                  Ẩm thực / vùng miền
                  <input
                    name="cuisine"
                    value={form.cuisine}
                    onChange={handleChange}
                    placeholder="VD: Việt Nam"
                  />
                </label>

                <label>
                  Giá bán (VNĐ) *
                  <input
                    type="number"
                    min="0"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="VD: 45000"
                    required
                  />
                </label>

                <label>
                  Số lượng *
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    placeholder="VD: 20"
                    required
                  />
                </label>

                <label className="full-width">
                  Nguyên liệu
                  <input
                    name="ingredients"
                    value={form.ingredients}
                    onChange={handleChange}
                    placeholder="Bánh phở, thịt bò, hành..."
                  />
                  <small>Ngăn cách các nguyên liệu bằng dấu phẩy.</small>
                </label>

                <label className="full-width">
                  Đường dẫn hình ảnh
                  <input
                    type="url"
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/food.jpg"
                  />
                </label>

                <label className="full-width">
                  Mô tả
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Mô tả món ăn..."
                    rows="3"
                  />
                </label>
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving
                    ? "Đang lưu..."
                    : editingId
                    ? "Lưu thay đổi"
                    : "＋ Thêm món ăn"}
                </button>

                {editingId && (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={resetForm}
                  >
                    Hủy sửa
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel list-panel">
            <div className="panel-heading list-heading">
              <div>
                <h2>📋 Thực đơn</h2>
                <p>Danh sách món ăn từ cơ sở dữ liệu.</p>
              </div>
              <button
                className="btn btn-secondary refresh-btn"
                onClick={() => loadFoods(search)}
                disabled={loading}
              >
                ↻ Làm mới
              </button>
            </div>

            <div className="search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên, loại món hoặc vùng miền..."
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Xóa từ khóa">
                  ×
                </button>
              )}
            </div>

            {loading ? (
              <div className="empty-state">
                <span className="spinner" />
                <p>Đang tải danh sách món ăn...</p>
              </div>
            ) : foods.length === 0 ? (
              <div className="empty-state">
                <span>🍽️</span>
                <h3>Chưa có món ăn</h3>
                <p>Thử tìm từ khóa khác hoặc thêm món ăn mới.</p>
              </div>
            ) : (
              <div className="food-list">
                {foods.map((food) => (
                  <article className="food-card" key={getId(food)}>
                    <div className="food-image">
                      {food.imageUrl ? (
                        <img
                          src={food.imageUrl}
                          alt={food.name}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <span
                        className="food-placeholder"
                        style={{ display: food.imageUrl ? "none" : "flex" }}
                      >
                        🍲
                      </span>
                    </div>

                    <div className="food-info">
                      <span className="food-category">
                        {food.category || "Chưa phân loại"}
                      </span>
                      <h3>{food.name}</h3>
                      <p className="food-region">
                        {food.cuisine || "Chưa cập nhật vùng miền"}
                      </p>
                      <strong className="food-price">
                        {Number(food.price || 0).toLocaleString("vi-VN")} ₫
                      </strong>
                      <p className="food-quantity">
                        Số lượng: {food.quantity ?? 0}
                      </p>

                      <div className="food-actions">
                        <button
                          className="btn btn-detail"
                          onClick={() => setSelectedFood(food)}
                        >
                          Chi tiết
                        </button>
                        <button
                          className="btn btn-edit"
                          onClick={() => handleEdit(food)}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(food)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {selectedFood && (
          <div className="modal-backdrop" onClick={() => setSelectedFood(null)}>
            <section
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="detail-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-heading">
                <h2 id="detail-title">Chi tiết món ăn</h2>
                <button
                  className="close-btn"
                  onClick={() => setSelectedFood(null)}
                  aria-label="Đóng"
                >
                  ×
                </button>
              </div>

              {selectedFood.imageUrl && (
                <img
                  className="detail-image"
                  src={selectedFood.imageUrl}
                  alt={selectedFood.name}
                />
              )}

              <h3>{selectedFood.name}</h3>
              <p><b>Mã món:</b> {selectedFood.foodId}</p>
              <p><b>Loại món:</b> {selectedFood.category}</p>
              <p><b>Vùng miền:</b> {selectedFood.cuisine || "Chưa có"}</p>
              <p><b>Nguyên liệu:</b> {
                Array.isArray(selectedFood.ingredients)
                  ? selectedFood.ingredients.join(", ")
                  : selectedFood.ingredients || "Chưa có"
              }</p>
              <p><b>Giá bán:</b> {Number(selectedFood.price || 0).toLocaleString("vi-VN")} ₫</p>
              <p><b>Số lượng:</b> {selectedFood.quantity ?? 0}</p>
              <p><b>Mô tả:</b> {selectedFood.description || "Chưa có mô tả"}</p>

              <div className="form-actions">
                <button
                  className="btn btn-edit"
                  onClick={() => handleEdit(selectedFood)}
                >
                  Sửa món ăn
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedFood(null)}
                >
                  Đóng
                </button>
              </div>
            </section>
          </div>
        )}

        <footer className="footer">
          <p>FoodManager · Hệ thống quản lý món ăn trên nền tảng đám mây</p>
          <p>React · Node.js · Express · MongoDB Atlas</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
