const express = require("express");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// استخدام مجلد /tmp المسموح به في Vercel
const DATA_DIR = "/tmp";
const UPLOADS_DIR = "/tmp";

const STORE_FILE = path.join(DATA_DIR, "store.json");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET_123";

app.use(cors());
app.use(express.json());

// الذاكرة المؤقتة لمنع الكراش
let memoryStore = {
    name: "اسم المحل",
    logo: "",
    whatsapp: "201000000000",
    phone: "",
    address: "عنوان المحل",
    description: "أهلاً بكم في متجرنا"
};
let memoryProducts = [];
let memoryOrders = [];

function ensureFiles() {
    try {
        if (!fs.existsSync(STORE_FILE)) {
            fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2));
        }
        if (!fs.existsSync(PRODUCTS_FILE)) {
            fs.writeFileSync(PRODUCTS_FILE, "[]");
        }
        if (!fs.existsSync(ORDERS_FILE)) {
            fs.writeFileSync(ORDERS_FILE, "[]");
        }
    } catch (e) {
        console.warn("بيئة التشغيل للقراءة فقط - استخدام الذاكرة المؤقتة.");
    }
}

ensureFiles();

function readJSON(file, fallback) {
    try {
        if (fs.existsSync(file)) {
            return JSON.parse(fs.readFileSync(file, "utf8"));
        }
    } catch (e) {
        console.error("خطأ قراءة الملف:", e);
    }
    return fallback;
}

function writeJSON(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (e) {
        console.warn("تعذر الكتابة على القرص:", e.message);
    }
}

// إعداد Multer للحفظ داخل /tmp
const upload = multer({
    dest: UPLOADS_DIR
});

function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "غير مصرح" });
    }

    const token = header.split(" ")[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ message: "الجلسة انتهت" });
    }
}

/* =========================
   STORE
========================= */

app.get("/api/store", (req, res) => {
    res.json(readJSON(STORE_FILE, memoryStore));
});

app.put("/api/store", auth, upload.single("logo"), (req, res) => {
    try {
        const store = readJSON(STORE_FILE, memoryStore);

        store.name = req.body.name || store.name;
        store.whatsapp = req.body.whatsapp || store.whatsapp;
        store.phone = req.body.phone || store.phone;
        store.address = req.body.address || store.address;
        store.description = req.body.description || store.description;

        if (req.file) {
            store.logo = "/uploads/" + req.file.filename;
        }

        memoryStore = store;
        writeJSON(STORE_FILE, store);

        res.json(store);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   PRODUCTS
========================= */

app.get("/api/products", (req, res) => {
    res.json(readJSON(PRODUCTS_FILE, memoryProducts));
});

app.post("/api/products", auth, upload.single("image"), (req, res) => {
    try {
        const products = readJSON(PRODUCTS_FILE, memoryProducts);

        const product = {
            id: Date.now().toString(),
            name: req.body.name || "",
            price: Number(req.body.price || 0),
            category: req.body.category || "أخرى",
            sizes: req.body.sizes || "",
            colors: req.body.colors || "",
            description: req.body.description || "",
            image: req.file ? "/uploads/" + req.file.filename : ""
        };

        products.push(product);
        memoryProducts = products;
        writeJSON(PRODUCTS_FILE, products);

        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/products/:id", auth, upload.single("image"), (req, res) => {
    try {
        const products = readJSON(PRODUCTS_FILE, memoryProducts);
        const index = products.findIndex(p => p.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ message: "المنتج غير موجود" });
        }

        products[index].name = req.body.name || products[index].name;
        products[index].price = Number(req.body.price || products[index].price);
        products[index].category = req.body.category || products[index].category;
        products[index].sizes = req.body.sizes || products[index].sizes;
        products[index].colors = req.body.colors || products[index].colors;
        products[index].description = req.body.description || products[index].description;

        if (req.file) {
            products[index].image = "/uploads/" + req.file.filename;
        }

        memoryProducts = products;
        writeJSON(PRODUCTS_FILE, products);

        res.json(products[index]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/products/:id", auth, (req, res) => {
    try {
        let products = readJSON(PRODUCTS_FILE, memoryProducts);
        products = products.filter(p => p.id !== req.params.id);

        memoryProducts = products;
        writeJSON(PRODUCTS_FILE, products);

        res.json({ message: "تم حذف المنتج" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   ORDERS
========================= */

app.get("/api/orders", auth, (req, res) => {
    res.json(readJSON(ORDERS_FILE, memoryOrders));
});

app.post("/api/orders", (req, res) => {
    try {
        const orders = readJSON(ORDERS_FILE, memoryOrders);

        const order = {
            id: Date.now().toString(),
            customerName: req.body.customerName || "",
            phone: req.body.phone || "",
            address: req.body.address || "",
            productName: req.body.productName || "",
            size: req.body.size || "",
            color: req.body.color || "",
            quantity: Number(req.body.quantity || 1),
            createdAt: new Date().toISOString(),
            status: "جديد"
        };

        orders.push(order);
        memoryOrders = orders;
        writeJSON(ORDERS_FILE, order);

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/orders/:id", auth, (req, res) => {
    try {
        const orders = readJSON(ORDERS_FILE, memoryOrders);
        const order = orders.find(o => o.id === req.params.id);

        if (!order) {
            return res.status(404).json({ message: "الأوردر غير موجود" });
        }

        order.status = req.body.status || order.status;
        memoryOrders = orders;
        writeJSON(ORDERS_FILE, orders);

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   LOGIN
========================= */

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const correctUsername = process.env.ADMIN_USERNAME || "admin";
    const correctPassword = process.env.ADMIN_PASSWORD || "123456";

    if (username !== correctUsername || password !== correctPassword) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة السر غير صحيحة" });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
});

module.exports = app;