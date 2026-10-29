
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Food = require("./models/Food");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ================================
// 1. CẤU HÌNH CORS
// ================================
// Cho phép Frontend từ Codespaces và localhost gọi API.
app.use(cors());

app.use(express.json());

// Xử lý yêu cầu preflight CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// ================================
// 2. TRANG CHỦ VÀ KIỂM TRA SERVER
// ================================
app.get("/", (req, res) => {
  res.json({
    message: "FoodManager Backend đang hoạt động!",
    status: "OK",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    database: mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected",
  });
});

// ================================
// 3. LẤY DANH SÁCH MÓN ĂN
// ================================
app.get("/api/foods", async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search && search.trim()) {
      const keyword = search.trim();
      filter = {
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { foodId: { $regex: keyword, $options: "i" } },
          { category: { $regex: keyword, $options: "i" } },
          { cuisine: { $regex: keyword, $options: "i" } },
        ],
      };
    }

    const foods = await Food.find(filter).sort({ createdAt: -1 });
    res.json(foods);
  } catch (error) {
    console.error("Lỗi lấy danh sách món ăn:", error.message);
    res.status(500).json({
      message: "Không thể lấy danh sách món ăn",
      error: error.message,
    });
  }
});

// ================================
// 4. THÊM MÓN ĂN
// ================================
app.post("/api/foods", async (req, res) => {
  try {
    const food = await Food.create(req.body);

    res.status(201).json({
      message: "Thêm món ăn thành công",
      food,
    });
  } catch (error) {
    console.error("Lỗi thêm món ăn:", error.message);
    res.status(400).json({
      message: "Không thể thêm món ăn",
      error: error.message,
    });
  }
});

// ================================
// 5. TÌM MÓN ĂN THEO ID
// Hỗ trợ cả MongoDB _id và foodId
// ================================
async function findFoodById(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const food = await Food.findById(id);
    if (food) return food;
  }

  return Food.findOne({ foodId: id });
}

// ================================
// 6. CẬP NHẬT MÓN ĂN
// ================================
app.put("/api/foods/:id", async (req, res) => {
  try {
    const food = await findFoodById(req.params.id);

    if (!food) {
      return res.status(404).json({
        message: "Không tìm thấy món ăn",
      });
    }

    Object.assign(food, req.body);
    await food.save();

    res.json({
      message: "Cập nhật món ăn thành công",
      food,
    });
  } catch (error) {
    console.error("Lỗi cập nhật món ăn:", error.message);
    res.status(400).json({
      message: "Không thể cập nhật món ăn",
      error: error.message,
    });
  }
});

// ================================
// 7. XÓA MÓN ĂN
// ================================
app.delete("/api/foods/:id", async (req, res) => {
  try {
    const food = await findFoodById(req.params.id);

    if (!food) {
      return res.status(404).json({
        message: "Không tìm thấy món ăn",
      });
    }

    await food.deleteOne();

    res.json({
      message: "Xóa món ăn thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa món ăn:", error.message);
    res.status(400).json({
      message: "Không thể xóa món ăn",
      error: error.message,
    });
  }
});

// ================================
// 8. KẾT NỐI MONGODB VÀ KHỞI ĐỘNG
// ================================
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("Chưa cấu hình MONGODB_URI trong file .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB đã kết nối thành công!");
    console.log("Database:", mongoose.connection.name);
    console.log("Collection:", Food.collection.collectionName);

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Backend đang chạy tại cổng ${PORT}`);
    });
  } catch (error) {
    console.error("Lỗi khởi động Backend:", error.message);
    process.exit(1);
  }
}

startServer();
